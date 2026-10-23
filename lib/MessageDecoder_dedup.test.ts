import { MessageDecoder } from './MessageDecoder';
import { DecoderPlugin } from './DecoderPlugin';
import { DecodeResult, Message } from './DecoderPluginInterface';

class FakePlugin extends DecoderPlugin {
  name = 'fake-plugin';

  constructor(labels: string[], decoder?: MessageDecoder) {
    super(decoder ?? ({} as MessageDecoder));
    this.testLabels = labels;
  }

  testLabels: string[];

  callCount = 0;

  qualifiers() {
    return {
      labels: this.testLabels,
    };
  }

  decode(message: Message): DecodeResult {
    this.callCount += 1;
    const result = this.defaultResult();
    result.decoder.name = this.name;
    result.message = message;
    result.formatted.description = 'fake';
    result.formatted.items.push({
      type: 'fake',
      code: 'FAKE',
      label: 'Fake',
      value: 'x',
    });
    return result;
  }
}

describe('#537 — registerPlugin double-registers a specific-then-wildcard plugin', () => {
  it('registers a plugin listing a specific label before * exactly once', () => {
    const decoder = new MessageDecoder();
    const plugin = new FakePlugin(['LABEL_X', '*']);
    decoder.registerPlugin(plugin);
    const message = { label: 'LABEL_X', text: 'anything' };
    decoder.decode(message);
    expect(plugin.callCount).toBe(1);
  });

  it('registers a plugin listing * before a specific label exactly once', () => {
    const decoder = new MessageDecoder();
    const plugin = new FakePlugin(['*', 'LABEL_X']);
    decoder.registerPlugin(plugin);
    const message = { label: 'LABEL_X', text: 'anything' };
    decoder.decode(message);
    expect(plugin.callCount).toBe(1);
  });

  it('holds the entry once in the LABEL_X bucket', () => {
    const decoder = new MessageDecoder();
    const plugin = new FakePlugin(['LABEL_X', '*']);
    decoder.registerPlugin(plugin);
    const bucket = (decoder as unknown as {
      candidatesByLabel: Map<string, { plugin: unknown }[]>;
    }).candidatesByLabel.get('LABEL_X');
    expect(bucket?.filter((e) => e.plugin === plugin)).toHaveLength(1);
  });

  it('still matches the wildcard for messages of other labels', () => {
    const decoder = new MessageDecoder();
    const plugin = new FakePlugin(['LABEL_X', '*']);
    decoder.registerPlugin(plugin);
    decoder.decode({ label: 'LABEL_Y', text: 'anything' });
    expect(plugin.callCount).toBe(1);
  });
});
