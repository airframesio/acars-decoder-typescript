import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

export class Label_H1_FLR extends DecoderPlugin {
  name = 'label-h1-flr';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['FLR', '#CFBFLR'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult: any = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Fault Log Report';
    decodeResult.message = message;

    const parts = message.text.split('/FR');

    if(parts.length > 1){
      decodeResult.remaining.text = '';

      //decode header
      // can go away, here because i want to decode it
      const fields = parts[0].split('/');
      // 0 is the msg type
      for(let i=1; i<fields.length; i++) {
        const field = fields[i];
        if(field.startsWith('PN')) {
          processUnknown(decodeResult, '/' + field);
        } else {
          processUnknown(decodeResult, '/' + field);
        }
      }

      const data = parts[1].substring(0,20);
      const msg = parts[1].substring(20);
      const datetime = data.substring(0,12); // YYMMDDHHMMSS (SS might be next 2 chars)
      const date = datetime.substring(4,6) + datetime.substring(2,4)+ datetime.substring(0,2);

      processUnknown(decodeResult, data.substring(12));
      decodeResult.raw.message_timestamp = DateTimeUtils.convertDateTimeToEpoch(datetime.substring(6), date);
      // TODO: decode further
      decodeResult.raw.fault_message = msg;
      decodeResult.formatted.items.push({
        type: 'fault',
        code: 'FR',
        label: 'Fault Report',
        value: decodeResult.raw.fault_message,
      });
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
     } else {
      // Unknown
      if (options.debug) {
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

function processUnknown(decodeResult: any, value: string) {
  decodeResult.remaining.text += value;
}
