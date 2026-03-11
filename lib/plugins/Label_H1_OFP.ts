import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { parseIcaoFpl } from '../utils/icao_fpl_utils';

export class Label_H1_OFP extends DecoderPlugin {
  name = 'label-h1-ofp';

  qualifiers() {
    return {
      labels: ['H1', '1M'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Operational Flight Plan';

    if (!message.text.includes('(FPL-')) {
      if (options.debug) {
        console.log(`Decoder: No FPL block found in message`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const fpl = parseIcaoFpl(message.text);
    if (!fpl) {
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    // Populate decoded results
    ResultFormatter.callsign(decodeResult, fpl.callsign);

    decodeResult.formatted.items.push({
      type: 'aircraft_type',
      code: 'ACFT',
      label: 'Aircraft Type',
      value: fpl.aircraftType,
    });

    if (fpl.departure) {
      ResultFormatter.departureAirport(decodeResult, fpl.departure);
    }

    if (fpl.destination) {
      ResultFormatter.arrivalAirport(decodeResult, fpl.destination);
    }

    if (fpl.alternates.length > 0) {
      ResultFormatter.alternateAirport(decodeResult, fpl.alternates[0]);
    }

    if (fpl.route) {
      ResultFormatter.flightPlan(decodeResult, fpl.route);
    }

    if (fpl.otherInfo.REG) {
      ResultFormatter.tail(decodeResult, fpl.otherInfo.REG);
    }

    const rulesMap: Record<string, string> = {
      I: 'IFR',
      V: 'VFR',
      Y: 'IFR/VFR',
      Z: 'VFR/IFR',
    };
    const rulesDesc = rulesMap[fpl.flightRules] || fpl.flightRules;
    decodeResult.formatted.items.push({
      type: 'flight_rules',
      code: 'RULES',
      label: 'Flight Rules',
      value: rulesDesc,
    });

    decodeResult.formatted.items.push({
      type: 'cruise',
      code: 'CRUISE',
      label: 'Cruise Speed/Level',
      value: `${fpl.cruiseSpeed} ${fpl.cruiseLevel}`,
    });

    // Store raw FPL data
    decodeResult.raw.icao_fpl = fpl;

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}
