import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Airline ground uplinks about the aircraft's current flight.
// British Airways at Heathrow, after on-blocks (ATA is the IN time):
//   ':PAD11\r\nUTC\r\nARRIVAL- GZBJI BA130  \r\nSTAND 563  ATA 0847 //\r\n...'
// Iberia slot message, after departure (ATD is the off-block time the delay
// is counted from):
//   '4PAD11/SLOT\n\tIB154 ECOOL\n\tSTD 0335 STA 1310\n\tATD 0357\n\tDLY 0022 93 ...'
const ARRIVAL_REGEX =
  /^:PAD11\r?\nUTC\r?\nARRIVAL- (?<tail>[A-Z0-9]{4,6}) +(?<flight>[A-Z0-9]{2}\d{1,4}) *\r?\n(?:STAND (?<stand>\S+) +)?ATA (?<ata>\d{4}) \/\/(?<rest>[\s\S]*)$/;
const SLOT_REGEX =
  /^4PAD11\/SLOT\r?\n\t?(?<flight>[A-Z0-9]{2}\d{1,4}) (?<tail>[A-Z0-9]{4,6})\r?\n\t?STD (?<std>\d{4}) STA (?<sta>\d{4})\r?\n\t?ATD (?<atd>\d{4})\b(?<rest>[\s\S]*)$/;

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;

export class Label_10_PAD11 extends DecoderPlugin {
  name = 'label-10-pad11';

  qualifiers() {
    return {
      labels: ['10', '11'],
      preambles: [':PAD11', '4PAD11/SLOT'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Ground Uplink');
    const tod = (hhmm: string) => DateTimeUtils.convertHHMMSSToTod(hhmm);

    const arrival = ARRIVAL_REGEX.exec(message.text)?.groups;
    if (arrival && CLOCK_REGEX.test(arrival.ata)) {
      decodeResult.formatted.description = 'Arrival Uplink';
      ResultFormatter.tail(decodeResult, arrival.tail);
      ResultFormatter.flightNumber(decodeResult, arrival.flight);
      if (arrival.stand) {
        ResultFormatter.arrivalGate(decodeResult, arrival.stand);
      }
      ResultFormatter.in(decodeResult, tod(arrival.ata));
      if (arrival.rest.trim()) {
        ResultFormatter.unknown(decodeResult, arrival.rest.trim());
      }
      this.setDecodeLevel(decodeResult, true);
      return decodeResult;
    }

    const slot = SLOT_REGEX.exec(message.text)?.groups;
    if (
      slot &&
      CLOCK_REGEX.test(slot.std) &&
      CLOCK_REGEX.test(slot.sta) &&
      CLOCK_REGEX.test(slot.atd)
    ) {
      decodeResult.formatted.description = 'Slot Uplink';
      ResultFormatter.flightNumber(decodeResult, slot.flight);
      ResultFormatter.tail(decodeResult, slot.tail);
      ResultFormatter.scheduledDeparture(decodeResult, tod(slot.std));
      ResultFormatter.scheduledArrival(decodeResult, tod(slot.sta));
      ResultFormatter.out(decodeResult, tod(slot.atd));
      if (slot.rest.trim()) {
        ResultFormatter.unknown(decodeResult, slot.rest.trim());
      }
      this.setDecodeLevel(decodeResult, true);
      return decodeResult;
    }

    this.debug(options, `Unknown PAD11 uplink: ${message.text}`);
    this.setDecodeLevel(decodeResult, false);
    return decodeResult;
  }
}
