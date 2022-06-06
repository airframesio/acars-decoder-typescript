import { DecoderPlugin } from '../DecoderPlugin';

export class Label_QQ extends DecoderPlugin {
  name = 'label-qq';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['QQ'],
    };
  }

  decode(message: any, options: any = {}) : any {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    
    decodeResult.raw.origin = message.text.substring(0, 4);
    decodeResult.raw.destination = message.text.substring(4, 8);
    decodeResult.raw.wheels_off = message.text.substring(8, 12);
   
    let remain = message.text.substring(12);

    decodeResult.formatted.description = 'OFF Report';

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
        type: 'wheels_off',
        code: 'WOFF',
        label: 'Wheels OFF',
        value: decodeResult.raw.wheels_off,
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
