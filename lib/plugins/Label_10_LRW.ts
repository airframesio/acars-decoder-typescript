import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Southwest Airlines landing runways request (LRW01), answered by the label 11 LRW01 list of
 * runways at the destination.
 */
export class Label_10_LRW extends DecoderPlugin {
  name = 'label-10-lrw';

  qualifiers() {
    return {
      labels: ['10'],
      preambles: ['LRW01,'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Landing Runways Request');

    // type, airline ID, layout, software, always 0, not yet understood, origin, destination
    const parts = message.text.split(',');
    if (parts.length < 8) {
      return this.failUnknown(decodeResult, message.text, options);
    }

    ResultFormatter.raw(
      decodeResult,
      'software_version',
      'SWVER',
      'Software Version',
      parts[3],
    );
    ResultFormatter.departureAirport(decodeResult, parts[6]);
    ResultFormatter.arrivalAirport(decodeResult, parts[7]);
    ResultFormatter.unknownArr(decodeResult, [
      parts[1],
      parts[2],
      parts[4],
      parts[5],
      ...parts.slice(8).filter((field) => field.trim() !== ''),
    ]);

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
