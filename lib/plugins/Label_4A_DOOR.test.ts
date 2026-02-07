import { MessageDecoder } from '../MessageDecoder';
import { Label_4A_DOOR } from './Label_4A_DOOR';

describe('Label 4A preamble DOOR', () => {
  let plugin: Label_4A_DOOR;
  const message = { label: '4A', text: '' };
  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4A_DOOR(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-4a-door');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['4A'],
      preambles: ['DOOR'],
    });
  });

  test('decodes variant 1', () => {
    // https://app.airframes.io/messages/3453841057
    message.text = 'DOOR/FWDENTRY CLSD 1440';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.decoder.name).toBe('label-4a-door');
    expect(decodeResult.formatted.description).toBe('Latest New Format');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.remaining.text).toBe(undefined);
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].code).toBe('DOOR');
    expect(decodeResult.formatted.items[0].value).toBe('FWDENTRY CLSD');
    expect(decodeResult.formatted.items[1].code).toBe('MSG_TOD');
    expect(decodeResult.formatted.items[1].value).toBe('14:40:00');
  });

  // disabled because all messages should decode
  test.skip('decodes Label 4A_DOOR <invalid>', () => {
    message.text = '4A_DOOR Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-4a-door');
    expect(decodeResult.formatted.description).toBe('Latest New Format');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
