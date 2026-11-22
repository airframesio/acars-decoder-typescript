import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Airline ground uplinks about the aircraft's current flight.
// British Airways at Heathrow, after on-blocks (ATA is the IN time) or
// before them (ETA):
//   ':PAD11\r\nUTC\r\nARRIVAL- GZBJI BA130  \r\nSTAND 563  ATA 0847 //\r\n...'
//   ':PAD11\r\nUTC\r\nARRIVAL- GXWBB BA066  \r\nSTAND 305  ETA 0658 //\r\n...'
// The " //" can be missing, and a STAND line after "ON STAND-" or "CREW
// DEPT-" is another flight's, so it stays in remaining.
// British Airways flight release, before departure:
//   ':PAD11\r\n22NOV26 BA356    GEUUZ LHR-LYS\r\nETD 0700Z FLIGHT RELEASE OFP  5'
// British Airways departure planning at Heathrow, the target (TOBT) or
// estimated (EOBT) off-block time. These two carry the numeric flight only
// ('396', no airline code), so flight_number is stored as sent:
//   ':PAD11CDM CHANGE\r\n396   LHR - CAI\r\nTOBT 0855\r\nTSAT 0855\r\nTTOT 0915'
//   ':PAD11\r\nSLOT CHANGE\r\n396  LHR - CAI\r\nFP RLS: 9\r\nCTOT: 0915 //\r\n...EOBT: 0855'
// Iberia slot message, after departure (ATD is the off-block time the delay
// is counted from):
//   '4PAD11/SLOT\n\tIB154 ECOOL\n\tSTD 0335 STA 1310\n\tATD 0357\n\tDLY 0022 93 ...'
const ARRIVAL_REGEX =
  /^:PAD11\r?\nUTC\r?\nARRIVAL- (?<tail>[A-Z0-9]{4,6}) +(?<flight>[A-Z0-9]{2}\d{1,4}) *\r?\n(?:STAND (?<stand>\S+) +)?(?<kind>ATA|ETA) (?<time>\d{4})(?: \/\/)?(?=\s|$)(?<rest>[\s\S]*)$/;
const RELEASE_REGEX =
  /^:PAD11\r?\n(?<date>\d{2}[A-Z]{3}\d{2}) +(?<flight>[A-Z0-9]{2}\d{1,4}) +(?<tail>[A-Z0-9]{4,6}) +(?<dep>[A-Z]{3})-(?<arr>[A-Z]{3})\r?\nETD (?<etd>\d{4})Z FLIGHT RELEASE(?<rest>[\s\S]*)$/;
const CDM_REGEX =
  /^:PAD11CDM CHANGE\r?\n(?<flight>\d{1,4}) +(?<dep>[A-Z]{3}) - (?<arr>[A-Z]{3})\r?\nTOBT (?<tobt>\d{4})\b(?<rest>[\s\S]*)$/;
const SLOT_CHANGE_REGEX =
  /^:PAD11\r?\nSLOT CHANGE\r?\n(?<flight>\d{1,4}) +(?<dep>[A-Z]{3}) - (?<arr>[A-Z]{3})\r?\n(?<before>[\s\S]*?)^EOBT: (?<eobt>\d{4})\b(?<after>[\s\S]*)$/m;
const SLOT_REGEX =
  /^4PAD11\/SLOT\r?\n\t?(?<flight>[A-Z0-9]{2}\d{1,4}) (?<tail>[A-Z0-9]{4,6})\r?\n\t?STD (?<std>\d{4}) STA (?<sta>\d{4})\r?\n\t?ATD (?<atd>\d{4})\b(?<rest>[\s\S]*)$/;

const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d$/;
const RELEASE_DATE_REGEX = /^(?<day>\d{2})(?<month>[A-Z]{3})(?<year>\d{2})$/;
const MONTHS = 'JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC';

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
    if (arrival && CLOCK_REGEX.test(arrival.time)) {
      decodeResult.formatted.description = 'Arrival Uplink';
      ResultFormatter.tail(decodeResult, arrival.tail);
      ResultFormatter.flightNumber(decodeResult, arrival.flight);
      if (arrival.stand) {
        ResultFormatter.arrivalGate(decodeResult, arrival.stand);
      }
      if (arrival.kind === 'ATA') {
        ResultFormatter.in(decodeResult, tod(arrival.time));
      } else {
        ResultFormatter.eta(decodeResult, tod(arrival.time));
      }
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

    const release = RELEASE_REGEX.exec(message.text)?.groups;
    if (release && CLOCK_REGEX.test(release.etd)) {
      decodeResult.formatted.description = 'Flight Release Uplink';
      ResultFormatter.flightNumber(decodeResult, release.flight);
      ResultFormatter.tail(decodeResult, release.tail);
      ResultFormatter.departureAirport(decodeResult, release.dep, 'IATA');
      ResultFormatter.arrivalAirport(decodeResult, release.arr, 'IATA');
      ResultFormatter.etd(decodeResult, tod(release.etd));
      const date = RELEASE_DATE_REGEX.exec(release.date)?.groups;
      const month = date ? MONTHS.indexOf(date.month) : -1;
      const day = date ? Number(date.day) : NaN;
      if (date && month >= 0 && month % 3 === 0 && day >= 1 && day <= 31) {
        ResultFormatter.departureDay(decodeResult, day);
        ResultFormatter.month(decodeResult, month / 3 + 1);
        // No year field.
        ResultFormatter.unknown(decodeResult, date.year);
      } else {
        ResultFormatter.unknown(decodeResult, release.date);
      }
      if (release.rest.trim()) {
        ResultFormatter.unknown(decodeResult, release.rest.trim());
      }
      this.setDecodeLevel(decodeResult, true);
      return decodeResult;
    }

    const cdm = CDM_REGEX.exec(message.text)?.groups;
    if (cdm && CLOCK_REGEX.test(cdm.tobt)) {
      decodeResult.formatted.description = 'Departure Planning Uplink';
      ResultFormatter.flightNumber(decodeResult, cdm.flight);
      ResultFormatter.departureAirport(decodeResult, cdm.dep, 'IATA');
      ResultFormatter.arrivalAirport(decodeResult, cdm.arr, 'IATA');
      ResultFormatter.etd(decodeResult, tod(cdm.tobt));
      if (cdm.rest.trim()) {
        ResultFormatter.unknown(decodeResult, cdm.rest.trim());
      }
      this.setDecodeLevel(decodeResult, true);
      return decodeResult;
    }

    const slotChange = SLOT_CHANGE_REGEX.exec(message.text)?.groups;
    if (slotChange && CLOCK_REGEX.test(slotChange.eobt)) {
      decodeResult.formatted.description = 'Slot Change Uplink';
      ResultFormatter.flightNumber(decodeResult, slotChange.flight);
      ResultFormatter.departureAirport(decodeResult, slotChange.dep, 'IATA');
      ResultFormatter.arrivalAirport(decodeResult, slotChange.arr, 'IATA');
      ResultFormatter.etd(decodeResult, tod(slotChange.eobt));
      // CTOT (the take-off slot) and the rest stay in remaining.
      const skipped = [slotChange.before, slotChange.after]
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .join('\n');
      if (skipped) {
        ResultFormatter.unknown(decodeResult, skipped);
      }
      this.setDecodeLevel(decodeResult, true);
      return decodeResult;
    }

    this.debug(options, `Unknown PAD11 uplink: ${message.text}`);
    this.setDecodeLevel(decodeResult, false);
    return decodeResult;
  }
}
