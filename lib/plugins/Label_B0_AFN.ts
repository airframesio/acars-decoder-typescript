import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label B0 — AFN (ATS Facilities Notification / FANS 1/A CPDLC Logon)
 *
 * FANS 1/A `FN_CON` / AFN-Contact message — sent by the aircraft to
 * initiate a CPDLC logon with a specific ATSU (Air Traffic Services Unit).
 * The B0 label carries the same AFN protocol as A0; different operators
 * and/or sub-networks use one label or the other.
 *
 * Wire format (analyst example):
 *
 *   /SOUCAYA.AFN/FMHUAL984,.N78004,AA92FB,080809/FCPPIKCAYA,0F897
 *   |        |   |   |      |       |       |    |   |       ||
 *   |        |   |   |      |       |       |    |   |       |└ CRC (last 4 hex chars)
 *   |        |   |   |      |       |       |    |   |       └── Capability / qualifier flag (raw)
 *   |        |   |   |      |       |       |    |   └────────── Contact fix / position token
 *   |        |   |   |      |       |       |    └────────────── Descriptor (FCPP, FCO, FPO, FAK, …)
 *   |        |   |   |      |       |       └─────────────────── UTC time HHMMSS
 *   |        |   |   |      |       └─────────────────────────── ICAO 24-bit address (Mode-S hex)
 *   |        |   |   |      └───────────────────────────────── Tail / registration (leading '.')
 *   |        |   |   └──────────────────────────────────────── Callsign (flight ID)
 *   |        |   └──────────────────────────────────────────── Message header descriptor (/FMH)
 *   |        └──────────────────────────────────────────────── Application ID (.AFN)
 *   └───────────────────────────────────────────────────────── ATSU ground-facility address
 *
 * The `SOUCAYA`-style 7-character ATSU address is longer than the classic
 * 4-letter FIR designator (`KZWY`, `EGGX`, …); it appears to be a
 * named-waypoint-style facility address used by some FANS 1/A ground
 * stations.
 */
export class Label_B0_AFN extends DecoderPlugin {
  name = 'label-b0-afn';

