// Escape-hatch port of lib/plugins/Label_H1_FLR.ts decode().

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

export function label_h1_flr_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const parts = message.text.split('/FR');

  if (parts.length > 1) {
    // decode header
    const fields = parts[0].split('/');
    // 0 is the msg type
    for (let i = 1; i < fields.length; i++) {
      const field = fields[i];
      ResultFormatter.unknown(result, field, '/');
    }

    const data = parts[1].substring(0, 20);
    const msg = parts[1].substring(20);
    const datetime = data.substring(0, 12); // YYMMDDHHMMSS (SS might be next 2 chars)
    const date =
      datetime.substring(4, 6) +
      datetime.substring(2, 4) +
      datetime.substring(0, 2);

    ResultFormatter.unknown(result, data.substring(12), '/');
    result.raw.message_timestamp = DateTimeUtils.convertDateTimeToEpoch(
      datetime.substring(6),
      date,
    );
    // TODO: decode further
    result.raw.fault_message = msg;
    result.formatted.items.push({
      type: 'fault',
      code: 'FR',
      label: 'Fault Report',
      value: result.raw.fault_message as string,
    });

    // Equivalent to plugin.setDecodeLevel(result, true, 'partial')
    result.decoded = true;
    result.decoder.decodeLevel = 'partial';
  } else {
    // Equivalent to plugin.failUnknown(result, message.text, options)
    if (options.debug) {
      console.log(`Unknown message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
  }

  return result;
}
