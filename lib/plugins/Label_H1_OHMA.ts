import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

import * as zlib  from "minizlib";

export class Label_H1_OHMA extends DecoderPlugin {
  name = 'label-h1-ohma';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["H1"],
      preambles: ['OHMA', '/RTNBOCR.OHMA', '#T1B/RTNBOCR.OHMA'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'OHMA Message';
    decodeResult.message = message;
    decodeResult.remaining.text = '';

    const data = message.text.split('OHMA')[1]; // throw out '/RTNOCR.' - even though it means something
    try {
      const compressedBuffer = Buffer.from(data, 'base64');
      const decompress = new zlib.Inflate({windowBits: 15});
      decompress.write(compressedBuffer);
      decompress.flush(zlib.constants.Z_SYNC_FLUSH);
      const result = decompress.read();
      const jsonText = result.toString();
      
      let formattedMsg;
      let jsonMessage;
      try {
        jsonMessage = JSON.parse(jsonText).message;
      } catch {
        jsonMessage = jsonText;
      }

      try {
        const ohmaMsg = JSON.parse(jsonMessage);
        formattedMsg = JSON.stringify(ohmaMsg, null, 2);
      } catch {
        formattedMsg = jsonMessage;
      }
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'full';
      decodeResult.raw.ohma = jsonText;
      decodeResult.formatted.items.push({
        type: 'ohma',
        code: 'OHMA' ,
        label: 'OHMA Downlink',
        value: formattedMsg,
      });
    } catch (e) {
      // Unknown
      if (options.debug) {
        console.log(`Decoder: Unknown H1 OHMA message: ${message.text}`, e);
      }
      decodeResult.remaining.text += message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }

	  return decodeResult;
  }
}

export default {};

