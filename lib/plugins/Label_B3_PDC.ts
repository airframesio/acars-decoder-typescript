import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import {
  addUnreadLines,
  GATE_TOKEN,
  gateLines,
  UsedLines,
} from '../utils/gate_report';

// "JZA110-CYWG-GATE 12-CYOW", "BAW22G -EGKK-GATE 27-MDPC": callsign, ICAO
// origin, the departure gate there, ICAO destination.
const PDC_GATE = new RegExp(
  `^([A-Z0-9]{2,8})\\s*-([A-Z]{4})-GATE\\s+${GATE_TOKEN}-([A-Z]{4})\\b`,
);

/**
 * Label B3 pre-departure clearance (PDC) uplinks that name the departure
 * gate, from about 70 airlines. Only the callsign line is read: the rest of
 * the clearance (ATIS, aircraft type, route) stays in remaining.
 */
export class Label_B3_PDC extends DecoderPlugin {
  name = 'label-b3-pdc';

  qualifiers() {
    return {
      labels: ['B3'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const lines = gateLines(message.text);
    for (let i = 0; i < lines.length; i++) {
      const m = PDC_GATE.exec(lines[i]);
      if (!m) {
        continue;
      }
      const decodeResult = this.initResult(message, 'Pre-Departure Clearance');
      ResultFormatter.callsign(decodeResult, m[1]);
      ResultFormatter.departureAirport(decodeResult, m[2]);
      ResultFormatter.departureGate(decodeResult, m[3]);
      ResultFormatter.arrivalAirport(decodeResult, m[4]);
      const used: UsedLines = new Map([
        [i, lines[i].slice(m[0].length).trim()],
      ]);
      addUnreadLines(decodeResult, lines, used);
      this.setDecodeLevel(decodeResult, true);
      return decodeResult;
    }

    const decodeResult = this.initResult(message, 'Unknown');
    return this.failUnknown(decodeResult, message.text, options);
  }
}
