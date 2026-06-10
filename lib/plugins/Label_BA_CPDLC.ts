import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label BA — FANS-1/A CPDLC Downlink (aircraft → ground)
 *
 * The downlink companion to label AA (uplink). Carried inside the ARINC 622
 * framework. Observed service qualifiers:
 *   DR1 — CPDLC Downlink Response Type 1 (most common)
 *   CC1 — CPDLC Connection / Connect-Confirm
 *   AT1 — ATC Type 1 (occasional)
 *
 * Wire format:
 *
 *   / USADCXA . DR1 . N887QS <payload-hex> 0CAF
 *   | |       |  |  | |      |              |
 *   | |       |  |  | |      |              └ 4-char CRC (hex) — message integrity
 *   | |       |  |  | |      └──────────────── CPDLC payload, ASN.1 PER hex (may be empty)
 *   | |       |  |  | └─────────────────────── Aircraft registration / tail (typ. 6 chars)
 *   | |       |  |  └───────────────────────── Separator
 *   | |       |  └──────────────────────────── Service qualifier (DR1, CC1, ATN, ...)
 *   | |       └─────────────────────────────── Separator
 *   | └─────────────────────────────────────── Ground-station ARINC address (5–9 chars)
 *   └───────────────────────────────────────── ARINC-622 routing delimiter '/'
 *
 * The trailing 4 characters are always the CRC. When `payload-hex` is empty
 * the message is typically a link-status / acknowledgement / keep-alive
 * (e.g. `/USADCXA.DR1.N887QS0CAF` — tail directly followed by CRC).
 *
 * Direction: aircraft → ground (downlink) — the BA label semantics.
 */
export class Label_BA_CPDLC extends DecoderPlugin {
  name = 'label-ba-cpdlc';

  qualifiers() {
    return {
      labels: ['BA'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'FANS-1/A CPDLC Downlink — Controller–Pilot Data Link Communications',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Envelope: /GROUND.QUALIFIER.REST
    const envelope =
      /^\/(?<ground>[A-Z0-9]{5,9})\.(?<qual>[A-Z0-9]{2,4})\.(?<rest>.+)$/;
    const env = text.match(envelope);
    if (!env?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { ground, qual, rest } = env.groups;
    decodeResult.raw.ground_address = ground;
    decodeResult.raw.service_qualifier = qual;

    // Tail/payload split heuristic: tails on label BA can be all-hex
    // (e.g. C-XXXXX) so a strict "find the first non-hex char" approach
    // fails. We scan the leading 8 chars for a non-hex character to mark
    // the end of the tail; if none, default to the first 6 chars.
    let tail = '';
    let payloadAndCrc = '';
    const window = rest.substring(0, Math.min(8, rest.length));
    const nonHexIdx = window.search(/[G-Zg-z]/);
    if (nonHexIdx >= 2) {
      // Tail is rest[0 .. nonHexIdx], payload+CRC follows
      tail = rest.substring(0, nonHexIdx + 1);
      payloadAndCrc = rest.substring(nonHexIdx + 1);
    } else {
      // All-hex window — assume 6-char tail
      tail = rest.substring(0, 6);
      payloadAndCrc = rest.substring(6);
    }

    decodeResult.raw.tail = tail;
    ResultFormatter.tail(decodeResult, tail);

    // Trailing 4 chars are the CRC; everything before is the CPDLC payload.
    let payload = '';
    let crc = '';
    if (payloadAndCrc.length >= 4) {
      crc = payloadAndCrc.slice(-4).toUpperCase();
      payload = payloadAndCrc.slice(0, -4);
    } else {
      // Malformed — too short to contain a CRC; expose verbatim and bail at partial.
      decodeResult.raw.cpdlc_payload_hex = payloadAndCrc;
      decodeResult.formatted.items.unshift(
        {
          type: 'message_type',
          code: 'MSGTYP',
          label: 'Message Type',
          value: 'FANS-1/A CPDLC Downlink',
        },
        {
          type: 'ground_address',
          code: 'GND',
          label: 'Ground Address',
          value: ground,
        },
        {
          type: 'service_qualifier',
          code: 'QUAL',
          label: 'Service Qualifier',
          value: qual,
        },
        {
          type: 'tail',
          code: 'TAIL',
          label: 'Tail',
          value: tail,
        },
      );
      this.setDecodeLevel(decodeResult, true, 'partial');
      return decodeResult;
    }

    decodeResult.raw.cpdlc_payload_hex = payload;
    decodeResult.raw.crc = crc;

    // Direction
    decodeResult.raw.direction = 'aircraft-to-ground (downlink)';

    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'FANS-1/A CPDLC Downlink',
      },
      {
        type: 'direction',
        code: 'DIR',
        label: 'Direction',
        value: 'Aircraft → Ground (downlink)',
      },
      {
        type: 'ground_address',
        code: 'GND',
        label: 'Ground Address',
        value: ground,
      },
      {
        type: 'service_qualifier',
        code: 'QUAL',
        label: 'Service Qualifier',
        value: qual,
      },
    );

    if (payload) {
      decodeResult.formatted.items.push({
        type: 'cpdlc_payload',
        code: 'PAYLOAD',
        label: 'CPDLC Payload (ASN.1 PER hex)',
        value: payload,
      });
    } else {
      decodeResult.formatted.items.push({
        type: 'cpdlc_payload',
        code: 'PAYLOAD',
        label: 'CPDLC Payload',
        value: '(none — likely link status / acknowledgement / keep-alive)',
      });
    }

    decodeResult.formatted.items.push({
      type: 'crc',
      code: 'CRC',
      label: 'CRC',
      value: crc,
    });

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
