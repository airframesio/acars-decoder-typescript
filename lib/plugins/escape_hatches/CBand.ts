import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for CBand (C-Band wrapper).
 *
 * Matches a leading 10-char C-Band header:
 *     /^(?<msgno>[A-Z]\d{2}[A-Z])(?<airline>[A-Z0-9]{2})(?<number>[0-9]{4})/
 *
 * On a hit, strips the header, recursively invokes the MessageDecoder
 * (via `plugin.decoder.decode`) on the remainder with the same
 * label/sublabel, prepends the flight number ("airline" + Number(number)),
 * and merges the nested raw/items/remaining into this result. The
 * decoder.name is augmented to "cband-" + nested decoder name and the
 * description is replaced with the nested decoder's description.
 *
 * If the header doesn't match, the result is left as-is with
 * decoded=false (the dispatcher will fall through to the next plugin).
 */
export function cband_dispatch(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const cband = message.text.match(
    /^(?<msgno>[A-Z]\d{2}[A-Z])(?<airline>[A-Z0-9]{2})(?<number>[0-9]{4})/,
  );
  if (cband?.groups) {
    const messageText = message.text.substring(10);
    const decoded = plugin.decoder.decode(
      {
        label: message.label,
        sublabel: message.sublabel,
        text: messageText,
      },
      options,
    );
    if (decoded.decoded) {
      ResultFormatter.flightNumber(
        result,
        cband.groups.airline + Number(cband.groups.number),
      );
      result.decoded = true;
      result.decoder.decodeLevel = decoded.decoder.decodeLevel;
      result.decoder.name = plugin.name + '-' + decoded.decoder.name;
      result.raw = { ...result.raw, ...decoded.raw };
      result.formatted.description = decoded.formatted.description;
      result.formatted.items.push(...decoded.formatted.items);
      result.remaining = decoded.remaining;
    }
  }
  return result;
}
