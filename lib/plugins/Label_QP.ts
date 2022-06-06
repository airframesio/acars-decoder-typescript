import { DecoderPlugin } from '../DecoderPlugin';

export class Label_QP extends DecoderPlugin {
  name = 'label-qp';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['QP'],
    };
  }

  decode(message: any, options: any = {}) : any {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    
    decodeResult.raw.origin = message.text.substring(0, 4);
    decodeResult.raw.destination = message.text.substring(4, 8);
    decodeResult.raw.gate_out = message.text.substring(8, 12);
   
    let remain = message.text.substring(12);

    decodeResult.formatted.description = 'OUT Report';

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
        type: 'gate_out',
        code: 'GOUT',
        label: 'Gate OUT',
        value: decodeResult.raw.gate_out,
      }
    ];

    decodeResult.decoded = true;
    if(remain === "") 
	decodeResult.decoder.decodeLevel = 'full';
    else
	decodeResult.decoder.decodeLevel = 'partial';

console.log(decodeResult.decoder.decodeLevel);

    return decodeResult;
  }
}

export default {};
