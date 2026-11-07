import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

/**
 * Label A6 — Request ADS Report (RAR) / ADS-C contract messages
 *
 * ARINC 620 §4.5.6 defines label A6 as "Request ADS Reports". The body
 * is an ARINC-622 ATS application wrapping an ADS-C protocol message,
 * commonly used on oceanic/remote routes to set up Automatic Dependent
 * Surveillance–Contract reporting between a ground facility and the
 * aircraft's FMS/FANS avionics.
 *
 * Wire format:
 *
 *   / NYCODYA . ADS . N183AM 0804140A28C4 01
 *   | |       |  |  | |      |            |
 *   | |       |  |  | |      |            └── Possible trailing CRC (often 4 hex chars, sometimes absent/shorter)
 *   | |       |  |  | |      └─────────────── ADS-C binary payload, hex-encoded (contract parameters)
 *   | |       |  |  | └────────────────────── Air-station address (aircraft registration / tail)
 *   | |       |  |  └──────────────────────── Separator
 *   | |       |  └─────────────────────────── IMI (Embedded Message Identifier), typ. "ADS"
 *   | |       └────────────────────────────── Separator
 *   | └────────────────────────────────────── Ground-station ATS facility address (6–8 chars)
 *   └──────────────────────────────────────── ARINC-622 message-start delimiter
 *
 * The plugin is tolerant: if the air-address / payload boundary can't be
 * determined cleanly (e.g. the tail contains only hex characters), the
 * raw trailing data is still exposed for the user under `air_data`.
 */
export class Label_A6_ADS extends DecoderPlugin {
  name = 'label-a6-ads';

  qualifiers() {
    return {
      labels: ['A6'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Request ADS Reports (RAR — ADS-C contract, uplink)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // 1) Envelope: /GROUND.IMI.REST
    const envelope = /^\/(?<ground>[A-Z0-9]{5,9})\.(?<imi>[A-Z]{2,4})\.(?<rest>.+)$/;
    const env = text.match(envelope);
    if (!env?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { ground, imi, rest } = env.groups;
    decodeResult.raw.ground_address = ground;
    decodeResult.raw.imi = imi;

    // 2) Split `rest` into air-address (tail) and hex payload.
    //    Heuristic: look at the first 8 chars and find the last non-hex
    //    character position `p`. If p >= 3, use p+1 as the split (tail is
    //    chars 0..p inclusive). Otherwise default to a 6-char tail,
    //    which is the most common registration length.
    let tailLen = 6;
    const window = rest.substring(0, Math.min(8, rest.length));
    let lastNonHexIdx = -1;
    for (let i = 0; i < window.length; i++) {
      if (!/[0-9A-F]/.test(window[i])) lastNonHexIdx = i;
    }
    if (lastNonHexIdx >= 3) {
      tailLen = lastNonHexIdx + 1;
    }
    tailLen = Math.min(tailLen, rest.length);

    const tailGuess = rest.substring(0, tailLen);
    const afterTail = rest.substring(tailLen);

    // Validate that afterTail is all-hex; if not, shorten tail until it is
    // (covers the case where our heuristic over-included a hex-only
    // trailing character into the tail).
    let adjTail = tailGuess;
    let adjAfter = afterTail;
    let adjustments = 0;
    while (
      adjAfter &&
      !/^[0-9A-F]+$/.test(adjAfter) &&
      adjTail.length > 4 &&
      adjustments < 4
    ) {
      adjTail = adjTail.substring(0, adjTail.length - 1);
      adjAfter = rest.substring(adjTail.length);
      adjustments++;
    }

    const hexOK = /^[0-9A-F]+$/.test(adjAfter);
    let payload = '';
    let crc: string | null = null;

    if (hexOK && adjAfter.length >= 4) {
      // Standard ARINC-622 CRC is 4 hex digits. If the remainder is long
      // enough, split the last 4 as the CRC. If only 2 hex digits remain
      // after a substantial payload (e.g. 12 hex + 2 = 14), we keep the
      // last 2 as `crc_or_tail_byte` (uncertain per the ARINC spec).
      if (adjAfter.length >= 8) {
        payload = adjAfter.substring(0, adjAfter.length - 4);
        crc = adjAfter.substring(adjAfter.length - 4);
      } else if (adjAfter.length >= 6) {
        payload = adjAfter.substring(0, adjAfter.length - 2);
        crc = adjAfter.substring(adjAfter.length - 2);
      } else {
        // 4 or 5 chars — too short to split confidently
        payload = adjAfter;
      }
      decodeResult.raw.tail = adjTail;
      decodeResult.raw.ads_payload_hex = payload;
      if (crc) decodeResult.raw.crc_hex = crc;
    } else {
      // Couldn't parse air/payload cleanly — expose the whole rest
      decodeResult.raw.air_data = rest;
    }

    // ── Formatted items (one row per field) ──
    decodeResult.formatted.items.push(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value:
          imi === 'ADS'
            ? 'Request ADS Report (RAR) — ADS-C contract'
            : `ARINC-622 ATS (IMI ${imi})`,
      },
      {
        type: 'direction',
        code: 'DIR',
        label: 'Direction',
        value: 'Uplink (ground → aircraft)',
      },
      {
        type: 'ground_address',
        code: 'GNDADDR',
        label: 'Ground ATS Facility',
        value: ground,
      },
      {
        type: 'imi',
        code: 'IMI',
        label: 'IMI (Embedded Message ID)',
        value: imi === 'ADS' ? 'ADS (ADS-C protocol)' : imi,
      },
    );

    if (decodeResult.raw.tail) {
      decodeResult.formatted.items.push({
        type: 'tail',
        code: 'TAIL',
        label: 'Aircraft Registration',
        value: String(decodeResult.raw.tail),
      });
    }
    if (decodeResult.raw.ads_payload_hex) {
      const hex = String(decodeResult.raw.ads_payload_hex);
      decodeResult.formatted.items.push({
        type: 'payload_hex',
        code: 'PAYLOAD',
        label: 'ADS-C Payload (hex)',
        value: `${hex} (${hex.length / 2} bytes)`,
      });
    }
    if (decodeResult.raw.crc_hex) {
      const c = String(decodeResult.raw.crc_hex);
      decodeResult.formatted.items.push({
        type: 'crc',
        code: 'CRC',
        label: 'CRC (trailing hex)',
        value: c.length === 4 ? `${c} (4-hex standard CRC)` : `${c} (short — possibly payload byte)`,
      });
    }
    if (decodeResult.raw.air_data) {
      decodeResult.formatted.items.push({
        type: 'air_data',
        code: 'AIRDATA',
        label: 'Air Data (unparsed)',
        value: String(decodeResult.raw.air_data),
      });
    }

    const level: 'full' | 'partial' =
      decodeResult.raw.ads_payload_hex ? 'full' : 'partial';
    this.setDecodeLevel(decodeResult, true, level);
    return decodeResult;
  }
}
