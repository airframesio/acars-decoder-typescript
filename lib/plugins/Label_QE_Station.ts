import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// Short OOOI reports on the Q-series labels, with IATA station codes:
//   QE 'MEL2019       60WSI'       OUT, departure, ..., destination at 16
//   QF 'PHL1412GSOOS GSO/FUL0628'  OFF, departure, destination
//   QC 'IAD2128'                   ON, arrival station
//   QD 'SFO164100792'              IN, arrival station
// '---' and '///' stand for an unknown station.
const STATION_REGEX = /^(?<station>[A-Z]{3}|---|\/\/\/)(?<time>\d{4})/;
const IATA_REGEX = /^[A-Z]{3}$/;

const EVENTS: Record<string, 'OUT' | 'OFF' | 'ON' | 'IN'> = {
  QE: 'OUT',
  QF: 'OFF',
  QC: 'ON',
  QD: 'IN',
};

export class Label_QE_Station extends DecoderPlugin {
  name = 'label-qe-station';

  qualifiers() {
    return {
      labels: ['QE', 'QF', 'QC', 'QD'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const event = EVENTS[message.label];
    const decodeResult = this.initResult(message, `${event} Report`);
    const text = message.text;

    const match = STATION_REGEX.exec(text);
    const time = match?.groups?.time ?? '';
    if (
      !match?.groups ||
      Number(time.substring(0, 2)) > 23 ||
      Number(time.substring(2, 4)) > 59
    ) {
      this.debug(options, `Unknown ${message.label} report: ${text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const station = IATA_REGEX.test(match.groups.station)
      ? match.groups.station
      : '';
    // where the destination sits, for the labels that carry one
    const destinationAt = event === 'OUT' ? 16 : event === 'OFF' ? 7 : -1;
    const destination =
      destinationAt > 0 &&
      IATA_REGEX.test(text.substring(destinationAt, destinationAt + 3))
        ? text.substring(destinationAt, destinationAt + 3)
        : '';

    if (event === 'OUT' || event === 'OFF') {
      if (station)
        ResultFormatter.departureAirport(decodeResult, station, 'IATA');
      if (destination) {
        ResultFormatter.arrivalAirport(decodeResult, destination, 'IATA');
      }
    } else if (station) {
      ResultFormatter.arrivalAirport(decodeResult, station, 'IATA');
    }

    const tod = DateTimeUtils.convertHHMMSSToTod(time);
    if (event === 'OUT') ResultFormatter.out(decodeResult, tod);
    else if (event === 'OFF') ResultFormatter.off(decodeResult, tod);
    else if (event === 'ON') ResultFormatter.on(decodeResult, tod);
    else ResultFormatter.in(decodeResult, tod);

    const rest = destination
      ? [text.substring(7, destinationAt), text.substring(destinationAt + 3)]
      : [text.substring(7)];
    for (const part of rest) {
      if (part.trim()) ResultFormatter.unknown(decodeResult, part.trim());
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
