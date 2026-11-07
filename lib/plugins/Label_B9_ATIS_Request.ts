import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

/**
 * Label B9 — ATIS Request (downlink, aircraft → ground)
 *
 * The aircraft asks a named ground station's ATIS service (sub-type TI2
 * = Terminal Information v2) for the current ATIS broadcast. This is a
 * short, formatted request carrying the target airport, an opaque
 * sequence/parameter field, and a trailing integrity checksum.
 *
 * Wire format:
 *
 *   / EDDK . TI2 / 024 EDDK A 6 61A
 *   | |    | |   | |   |    | | |
 *   | |    | |   | |   |    | | └── Checksum / trailer (2–4 hex-like chars; likely CRC)
 *   | |    | |   | |   |    | └──── Sub-qualifier (single alphanumeric)
 *   | |    | |   | |   |    └────── ATIS information letter (A–Z, Alpha..Zulu)
 *   | |    | |   | |   └─────────── Repeated airport ICAO (echo of target)
 *   | |    | |   | └─────────────── Sequence / parameter field (3-digit, e.g. 024, 040, 000)
 *   | |    | |   └───────────────── Delimiter
 *   | |    | └───────────────────── Sub-type / service code (typ. TI2)
 *   | |    └─────────────────────── Delimiter
 *   | └──────────────────────────── Target ground station airport ICAO (4 chars)
 *   └────────────────────────────── Preamble / sub-format indicator '/'
 *
 * Examples observed in the wild:
 *   /EDDK.TI2/024EDDKA661A   (Cologne Bonn, Germany)
 *   /KADW.TI2/024KADWA53E9   (Joint Base Andrews)
 *   /EGLL.TI2/000EGLLAABB2   (Heathrow)
 *   /KLAX.TI2/024KLAXDB1CC
 *   /KSFO.TI2/040KSFOCBE89
 */
export class Label_B9_ATIS_Request extends DecoderPlugin {
  name = 'label-b9-atis-request';

  qualifiers() {
    return {
      labels: ['B9'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'ATIS Request (aircraft → ground-station ATIS service)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Primary shape: /ICAO.SUBTYPE/SEQ(3d) ICAO(4) LETTER(1) SUBQ(1) CHK(2..4)
    const regex =
      /^\/(?<gs>[A-Z]{4})\.(?<subtype>[A-Z0-9]+)\/(?<seq>\d{3})(?<echo>[A-Z]{4})(?<letter>[A-Z])(?<subq>[A-Z0-9])(?<chk>[A-Z0-9]{2,4})$/;
    const m = text.match(regex);

    if (!m?.groups) {
      // Partial fallback — pull just the leading /ICAO.SUBTYPE/ header if present
      const hdr = text.match(/^\/([A-Z]{4})\.([A-Z0-9]+)\//);
      if (hdr) {
        decodeResult.raw.preamble = '/';
        decodeResult.raw.ground_station_icao = hdr[1];
        decodeResult.raw.atis_subtype = hdr[2];
        decodeResult.raw.arrival_icao = hdr[1];
        decodeResult.formatted.items.push(
          {
            type: 'message_type',
            code: 'MSGTYP',
            label: 'Message Type',
            value: 'ATIS Request — downlink to ground-station ATIS service',
          },
          {
            type: 'ground_station',
            code: 'GNDSTN',
            label: 'Ground Station ICAO',
            value: hdr[1],
          },
          {
            type: 'atis_subtype',
            code: 'SUBTYPE',
            label: 'Sub-type / Service',
            value: hdr[2] === 'TI2' ? 'TI2 (Terminal Information v2)' : hdr[2],
          },
        );
        decodeResult.remaining.text = text.substring(hdr[0].length);
        this.setDecodeLevel(decodeResult, true, 'partial');
        return decodeResult;
      }
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { gs, subtype, seq, echo, letter, subq, chk } = m.groups;

    decodeResult.raw.preamble = '/';
    decodeResult.raw.ground_station_icao = gs;
    decodeResult.raw.atis_subtype = subtype;
    decodeResult.raw.sequence = seq;
    decodeResult.raw.payload_echo_icao = echo;
    decodeResult.raw.atis_letter = letter;
    decodeResult.raw.atis_subqualifier = subq;
    decodeResult.raw.checksum = chk;
    decodeResult.raw.arrival_icao = gs;

    const subtypeLabel =
      subtype === 'TI2' ? 'TI2 (Terminal Information v2)' : subtype;

    decodeResult.formatted.items = [
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'ATIS Request — downlink to ground-station ATIS service',
      },
      {
        type: 'ground_station',
        code: 'GNDSTN',
        label: 'Ground Station ICAO',
        value: gs,
      },
      {
        type: 'atis_subtype',
        code: 'SUBTYPE',
        label: 'Sub-type / Service',
        value: subtypeLabel,
      },
      {
        type: 'sequence',
        code: 'SEQ',
        label: 'Sequence / Parameter',
        value: seq,
      },
      {
        type: 'payload_echo',
        code: 'ECHO',
        label: 'Payload Target ICAO',
        value: echo + (echo === gs ? ' (echoes target)' : ' (differs from header)'),
      },
      {
        type: 'atis_letter',
        code: 'ATIS_LETTER',
        label: 'ATIS Info Letter',
        value: `${letter} (${this.phonetic(letter)})`,
      },
      {
        type: 'atis_subqualifier',
        code: 'ATIS_SUBQ',
        label: 'Sub-qualifier',
        value: subq,
      },
      {
        type: 'checksum',
        code: 'CHK',
        label: 'Checksum',
        value: chk,
      },
    ];

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }

  private phonetic(letter: string): string {
    const names: Record<string, string> = {
      A: 'Alpha',
      B: 'Bravo',
      C: 'Charlie',
      D: 'Delta',
      E: 'Echo',
      F: 'Foxtrot',
      G: 'Golf',
      H: 'Hotel',
      I: 'India',
      J: 'Juliet',
      K: 'Kilo',
      L: 'Lima',
      M: 'Mike',
      N: 'November',
      O: 'Oscar',
      P: 'Papa',
      Q: 'Quebec',
      R: 'Romeo',
      S: 'Sierra',
      T: 'Tango',
      U: 'Uniform',
      V: 'Victor',
      W: 'Whiskey',
      X: 'X-ray',
      Y: 'Yankee',
      Z: 'Zulu',
    };
    return names[letter.toUpperCase()] || letter;
  }
}
