// Escape-hatch port of lib/plugins/Label_H1_OFP.ts decode().
// Delegates to parseIcaoFpl (icao_fpl_utils.ts) — a multi-stage ICAO
// flight-plan parser with state-machine bracket matching.

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';
import { parseIcaoFpl } from '../../utils/icao_fpl_utils';

export function label_h1_ofp_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  if (!message.text.includes('(FPL-')) {
    if (options.debug) {
      console.log(`Decoder: No FPL block found in message`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const fpl = parseIcaoFpl(message.text);
  if (!fpl) {
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  // Populate decoded results
  ResultFormatter.callsign(result, fpl.callsign);

  result.formatted.items.push({
    type: 'aircraft_type',
    code: 'ACFT',
    label: 'Aircraft Type',
    value: fpl.aircraftType,
  });

  if (fpl.departure) {
    ResultFormatter.departureAirport(result, fpl.departure);
  }

  if (fpl.destination) {
    ResultFormatter.arrivalAirport(result, fpl.destination);
  }

  if (fpl.alternates.length > 0) {
    ResultFormatter.alternateAirport(result, fpl.alternates[0]);
  }

  if (fpl.route) {
    ResultFormatter.route(result, fpl.route);
  }

  if (fpl.otherInfo.REG) {
    ResultFormatter.tail(result, fpl.otherInfo.REG);
  }

  const rulesMap: Record<string, string> = {
    I: 'IFR',
    V: 'VFR',
    Y: 'IFR/VFR',
    Z: 'VFR/IFR',
  };
  const rulesDesc = rulesMap[fpl.flightRules] || fpl.flightRules;
  result.formatted.items.push({
    type: 'flight_rules',
    code: 'RULES',
    label: 'Flight Rules',
    value: rulesDesc,
  });

  result.formatted.items.push({
    type: 'cruise',
    code: 'CRUISE',
    label: 'Cruise Speed/Level',
    value: `${fpl.cruiseSpeed} ${fpl.cruiseLevel}`,
  });

  // Store raw FPL data
  result.raw.icao_fpl = fpl;

  result.decoded = true;
  result.decoder.decodeLevel = 'full';

  return result;
}
