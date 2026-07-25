import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';
import { Arinc702Helper } from '../../utils/arinc_702_helper';

/**
 * Whole-plugin parse hatch for ARINC_702 (ARINC 702 Message).
 *
 * Tries Arinc702Helper.decodeH1Message on, in order:
 *   1. the raw (CR/LF stripped) text;
 *   2. when the text starts with '/', the body after the first '.';
 *   3. when split by '#' gives exactly two parts, the chunk after a
 *      heuristic offset (3 or 4 depending on preceding context),
 *      pulling the flight number from the leading chunk and rebuilding
 *      remaining.text in original order;
 *   4. when split by '/' has a leading chunk > 3 chars, the slice
 *      starting 3 chars before the '/', with the leading 3 chars +
 *      '/' restored at the front of remaining.text.
 *
 * processDecodeResult finalizes the decoded flag and decodeLevel; if no
 * items were emitted, falls back to unknown with debug logging.
 */
export function arinc_702_dispatch(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const msg = message.text.replace(/\n|\r/g, '');

  let decoded = false;
  decoded = Arinc702Helper.decodeH1Message(result, msg);
  if (decoded) {
    return processDecodeResult(result, decoded, options, message);
  }

  if (msg.startsWith('/')) {
    const headerData = msg.split('.');
    decoded = Arinc702Helper.decodeH1Message(
      result,
      headerData.slice(1).join('.'),
    );

    if (decoded) {
      result.remaining.text =
        headerData[0] + '.' + result.remaining.text;
      return processDecodeResult(result, decoded, options, message);
    }
  }

  const hashParts = msg.split('#');
  if (hashParts.length === 2) {
    const offset =
      hashParts[0] === '- ' || isNaN(parseInt(hashParts[1][1])) ? 3 : 4;
    decoded = Arinc702Helper.decodeH1Message(
      result,
      msg.slice(hashParts[0].length + offset),
    );
    if (decoded && hashParts[0].length > 0) {
      ResultFormatter.flightNumber(result, hashParts[0].substring(4));
      result.remaining.text =
        hashParts[0].substring(0, 4) +
        '#' +
        hashParts[1].substring(0, offset - 1) +
        '/' +
        result.remaining.text;
    }
    if (decoded) {
      return processDecodeResult(result, decoded, options, message);
    }
  }

  const slashParts = msg.split('/');
  if (slashParts[0].length > 3) {
    decoded = Arinc702Helper.decodeH1Message(
      result,
      msg.slice(slashParts[0].length - 3),
    );
    result.remaining.text =
      slashParts[0].slice(0, 3) + '/' + result.remaining.text;
  }

  return processDecodeResult(result, decoded, options, message);
}

function processDecodeResult(
  result: DecodeResult,
  decoded: boolean,
  options: Options,
  message: Message,
): DecodeResult {
  result.decoded = decoded;
  result.decoder.decodeLevel = !result.remaining.text ? 'full' : 'partial';
  if (result.formatted.items.length === 0) {
    if (options.debug) {
      console.log(`Decoder: Unknown H1 message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
  }
  return result;
}
