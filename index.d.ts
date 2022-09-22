import { MessageDecoder } from './lib/MessageDecoder';
declare namespace AcarsDecoder {
  interface DecoderPlugin {
    decode: (data: string) => string;
    coordinateString: (coords: any) => string;
  }

  interface MessageDecoder {
    constructor(): MessageDecoder;
    registerPlugin(plugin: DecoderPlugin): boolean;
    decode: (data: string, options: any) => string;
    lookupAirportByIata: (iata: string) => string;
    name: string;
    plugins: Array<DecoderPlugin>;
    debug: boolean;
  }
}
