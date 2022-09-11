import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';

export class Label_30_Slash_EA extends DecoderPlugin {
  name = 'label-30-slash-ea';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["30"],
      preambles: ['/EA'],
    };
  }

  decode(message: any, options: any = {}) : any {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ETA Report';
    decodeResult.message = message;

    // Style: /EA1830/DSKSFO/SK24
    const results = message.text.split(/\n|\//).slice(1); // Split by / and new line

    if (results) {
      if (options.debug) {
        console.log(`Label 30 EA: results`);
        console.log(results);
      }
    }

    decodeResult.formatted.items.push({
      type: 'eta',
      code: 'ETA',
      label: 'Estimated Time of Arrival',
      value: DateTimeUtils.UTCToString(results[0].substr(2, 4)),
    });

    if (results[1].substr(0, 2) === "DS") {
        decodeResult.raw.arrival_icao = results[1].substr(2, 4);
	decodeResult.formatted.items.push({
          type: 'destination',
          code: 'DST',
          label: 'Destination',
          value: decodeResult.raw.arrival_icao,
        });

      // We don't know what the /SK section means. We have seen various numbers
      // after the /SK.
      decodeResult.remaining.text = "/".concat(results[2]);
    } else {
      decodeResult.remaining.text = "/".concat(results[1], "/", results[2])
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
