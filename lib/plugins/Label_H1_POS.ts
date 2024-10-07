import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { FlightPlanUtils } from '../utils/flight_plan_utils';
import { H1Helper } from '../utils/h1_helper';
import { RouteUtils } from '../utils/route_utils';

export class Label_H1_POS extends DecoderPlugin {
  name = 'label-h1-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1", '4J'],
      preambles: ['POS', '#M1BPOS', '/.POS'], //TODO - support data before #
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;
    decodeResult.remaining.text = '';

    const fulllyDecoded = H1Helper.decodeH1Message(decodeResult, message.text);
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = fulllyDecoded ? 'full' : 'partial';
    if (decodeResult.formatted.items.length === 0) {
      if (options?.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }
    return decodeResult;
  }
}

export default {};