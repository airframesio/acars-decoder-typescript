// Escape-hatch port of lib/plugins/Label_H1_M_POS.ts decode().

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_h1_m_pos_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  // Match M[2-digit seq]A[airline 2-char][flight 4-digit][origin],[dest],[DDHHMM],[lat],[lon],[alt],[hdg],...
  const headerRegex = /^M(\d{2})A([A-Z]{2})(\d{4})/;
  const headerMatch = message.text.match(headerRegex);

  if (!headerMatch) {
    return failUnknown(result, message.text, options);
  }

  const airline = headerMatch[2];
  const flightNum = headerMatch[3];
  const afterHeader = message.text.substring(headerMatch[0].length);
  const fields = afterHeader.split(',');

  // We expect at least: origin, dest, DDHHMM, lat, lon, alt, hdg
  if (fields.length < 7) {
    return failUnknown(result, message.text, options);
  }

  ResultFormatter.flightNumber(result, `${airline}${flightNum}`);
  ResultFormatter.departureAirport(result, fields[0]);
  ResultFormatter.arrivalAirport(result, fields[1]);

  // DDHHMM timestamp
  const timestamp = fields[2].trim();
  if (timestamp.length === 6) {
    const day = Number(timestamp.substring(0, 2));
    const tod = DateTimeUtils.convertHHMMSSToTod(
      timestamp.substring(2) + '00',
    );
    ResultFormatter.day(result, day);
    ResultFormatter.timestamp(result, tod);
  }

  // Latitude and longitude (trim spaces, e.g. "- 4.9985")
  const lat = parseFloat(fields[3].replace(/\s/g, ''));
  const lon = parseFloat(fields[4].replace(/\s/g, ''));
  ResultFormatter.position(result, { latitude: lat, longitude: lon });

  // Altitude
  const alt = Number(fields[5]);
  ResultFormatter.altitude(result, alt);

  // Heading
  const hdg = Number(fields[6]);
  ResultFormatter.heading(result, hdg);

  // Remaining fields as unknown
  if (fields.length > 7) {
    ResultFormatter.unknownArr(result, fields.slice(7));
  }

  // Equivalent to plugin.setDecodeLevel(result, true, fields.length > 7 ? 'partial' : 'full')
  result.decoded = true;
  result.decoder.decodeLevel = fields.length > 7 ? 'partial' : 'full';

  return result;
}

function failUnknown(
  result: DecodeResult,
  text: string,
  options: Options,
): DecodeResult {
  if (options.debug) {
    console.log(`Unknown message: ${text}`);
  }
  ResultFormatter.unknown(result, text);
  result.decoded = false;
  result.decoder.decodeLevel = 'none';
  return result;
}
