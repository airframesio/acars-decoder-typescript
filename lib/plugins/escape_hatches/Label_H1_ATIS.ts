// Escape-hatch port of lib/plugins/Label_H1_ATIS.ts decode().

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_h1_atis_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  // Pattern: L[2-digit seq]A[flight]/[facility].TI2/[code][airport][checksum]
  const regex =
    /^L(\d{2})A([A-Z0-9]+)\/([A-Z]{4})\.TI2\/(\d{3})([A-Z]{4})([A-F0-9]+)$/;
  const match = message.text.match(regex);

  if (!match) {
    if (options.debug) {
      console.log(`Decoder: Unknown H1 ATIS message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  // const seq = match[1]; // not used
  const flight = match[2];
  const facility = match[3];
  const code = match[4];
  const airport = match[5];
  const checksum = match[6];

  ResultFormatter.flightNumber(result, flight);
  ResultFormatter.arrivalAirport(result, facility);

  result.raw.atis_code = code;
  result.formatted.items.push({
    type: 'atis',
    code: 'ATIS_CODE',
    label: 'ATIS Code',
    value: code,
  });

  // The airport in the TI2 section
  if (airport !== facility) {
    result.raw.atis_airport = airport;
    result.formatted.items.push({
      type: 'icao',
      code: 'ATIS_ARPT',
      label: 'ATIS Airport',
      value: airport,
    });
  }

  // Checksum
  ResultFormatter.checksum(result, parseInt(checksum, 16));

  result.decoded = true;
  result.decoder.decodeLevel = 'full';

  return result;
}
