// Escape-hatch port of lib/plugins/Label_H1_EZF.ts decode().
// Multi-line load-sheet parser.

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_h1_ezf_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const lines = message.text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2 || lines[0] !== 'EZF') {
    if (options.debug) {
      console.log(`Decoder: Unknown H1 EZF message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const loadsheet: Record<string, string> = {};
  const unknowns: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('-')) {
      const kvMatch = line.match(/^-([^/]+)\/(.+)$/);
      if (kvMatch) {
        loadsheet[kvMatch[1]] = kvMatch[2];
      } else {
        unknowns.push(line);
      }
    } else if (i === 1) {
      // Second line is the flight identifier, e.g. NO0246/10/EI-NEO
      const idParts = line.split('/');
      if (idParts.length >= 1) {
        ResultFormatter.flightNumber(result, idParts[0]);
      }
      if (idParts.length >= 3) {
        ResultFormatter.tail(result, idParts[2]);
      }
      // Remaining parts of identifier line
      if (idParts.length >= 2) {
        // idParts[1] is day or other info - store but don't format
      }
    } else if (i === 2) {
      // Third line typically contains config info, e.g. /C28Y331/3/9
      unknowns.push(line);
    } else {
      unknowns.push(line);
    }
  }

  // Extract known fields from loadsheet
  if (loadsheet['SCT']) {
    const route = loadsheet['SCT'].split('-');
    if (route.length === 2) {
      ResultFormatter.departureAirport(result, route[0], 'IATA');
      ResultFormatter.arrivalAirport(result, route[1], 'IATA');
    }
  }

  // Store all loadsheet data in raw
  result.raw.loadsheet = loadsheet;

  // Format key loadsheet items
  const formatFields: [string, string, string][] = [
    ['STD', 'Scheduled Time of Departure', 'std'],
    ['FLT STATUS', 'Flight Status', 'flight_status'],
    ['UOM', 'Unit of Measure', 'uom'],
    ['ZFW', 'Zero Fuel Weight', 'zfw'],
    ['PAX', 'Passengers', 'pax'],
    ['TOW', 'Takeoff Weight', 'tow'],
    ['DOW', 'Dry Operating Weight', 'dow'],
    ['FWT', 'Fuel Weight', 'fuel_weight'],
  ];

  for (const [key, label, code] of formatFields) {
    if (loadsheet[key]) {
      result.formatted.items.push({
        type: 'loadsheet',
        code: code.toUpperCase(),
        label: label,
        value: loadsheet[key],
      });
    }
  }

  if (unknowns.length > 0) {
    ResultFormatter.unknownArr(result, unknowns, '\n');
  }

  result.decoded = true;
  result.decoder.decodeLevel = 'partial';

  return result;
}
