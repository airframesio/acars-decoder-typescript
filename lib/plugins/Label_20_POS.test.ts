import { MessageDecoder } from '../MessageDecoder';
import { Label_20_POS } from './Label_20_POS';

describe('Label_20_POS', () => {
  const decoder = new MessageDecoder();
  const plugin = new Label_20_POS(decoder);

  const decode = (text: string) => {
    return plugin.decode({ text });
  };

  it('decodes POS variation with 11 fields (coordinates only required)', () => {
    const text = 'POSN38160W077075,,211733,360,OTT,212041,,N42,19689,40,544';
    const res = decode(text);

    expect(res.decoded).toBe(true);
    expect(res.decoder.decodeLevel).toBe('full');
    expect(res.formatted.description).toBe('Position Report');
    expect(res.raw.preamble).toBe('POS');
  });

  it('decodes POS variation with 5 fields (coordinates only)', () => {
    const text = 'POSN38160W077075,,211733,360,OTT';
    const res = decode(text);

    expect(res.decoded).toBe(true);
    expect(res.decoder.decodeLevel).toBe('full');
    expect(res.formatted.description).toBe('Position Report');
  });

  it('marks unknown variation as not decoded', () => {
    const text = 'POSUNKNOWN';
    const res = decode(text);

    expect(res.decoded).toBe(false);
    expect(res.decoder.decodeLevel).toBe('none');
    expect(res.formatted.description).toBe('Position Report');
  });
});
