import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { FlightPlanUtils } from '../utils/flight_plan_utils';

export class Label_H1_FPN extends DecoderPlugin {
  name = 'label-h1-fpn';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['FPN', '#M1BFPN'],
    };
  }

  decode(message: Message, options: any = {} ): any {
    let decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Flight Plan';
    decodeResult.message = message;

    const msg = message.text.replace(/\n|\r/g, "");
    const checksum = msg.slice(-4);
    const data = msg.slice(0, msg.length-4).split(':');
    if(data.length > 1) {
      const fulllyDecoded = FlightPlanUtils.processFlightPlan(decodeResult, data)
      addChecksum(decodeResult, checksum);
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = fulllyDecoded ? 'full' :  'partial';
    } else {// Unknown
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

function addChecksum(decodeResult: any, value: string) {
  decodeResult.raw.checksum = Number("0x"+value);
  decodeResult.formatted.items.push({
    type: 'message_checksum',
    code: 'CHECKSUM',
    label: 'Message Checksum',
    value: '0x' + ('0000' + decodeResult.raw.checksum.toString(16)).slice(-4),
  });    
};
