import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_H1_EZF extends DecoderPlugin {
  name = 'label-h1-ezf';

  qualifiers() {
    return {
      labels: ['H1', '1M'],
      preambles: ['EZF'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Load Sheet';
    decodeResult.message = message;

    const lines = message.text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    if (lines.length < 2 || lines[0] !== 'EZF') {
      if (options.debug) {
        console.log(`Decoder: Unknown H1 EZF message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
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
          ResultFormatter.flightNumber(decodeResult, idParts[0]);
        }
        if (idParts.length >= 3) {
          ResultFormatter.tail(decodeResult, idParts[2]);
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
        ResultFormatter.departureAirport(decodeResult, route[0], 'IATA');
        ResultFormatter.arrivalAirport(decodeResult, route[1], 'IATA');
      }
    }

    // Store all loadsheet data in raw
    decodeResult.raw.loadsheet = loadsheet;

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
        decodeResult.formatted.items.push({
          type: 'loadsheet',
          code: code.toUpperCase(),
          label: label,
          value: loadsheet[key],
        });
      }
    }

    if (unknowns.length > 0) {
      ResultFormatter.unknownArr(decodeResult, unknowns, '\n');
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}