  qualifiers() {
    return {
      labels: ['B0'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'AFN — ATS Facilities Notification (FANS 1/A CPDLC Logon)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // ── Envelope: /<ground>.AFN/FMH<header-body>[/<cap-block>...] ──
    const envelope = text.match(
      /^\/(?<ground>[A-Z0-9]{4,9})\.AFN\/FMH(?<rest>.+)$/,
    );
    if (!envelope?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }
    const { ground, rest } = envelope.groups;
    decodeResult.raw.atsu_address = ground;

    // Split rest into the pre-capability header block and the zero-or-more
    // slash-delimited capability blocks.
    const slashIdx = rest.indexOf('/');
    const headerBlock = slashIdx >= 0 ? rest.substring(0, slashIdx) : rest;
    const capBlocks =
      slashIdx >= 0
        ? rest
            .substring(slashIdx + 1)
            .split('/')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [];

    // ── Header: CALLSIGN,.TAIL,ICAOHEX,HHMMSS ──
    // Some variants skip the ICAO hex or the time — match tolerantly.
    const headerRe =
      /^(?<callsign>[A-Z]{2,3}\d{1,5}[A-Z]?),?\.?(?<tail>[A-Z0-9-]{3,10})?(?:,(?<icao>[A-F0-9]{6}))?(?:,(?<time>\d{6}))?/;
    const h = headerBlock.match(headerRe);
    let callsign = '';
    let tail = '';
    let icaoHex = '';
    let timeHHMMSS = '';
    if (h?.groups) {
      callsign = h.groups.callsign || '';
      tail = h.groups.tail || '';
      icaoHex = h.groups.icao || '';
      timeHHMMSS = h.groups.time || '';
    }

    if (callsign) {
      decodeResult.raw.callsign = callsign;
      ResultFormatter.flightNumber(decodeResult, callsign);
    }
    if (tail) {
      decodeResult.raw.tail = tail;
      ResultFormatter.tail(decodeResult, tail);
    }
    if (icaoHex) {
      decodeResult.raw.icao_24bit = icaoHex;
    }
    if (timeHHMMSS) {
      ResultFormatter.timestamp(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(timeHHMMSS),
      );
    }

    // ── Capability blocks ──
    // Each capability block begins with a descriptor (e.g. FCO, FPO,
    // FCPP, FAK<n>) followed by comma-separated tokens. The last token
    // of the last block carries the trailing CRC (4 hex chars) glued to
    // a preceding flag/qualifier.
    const parsedCaps: Array<{
      descriptor: string;
      tokens: string[];
    }> = [];
    let crc = '';
    capBlocks.forEach((block, idx) => {
      // Descriptor alternation — FANS 1/A AFN known sub-block labels.
      // Ordered longest-first so `FCPP` is matched before a bare `FCP`
      // fallback would swallow only the prefix.
      const descMatch = block.match(
        /^(FCPP|FARADS|FARATC|FCO|FPO|FMH|FAK\d+|F[A-Z]{2})/,
      );
      const descriptor = descMatch ? descMatch[1] : '';
      const afterDesc = block.substring(descriptor.length);
      // After the descriptor, the first token is the position/fix (pre-
      // comma, no leading comma separator); subsequent tokens are comma-
      // separated flags.
      const firstComma = afterDesc.indexOf(',');
      const tokens: string[] = [];
      if (firstComma >= 0) {
        const firstTok = afterDesc.substring(0, firstComma).trim();
        if (firstTok) tokens.push(firstTok);
        afterDesc
          .substring(firstComma + 1)
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .forEach((t) => tokens.push(t));
      } else if (afterDesc.trim()) {
        tokens.push(afterDesc.trim());
      }

      // On the last block, the trailing 4 chars of the last token are the CRC.
      if (idx === capBlocks.length - 1 && tokens.length > 0) {
        const lastTok = tokens[tokens.length - 1];
        if (/^[A-F0-9]{5,}$/.test(lastTok)) {
          crc = lastTok.slice(-4);
          const flagPart = lastTok.slice(0, -4);
          tokens[tokens.length - 1] = flagPart;
        }
      }

      parsedCaps.push({ descriptor, tokens });
    });
    decodeResult.raw.capability_blocks = parsedCaps;
    if (crc) decodeResult.raw.crc = crc;

    // ── Formatted output ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value:
          'AFN Contact (FN_CON) — FANS 1/A CPDLC Logon Request',
      },
      {
        type: 'direction',
        code: 'DIR',
        label: 'Direction',
        value: 'Downlink (aircraft → ground)',
      },
      {
        type: 'atsu_address',
        code: 'ATSU',
        label: 'ATSU Address',
        value: ground,
      },
      {
        type: 'application',
        code: 'APP',
        label: 'Application',
        value: 'AFN (ATS Facilities Notification)',
      },
    );

    if (callsign) {
      decodeResult.formatted.items.push({
        type: 'callsign',
        code: 'CALLSIGN',
        label: 'Callsign',
        value: callsign,
      });
    }
    if (icaoHex) {
      decodeResult.formatted.items.push({
        type: 'icao_24bit',
        code: 'ICAO24',
        label: 'ICAO 24-bit Address',
        value: icaoHex,
      });
    }
    if (timeHHMMSS) {
      decodeResult.formatted.items.push({
        type: 'time',
        code: 'TIME',
        label: 'Logon Time (UTC)',
        value: `${timeHHMMSS.substring(0, 2)}:${timeHHMMSS.substring(2, 4)}:${timeHHMMSS.substring(4, 6)}`,
      });
    }

    parsedCaps.forEach((cap, i) => {
      const idx = i + 1;
      const tokensStr =
        cap.tokens.length > 0 ? cap.tokens.filter((t) => t).join(', ') : '(none)';
      decodeResult.formatted.items.push({
        type: `capability_block_${idx}`,
        code: `CAP${idx}`,
        label: `Capability Block ${idx}`,
        value: `/${cap.descriptor}${cap.tokens.length > 0 ? ' → ' + tokensStr : ''}`,
      });
    });

    if (crc) {
      decodeResult.formatted.items.push({
        type: 'crc',
        code: 'CRC',
        label: 'CRC',
        value: crc,
      });
    }

    const didDecode = !!(ground && callsign);
    this.setDecodeLevel(decodeResult, didDecode, didDecode ? 'full' : 'partial');
    return decodeResult;
  }
}
