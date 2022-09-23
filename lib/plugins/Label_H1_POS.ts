import { DecoderPlugin } from '../DecoderPlugin';

// Position Report
export class Label_H1_POS extends DecoderPlugin {
  name = 'label-h1-pos';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['H1'],
      preambles: ['POS'],
    };
  }

  decode(message: any, options: any = {}) : any {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Position Report';
    decodeResult.message = message;

    const rawCoords = message.text.substring(3);
    decodeResult.raw.position = this.decodeStringCoordinates(rawCoords);
    if(decodeResult.raw.position) {
      decodeResult.formatted.items.push({
          type: 'position',
          label: 'Position',
          value: this.coordinateString(decodeResult.raw.position),
      });
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';
    return decodeResult;
  }
}

export default {};
