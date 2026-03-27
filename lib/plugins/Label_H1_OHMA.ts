import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

import * as pako from 'pako';

const textDecoder = new TextDecoder();

function base64ToUint8Array(base64: string): Uint8Array {
  // Match Buffer.from(str, 'base64') behavior: strip non-base64 chars, handle missing padding
  const cleaned = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Inflate compressed data with support for partial/truncated streams.
 */
function inflateData(data: Uint8Array): Uint8Array | undefined {
  const chunks: Uint8Array[] = [];
  const inflator = new pako.Inflate({ windowBits: 15 });
  inflator.onData = (chunk: Uint8Array) => {
    chunks.push(chunk);
  };
  inflator.push(data, 2); // Z_SYNC_FLUSH

  if (chunks.length === 0) return undefined;
  if (chunks.length === 1) return chunks[0];

  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export class Label_H1_OHMA extends DecoderPlugin {
  name = 'label-h1-ohma';

  qualifiers() {
    return {
      labels: ['H1'],
      preambles: ['OHMA', '/RTNBOCR.OHMA', '#T1B/RTNBOCR.OHMA'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'OHMA Message';
    decodeResult.message = message;

    const data = message.text.split('OHMA')[1]; // throw out '/RTNOCR.' - even though it means something
    try {
      const compressedBuffer = base64ToUint8Array(data);
      const result = inflateData(compressedBuffer);
      if (!result || result.length === 0) {
        throw new Error('Decompression produced no output');
      }
      const jsonText = textDecoder.decode(result);

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
        code: 'OHMA',
        label: 'OHMA Downlink',
        value: formattedMsg,
      });
    } catch (e) {
      // Unknown
      if (options.debug) {
        console.log(`Decoder: Unknown H1 OHMA message: ${message.text}`, e);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}
