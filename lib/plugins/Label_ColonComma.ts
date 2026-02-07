import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

export class Label_ColonComma extends DecoderPlugin {
  name = 'label-colon-comma';

  qualifiers() {
    return {
      labels: [':;'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;

    decodeResult.raw.frequency = Number(message.text) / 1000;

    decodeResult.formatted.description =
      'Aircraft Transceiver Frequency Change';
    decodeResult.formatted.items.push({
      type: 'frequency',
      label: 'Frequency',
      value: `${decodeResult.raw.frequency} MHz`,
      code: 'FREQ',
    });

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}
