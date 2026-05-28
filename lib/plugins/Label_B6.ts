import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label B6 (`/` sub-format) — ADS-C "Provide ADS Report"
 *
 * ARINC-622-framed FANS-1/A ADS-C surveillance message. Carries periodic
 * or on-demand aircraft position surveillance data under an ADS-C contract.
 *
 * Wire format:
 *
 *   J7 0A QR040X / MELCAYA .ADS. A7-ANT 030BA821
 *   |  |   |      |        |     |      |
 *   |  |   |      |        |     |      └ ADS-C payload, ASN.1 / FANS-1/A
 *   |  |   |      |        |     |        ADS-C encoding (hex)
 *   |  |   |      |        |     └────── Aircraft registration (tail)
 *   |  |   |      |        └──────────── Literal `.ADS.` marker
 *   |  |   |      └───────────────────── Ground-station ARINC address (5–9 chars)
 *   |  |   └──────────────────────────── Flight ID (IATA/ICAO callsign)
 *   |  └──────────────────────────────── Message-number block (1–3 chars;
 *   |                                     often a padding 'A' after the msg#)
 *   └─────────────────────────────────── Sublabel (typ. `J7` for ADS-C,
 *                                         `14` for CPDLC, etc.)
 *
 * Reference examples:
 *   14ASQ0431/SKYSWSQ.ADS.9V-SMI070286A9E26ACA0320401F0E1E88DA00001033927E36F282
 *   J70AQR040X/MELCAYA.ADS.A7-ANT030BA821
 *
 * The ADS-C hex payload is preserved verbatim — a full FANS-1/A ADS-C
 * decode (basic report: lat/lon/alt/time/quality) requires an ASN.1 PER
 * decoder and is deferred to downstream tooling (libacars et al).
 *
 * Short payloads (≤ 8 hex chars) are too brief to carry a basic position
 * report and are typically contract-setup / periodic-contract-request /
 * control-plane messages; this is annotated in the formatted output but
 * no semantic interpretation is invented.
 */
export class Label_B6_Forwardslash extends DecoderPlugin {
  name = 'label-b6-forwardslash';

  qualifiers() {
    return {
      labels: ['B6'],
      preambles: ['/', 'J', '1'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'FANS-1/A ADS-C Provide ADS Report',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Envelope: <sublabel:2><msgblock:1-2><flight>/<ground>.ADS.<tail+payload>
    //
    // Flight is a 2- or 3-letter airline code followed by 1-4 digits and an
    // optional trailing letter (e.g. QR040X, SQ0431). Because a 2-char
    // msg-block can "steal" what looks like an airline letter (e.g. the 'A'
    // padding in J70A|QR040X), we try a 2-char msg-block first, then fall
    // back to 1 char — the first one that produces a valid-looking flight
    // (i.e. that the regex accepts) wins.
    const envelopeRe = (msgLen: number) =>
      new RegExp(
        `^(?<sublabel>[A-Z0-9]{2})(?<msgblock>[A-Z0-9]{${msgLen}})(?<flight>[A-Z]{2,3}\\d{1,4}[A-Z]?)\\/(?<ground>[A-Z0-9]{5,9})\\.ADS\\.(?<rest>.+)$`,
      );
    // Form 3 — direct `/GROUND.ADS.TAIL<payload>` (no sublabel/flight prefix).
    // Observed on some FANS-1/A ADS-C periodic reports, e.g.
    //   /RPHIAYA.ADS.HL8501070ED832A9374985A7941D0E...
    const directRe = /^\/(?<ground>[A-Z0-9]{5,9})\.ADS\.(?<rest>.+)$/;

    const m =
      text.match(envelopeRe(2)) ||
      text.match(envelopeRe(1)) ||
      text.match(envelopeRe(0)) ||
      text.match(directRe);
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const sublabel = (m.groups as any).sublabel as string | undefined;
    const msgBlock = (m.groups as any).msgblock as string | undefined;
    const flight = (m.groups as any).flight as string | undefined;
    const ground = m.groups.ground;
    const rest = m.groups.rest;

    // Tail/payload split — try a cascade of known ICAO registration
    // patterns first (same approach as the AA CPDLC plugin). Digits look
    // identical to hex payload bytes, so a naive non-hex-scan truncates
    // registrations like HL8501 to "HL". The first candidate that leaves
    // a pure-hex tail wins.
    const tailCandidates: RegExp[] = [
      /^(HL\d{4})/,                  // Korea
      /^(JA\d{1,4}[A-Z]?)/,          // Japan
      /^([A-Z]-\d{4,5})/,            // B-NNNN / B-NNNNN (Taiwan/China)
      /^([A-Z]{1,2}-[A-Z0-9]{3,5})/, // A7-ANT, 9V-SMI, LN-RKN, etc.
      /^(N\d{1,5}[A-Z]{0,2})/,       // US N-numbers
    ];
    let tail = '';
    let payload = '';
    for (const re of tailCandidates) {
      const cm = rest.match(re);
      if (!cm) continue;
      const cand = cm[1];
      const afterCand = rest.substring(cand.length);
      if (/^[0-9A-F]*$/i.test(afterCand)) {
        tail = cand;
        payload = afterCand.toUpperCase();
        break;
      }
    }
    if (!tail) {
      // Fallback: non-hex scan in the first 8 chars
      const window = rest.substring(0, Math.min(8, rest.length));
      let lastNonHex = -1;
      for (let i = 0; i < window.length; i++) {
        if (!/[0-9A-F]/.test(window[i])) lastNonHex = i;
      }
      if (lastNonHex >= 0) {
        tail = rest.substring(0, lastNonHex + 1);
        payload = rest.substring(lastNonHex + 1);
      } else {
        tail = rest.substring(0, 6);
        payload = rest.substring(6);
      }
    }

    if (sublabel) decodeResult.raw.sublabel = sublabel;
    if (msgBlock) decodeResult.raw.message_number = msgBlock;
    if (flight) {
      decodeResult.raw.flight_id = flight;
      ResultFormatter.flightNumber(decodeResult, flight);
    }
    decodeResult.raw.ground_address = ground;
    decodeResult.raw.tail = tail;
    ResultFormatter.tail(decodeResult, tail);
    decodeResult.raw.ads_payload_hex = payload;

    // The first byte of the ADS payload is the ADS Contract Request Number —
    // identifies which ADS contract this periodic report is fulfilling.
    // This is the one structured field we surface from the binary payload;
    // the rest (lat/lon/alt/time/group tags) requires the full ARINC-745
    // FANS-1/A specification to decode reliably and is left to downstream
    // tooling such as libacars.
    let contractReqNum: number | null = null;
    if (/^[0-9A-F]{2,}/i.test(payload)) {
      contractReqNum = parseInt(payload.substring(0, 2), 16);
      decodeResult.raw.ads_contract_request_number = contractReqNum;
    }

    const payloadIsShort = payload.length > 0 && payload.length <= 8;
    if (payloadIsShort) {
      decodeResult.raw.ads_payload_note =
        'short payload — likely contract-setup / periodic-contract-request / control-plane message (too brief for a basic position report)';
    }

    decodeResult.formatted.items.unshift({
      type: 'message_type',
      code: 'MSGTYP',
      label: 'Message Type',
      value: 'FANS-1/A ADS-C "Provide ADS Report"',
    });
    if (sublabel) {
      decodeResult.formatted.items.push({
        type: 'sublabel',
        code: 'SUBLBL',
        label: 'Sublabel',
        value: sublabel,
      });
    }

    if (msgBlock) {
      decodeResult.formatted.items.push({
        type: 'message_number',
        code: 'MSGNUM',
        label: 'Message Number Block',
        value: msgBlock,
      });
    }

    decodeResult.formatted.items.push({
      type: 'ground_address',
      code: 'GND',
      label: 'Ground Address',
      value: ground,
    });
    if (contractReqNum !== null) {
      decodeResult.formatted.items.push({
        type: 'ads_contract_request_number',
        code: 'ADSREQ',
        label: 'ADS Contract Request #',
        value: String(contractReqNum),
      });
    }
    decodeResult.formatted.items.push({
      type: 'ads_payload',
      code: 'ADSPAYLD',
      label: 'ADS-C Payload (hex)',
      value: payload || '(none)',
    });

    if (payloadIsShort) {
      decodeResult.formatted.items.push({
        type: 'ads_payload_note',
        code: 'ADSNOTE',
        label: 'Payload Note',
        value:
          'Short payload — likely a contract-setup / periodic-contract-request / control-plane message (too brief for a basic position report).',
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
