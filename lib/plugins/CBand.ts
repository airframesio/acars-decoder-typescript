import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { MIAMCoreUtils } from '../utils/miam';
import { ResultFormatter } from '../utils/result_formatter';

// C-Band puts a 10 char header in front of some message types:
//   chars 0-3: message number ([A-Z]\d{2}[A-Z])
//   chars 4-5: airline code ([A-Z0-9]{2})
//   chars 6-9: flight number ([0-9]{4})
// Hoisted to module scope so the pattern is allocated once instead of on
// every wildcard decode invocation.
const CBAND_HEADER =
  /^(?<msgno>[A-Z]\d{2}[A-Z])(?<airline>[A-Z0-9]{2})(?<number>[0-9]{4})/;

export class CBand extends DecoderPlugin {
  name = 'c-band';
  qualifiers() {
    return {
      labels: ['*'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const text = message.text;
    // Cheap length check before running the regex — a C-Band header is
    // exactly 10 chars and is followed by the wrapped payload.
    if (text.length < 10) {
      const result = this.defaultResult();
      result.decoder.name = this.name;
      result.message = message;
      return result;
    }

    const cband = CBAND_HEADER.exec(text);
    if (!cband?.groups) {
      const result = this.defaultResult();
      result.decoder.name = this.name;
      result.message = message;
      return result;
    }

    const decoded = this.decoder.decode(
      {
        label: message.label,
        sublabel: message.sublabel,
        text: text.substring(10),
      },
      options,
    );

    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    if (decoded.decoded) {
      ResultFormatter.flightNumber(
        decodeResult,
        cband.groups.airline + Number(cband.groups.number),
      );
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = decoded.decoder.decodeLevel;
      decodeResult.decoder.name = this.name + '-' + decoded.decoder.name;
      decodeResult.raw = { ...decodeResult.raw, ...decoded.raw };
      decodeResult.formatted.description = decoded.formatted.description;
      decodeResult.formatted.items.push(...decoded.formatted.items);
      decodeResult.remaining = decoded.remaining;
    }
    return decodeResult;
  }
}
