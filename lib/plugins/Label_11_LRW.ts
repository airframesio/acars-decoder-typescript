import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { RunwayUtils } from '../utils/runway_utils';

// One runway per line: the runway, a variant's code and condition when it is one, and the
// length available (feet), e.g. `11 /AIB  -E1804F    8300` or `09 /12   LAHSO      9749`.
const RUNWAY =
  /^(\d{1,2}[LRC]?)\s?(?:\/(\S+))?\s+(?:(-\S+|LAHSO)\s+)?(\d{3,5})\s*$/;

/**
 * Southwest Airlines landing runways (LRW01): every runway at an airport, with its variants,
 * that landing data can be requested for. Answers the label 10 LRW01 request.
 */
export class Label_11_LRW extends DecoderPlugin {
  name = 'label-11-lrw';

  qualifiers() {
    return {
      labels: ['11'],
      preambles: ['LRW01,'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Landing Runways');

    const nl = message.text.includes('\r\n') ? '\r\n' : '\n';
    const first = message.text.match(/^LRW01,(\w{4}) LANDING RUNWAYS,/);
    if (!first) {
      return this.failUnknown(decodeResult, message.text, options);
    }
    ResultFormatter.landingAirport(decodeResult, first[1]);

    const lines = message.text.slice(first[0].length).split(/\r?\n/);
    for (const line of lines) {
      if (line.trim() === '') continue;
      const m = line.match(RUNWAY);
      if (!m) {
        // a runway cut off by the end of the block
        ResultFormatter.unknown(decodeResult, line.trim(), nl);
        continue;
      }
      const runway = [m[2] ? `${m[1]}/${m[2]}` : m[1], m[3]]
        .filter((part) => part !== undefined)
        .join(' ');
      const description = RunwayUtils.variantDescription(runway);
      ResultFormatter.runwayLandingData(decodeResult, {
        runway,
        ...(description === undefined ? {} : { variant: description }),
        length: Number(m[4]),
        stoppingMargins: {},
      });
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
