// Escape-hatch port of lib/plugins/Label_B6.ts decode().
// TS source is a placeholder: returns defaultResult with description only;
// no fields parsed, decoded stays false. Preserves the debug log path.

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';

export function label_b6_forwardslash_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  if (options.debug) {
    console.log('CPDLC: ' + message);
  }
  return result;
}
