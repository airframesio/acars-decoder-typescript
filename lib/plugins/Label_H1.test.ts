import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label_H1', () => {
  let plugin: Label_H1;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });

  test('matches Label H1 qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['1J', '2J', '2P', '4J', '80', 'H1'],
    });
  });

  test('decodes H1 POS message', () => {
    // https://app.airframes.io/messages/3352277498
    const message = {
      label: 'H1',
      text: 'POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40',
    };
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.name).toBe('label-h1');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.position).toBeDefined();
    expect(decodeResult.raw.position.latitude).toBeCloseTo(43.52, 1);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-123.29, 1);
  });

  test('decodes H1 FPN message', () => {
    const message = {
      label: 'H1',
      text: 'FPN/RI:DA:KEWR:AA:KDFW:CR:EWRDFW01(17L)..SAAME.J6.HVQ.Q68.LITTR..MEEOW..FEWWW:A:SEEVR4.FEWWW:F:VECTOR..DISCO..RIVET:AP:ILS 17L.RIVET:F:TACKEC8B5',
    };
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.name).toBe('label-h1');
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.raw.departure_icao).toBe('KEWR');
    expect(decodeResult.raw.arrival_icao).toBe('KDFW');
  });

  test('decodes H1 message with header prefix', () => {
    const message = {
      label: 'H1',
      text: '/HDQDLUA.POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40',
    };
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.name).toBe('label-h1');
    expect(decodeResult.formatted.description).toBe('Position Report');
  });

  test('returns none for invalid H1 message', () => {
    const message = {
      label: 'H1',
      text: 'COMPLETELY INVALID MESSAGE TEXT 1234',
    };
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-h1');
  });
});
