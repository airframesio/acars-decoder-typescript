import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('ARINC_702 wildcard wrapper', () => {
  let plugin: Arinc702;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('matches wildcard qualifier', () => {
    expect(plugin.qualifiers()).toEqual({ labels: ['*'] });
    expect(plugin.name).toBe('arinc-702');
  });

  test('strips embedded CR/LF before delegating to the H1 helper', () => {
    // Inserting newlines into a known-good H1 REQ POS payload should not
    // prevent it from being decoded.
    message.text = 'REQ\nPOS\r037B';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.checksum).toBe(0x037b);
    expect(result.formatted.description).toBe('Request for Position Report');
  });

  test('peels a leading / header before delegating', () => {
    // /HDQDLUA.<H1 message body>
    message.text = '/HDQDLUA.REQPOS037B';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    // The delegated H1 body must actually be decoded — assert the
    // REQ POS fields landed in the result, proving the '/HDQDLUA.'
    // prefix was peeled before delegation.
    expect(result.formatted.description).toBe('Request for Position Report');
    expect(result.raw.checksum).toBe(0x037b);
    // The unparsed header also ends up in remaining text.
    expect(result.remaining.text).toContain('/HDQDLUA');
  });

  test('returns not-decoded when nothing matches', () => {
    message.text = 'totally bogus payload that no H1 rule matches';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
    // The full original text should be present in the remaining text the
    // wrapper accumulates (the wrapper may also emit prefix fragments).
    expect(result.remaining.text).toContain(message.text);
  });

  test('end-to-end via MessageDecoder routes ARINC 702 wildcard for H1', () => {
    const decoder = new MessageDecoder();
    const result = decoder.decode({ label: 'H1', text: 'REQPOS037B' });
    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Request for Position Report');
  });
});
