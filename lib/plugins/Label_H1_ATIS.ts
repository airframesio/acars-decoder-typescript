import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

export class Label_H1_ATIS extends DecoderPlugin {
  name = 'label-h1-atis';

  qualifiers() {
    return {
      labels: ['H1', '5Z'],
      preambles: ['L'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ATIS Subscription';
    decodeResult.message = message;

    // Pattern: L[2-digit seq]A[flight]/[facility].TI2/[code][airport][checksum]
    const regex = /^L(\d{2})A([A-Z0-9]+)\/([A-Z]{4})\.TI2\/(\d{3})([A-Z]{4})([A-F0-9]+)$/;
    const match = message.text.match(regex);

    if (!match) {
      if (options.debug) {
        console.log(`Decoder: Unknown H1 ATIS message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
      return decodeResult;
    }

    const seq = match[1];
    const flight = match[2];
    const facility = match[3];
    const code = match[4];
    const airport = match[5];
    const checksum = match[6];

    ResultFormatter.flightNumber(decodeResult, flight);
    ResultFormatter.arrivalAirport(decodeResult, facility);

    decodeResult.raw.atis_code = code;
    decodeResult.formatted.items.push({
      type: 'atis',
      code: 'ATIS_CODE',
      label: 'ATIS Code',
      value: code,
    });

    // The airport in the TI2 section
    if (airport !== facility) {
      decodeResult.raw.atis_airport = airport;
      decodeResult.formatted.items.push({
        type: 'icao',
        code: 'ATIS_ARPT',
        label: 'ATIS Airport',
        value: airport,
      });
    }

    // Checksum
    ResultFormatter.checksum(decodeResult, parseInt(checksum, 16));

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}
