import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import { ResultFormatter } from '@airframes/ads-runtime-ts';
import { MIAMCoreUtils } from '../../utils/miam';

/**
 * Whole-plugin parse hatch for Label_MA (MIAM core).
 *
 * Runs MIAMCoreUtils.parse on the raw text (ASCII85 + deflate + CRC +
 * version-dependent PDU framing). When the inner ACARS PDU is present
 * we emit label/sublabel/tail items, and if the PDU is CRC-OK +
 * complete + carries text we recursively dispatch back through the
 * MessageDecoder. Recursive results are merged into raw/items/remaining;
 * a failed inner decode falls back to a plain text item + remaining.
 */
export function label_ma_dispatch(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const miamResult = MIAMCoreUtils.parse(message.text);
  if (
    miamResult.decoded &&
    miamResult.message.data &&
    miamResult.message.data.acars
  ) {
    result.decoded = true;
    ResultFormatter.label(result, miamResult.message.data.acars.label);
    if (miamResult.message.data.acars.sublabel) {
      ResultFormatter.sublabel(
        result,
        miamResult.message.data.acars.sublabel,
      );
    }
    if (miamResult.message.data.acars.tail) {
      ResultFormatter.tail(
        result,
        miamResult.message.data.acars.tail.replace('.', ''),
      );
    }

    const messageText = miamResult.message.data.acars.text;
    if (
      miamResult.message.data.crcOk &&
      miamResult.message.data.complete &&
      messageText
    ) {
      result.decoder.decodeLevel = 'full';
      const decoded = plugin.decoder.decode(
        {
          label: miamResult.message.data.acars.label,
          sublabel: miamResult.message.data.acars.sublabel,
          text: messageText,
        },
        options,
      );

      if (decoded.decoded) {
        result.raw = { ...result.raw, ...decoded.raw };
        result.formatted.items.push(...decoded.formatted.items);
        result.remaining = decoded.remaining;
      } else {
        ResultFormatter.text(result, messageText);
        result.remaining = { text: messageText };
      }
    } else if (messageText) {
      result.decoder.decodeLevel = 'partial';
      result.remaining = { text: messageText };
    } else {
      result.decoder.decodeLevel = 'partial';
    }
  }
  return result;
}
