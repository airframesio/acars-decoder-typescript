import { DecoderPlugin } from '../DecoderPlugin';

export class Label_QS extends DecoderPlugin {
  name = 'label-qs';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['QS'],
    };
  }

  decode(message: any, options: any = {}) : any {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    
    decodeResult.raw.origin = message.text.substring(0, 4);
    decodeResult.raw.destination = message.text.substring(4, 8);
    decodeResult.raw.gate_in = message.text.substring(8, 12);
    decodeResult.remaining.text = message.text.substring(12);

    decodeResult.formatted.description = 'IN Report';

    decodeResult.formatted.items = [
      {
        type: 'origin',
        code: 'ORG',
        label: 'Origin',
        value: decodeResult.raw.origin,
      },
      {
        type: 'destination',
        code: 'DST',
        label: 'Destination',
        value: decodeResult.raw.destination,
      },
      {
        type: 'gate_in',
        code: 'GIN',
        label: 'Gate IN',
        value: decodeResult.raw.gate_in,
      }
    ];

    decodeResult.decoded = true;
    if(decodeResult.remaining.text === "") 
	decodeResult.decoder.decodeLevel = 'full';
    else
	decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}

export default {};
