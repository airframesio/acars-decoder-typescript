import { MessageDecoder } from '../MessageDecoder';
import { Label_B6_Forwardslash } from './Label_B6';

describe('Label B6 /', () => {
  let plugin: Label_B6_Forwardslash;
  const message = { label: 'B6', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_B6_Forwardslash(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-b6-forwardslash');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['B6'],
      preambles: ['/'],
    });
  });

  test('extracts the CPDLC body after the leading slash as text', () => {
    // The CPDLC body parser is not yet implemented, but the plugin
    // should at least surface the body as the decoded text so that
    // consumers don't lose it.
    message.text = '/SOMECPDLCBODY';
    const result = plugin.decode(message);

    expect(result.decoder.name).toBe('label-b6-forwardslash');
    expect(result.formatted.description).toBe('CPDLC Message');
    expect(result.message).toBe(message);
    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.raw.text).toBe('SOMECPDLCBODY');
    expect(result.formatted.items[0]).toEqual({
      type: 'text',
      code: 'TEXT',
      label: 'Text Message',
      value: 'SOMECPDLCBODY',
    });
  });

  test('does not decode an empty body', () => {
    message.text = '/';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
  });

  test('preamble filtering keeps non-/ messages from being routed here', () => {
    const decoder = new MessageDecoder();
    const result = decoder.decode({
      label: 'B6',
      text: 'NOT_A_CPDLC_BODY',
    });
    // No B6 plugin matches a non-/ preamble, so the message is not decoded
    // by Label_B6_Forwardslash.
    expect(result.decoder.name).not.toBe('label-b6-forwardslash');
  });
});
