// Escape-hatch port of lib/plugins/Label_ColonComma.ts decode().

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';

export function label_colon_comma_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  result.raw.frequency = Number(message.text) / 1000;

  result.formatted.items.push({
    type: 'frequency',
    label: 'Frequency',
    value: `${result.raw.frequency} MHz`,
    code: 'FREQ',
  });

  result.decoded = true;
  result.decoder.decodeLevel = 'full';

  return result;
}
