import { DecoderPluginInterface } from './DecoderPluginInterface';

export abstract class DecoderPlugin implements DecoderPluginInterface {
  decoder!: any;

  name: string = 'unknown';

  defaultResult: any = {
    decoded: false,
    decoder: <any>{
      name: 'unknown',
      type: 'pattern-match',
      decodeLevel: 'none',
    },
    formatted: <any>{
      description: 'Unknown',
      items: <any>[],
    },
    raw: <any>{},
    remaining: <any>{},
  };

  options: Object;

  constructor(decoder : any, options : any = {}) {
    this.decoder = decoder;
    this.options = options;
  }

  id() : string { // eslint-disable-line class-methods-use-this
    console.log('DecoderPlugin subclass has not overriden id() to provide a unique ID for this plugin!');
    return 'abstract_decoder_plugin';
  }

  meetsStateRequirements() : boolean { // eslint-disable-line class-methods-use-this
    return true;
  }

  // onRegister(store: Store<any>) {
  //   this.store = store;
  // }

  qualifiers() : any { // eslint-disable-line class-methods-use-this
    const labels : Array<string> = [];

    return {
      labels,
    };
  }

  decode(message: any) : any { // eslint-disable-line class-methods-use-this
    const decodeResult: any = this.defaultResult;
    decodeResult.remaining.text = message.text;
    return decodeResult;
  }

  // Utilities
  // TODO: Move these to a utilities class and instanciate here for use in subclasses

  decodeStringCoordinates(stringCoords: String) : any { // eslint-disable-line class-methods-use-this
    var results : any = {};
    // format: N12345W123456 or N12345 W123456
    const firstChar = stringCoords.substring(0, 1);
    let middleChar = stringCoords.substring(6, 7);
    let longitudeChars = stringCoords.substring(7, 13);
    if (middleChar ==' ') {
		middleChar = stringCoords.substring(7, 8);
      		longitudeChars = stringCoords.substring(8, 14);
    }
    if ((firstChar === 'N' || firstChar === 'S') && (middleChar === 'W' || middleChar === 'E')) {
      results.latitudeDirection = firstChar;
      results.latitude = (Number(stringCoords.substring(1, 6)) / 1000) * (firstChar === 'S' ? -1 : 1);
      results.longitudeDirection = middleChar;
      results.longitude = (Number(longitudeChars) / 1000) * (middleChar === 'W' ? -1 : 1);
    } else {
      return undefined;
    }

    return results;
  }

  coordinateString(coords: any) : String {
    return `${Math.abs(coords.latitude)} ${coords.latitudeDirection}, ${Math.abs(coords.longitude)} ${coords.longitudeDirection}`
  }
}

export default {};
