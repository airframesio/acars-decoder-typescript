import { MessageDecoder } from './MessageDecoder';

describe('MessageDecoder', () => {
  let decoder: MessageDecoder;

  beforeEach(() => {
    decoder = new MessageDecoder();
  });

  test('MIAM core seamless decode', () => {
    const message = {
      label: 'MA',
      text: "T02!<<,:/k.E`;FOV@!'s.16q6R+p(RK,|D2ujNJhRah?_qrNftWiI-V,@*RQs,tn,FYN$/V1!gNIc6CO;$D,1:.4?dF952;>XP$\"B\"Ok-Fr'0^k?rP]3&UGoPX;\\<F`1mQ_(5_Z\\J01]+t9T9eu6ecjOlC7.H):6MAR4XuqGajJRp&=T3T7j1ipU;'tGF-f0nNn,XY\\/!!G&F*18E3l:kWakhBW\"b31<%oM6)jcY9:;p2\\5E'k3Yr1,d",
    };

    const decodeResult = decoder.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.message).toBeDefined();
    expect(decodeResult.message!.label).toBe('MA');
    expect(decodeResult.message!.sublabel).toBeUndefined();
    expect(decodeResult.message!.text).toContain('T02!<<,');
    expect(decodeResult.raw.text).toContain('A350,000354');
  });

  test('C-band core seamless decode', () => {
    const message = {
      label: '4N',
      text: 'M85AUP0109285,C,,10/12,,,,,NRT,ANC,ANC,07R/,33/,0,0,,,,,,0,0,0,0,1,0,,0,0,709.8,048.7,758.5,75F3',
    };

    const decodeResult = decoder.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.message).toBeDefined();
    expect(decodeResult.message!.label).toBe('4N');
    expect(decodeResult.message!.sublabel).toBeUndefined();
    expect(decodeResult.message!.text).toContain('M85AUP0109285');
    expect(decodeResult.formatted.items.length).toBe(7);
  });

  test('handles multiple decodes', () => {
    const message = {
      label: 'H1',
      text: 'POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40',
    };

    decoder.decode(message);

    const decodeResult = decoder.decode(message);
    expect(decodeResult.message).toBeDefined();
    expect(decodeResult.message!.label).toBe('H1');
    expect(decodeResult.formatted.items.length).toBe(5);
  });

  test('returns none for unknown label', () => {
    const message = {
      label: 'ZZ',
      text: 'some random text',
    };

    const decodeResult = decoder.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });

  test('handles empty text', () => {
    const message = {
      label: 'H1',
      text: '',
    };

    const decodeResult = decoder.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });

  test('returns result with correct structure', () => {
    const message = {
      label: '44',
      text: 'POS02,N38171W077507,319,KJFK,KUZA,0926,0245,0327,004.6',
    };

    const decodeResult = decoder.decode(message);

    expect(decodeResult).toHaveProperty('decoded');
    expect(decodeResult).toHaveProperty('decoder');
    expect(decodeResult).toHaveProperty('formatted');
    expect(decodeResult).toHaveProperty('raw');
    expect(decodeResult).toHaveProperty('remaining');
    expect(decodeResult.decoder).toHaveProperty('name');
    expect(decodeResult.decoder).toHaveProperty('type');
    expect(decodeResult.decoder).toHaveProperty('decodeLevel');
    expect(decodeResult.formatted).toHaveProperty('description');
    expect(decodeResult.formatted).toHaveProperty('items');
  });
});
