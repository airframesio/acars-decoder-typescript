import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_4A_Slash_01 (/01 preamble — Latest New Format).
 *
 * Ported from lib/plugins/Label_4A_Slash_01.ts. Behavior:
 *   - If message.text length is exactly 5 and starts with '/01-', emit the
 *     trailing single char as unknown and mark decoded=true.
 *   - Otherwise mark decoded=false and emit the whole message as unknown.
 *   - decodeLevel: 'none' if not decoded, else 'full' when remaining.text
 *     is empty, otherwise 'partial' (matches the source's hand-rolled logic
 *     rather than going through setDecodeLevel).
 */
export function label_4a_slash_01_decode(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  result.decoded = true;
  if (message.text.length === 5 && message.text.substring(0, 4) === '/01-') {
    ResultFormatter.unknown(result, message.text.substring(4));
  } else {
    result.decoded = false;
    ResultFormatter.unknown(result, message.text);
  }

  if (result.decoded) {
    if (!result.remaining.text) result.decoder.decodeLevel = 'full';
    else result.decoder.decodeLevel = 'partial';
  } else {
    result.decoder.decodeLevel = 'none';
  }

  return result;
}
