import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_33 } from './Label_33';

describe('Label 33 ', () => {
  let plugin: Label_33;
  const message = { label: '33', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_33(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-33');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['33'],
      preambles: [''],
    });
  });
  test('decodes variant 96', () => {
    message.text =
      '96,E,38.868,-77.556, 4750,*****,KIAD,KGSO,23L,23R,9,0,0,,,,,40.0,0,0,0,,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.position?.latitude).toBe(38.868);
    expect(decodeResult.raw.position?.longitude).toBe(-77.556);
    expect(decodeResult.raw.altitude).toBe(4750);
    expect(decodeResult.raw.departure_icao).toBe('KIAD');
    expect(decodeResult.raw.arrival_icao).toBe('KGSO');
    expect(decodeResult.raw.arrival_runway).toBe('23L');
    expect(decodeResult.raw.alternate_runway).toBe('23R');
    expect(decodeResult.remaining.text).toBe('E,*****,9,0,0,,,,,40.0,0,0,0,,');
  });
  test('decodes variant 182', () => {
    message.text =
      '182,HG,KEWR,KCVG,KCVG,36R/,36C/,,,,,0,0,0,0,0,0, .   ,59066,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('KEWR');
    expect(decodeResult.raw.arrival_icao).toBe('KCVG');
    expect(decodeResult.raw.arrival_runway).toBe('36R');
    expect(decodeResult.raw.alternate_runway).toBe('36C');
  });
  test('decodes variant 4', () => {
    message.text = '4,G,14,DCA,RDU,5L,,,,,,0,0,0,0,62.8,0,CBF9';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_iata).toBe('DCA');
    expect(decodeResult.raw.arrival_iata).toBe('RDU');
    expect(decodeResult.raw.arrival_runway).toBe('5L');
  });
  test('decodes variant 33', () => {
    message.text = '33,I,BNA,DCA,1,,,,,,0,0,,,0,0,0,,64.3,5F86';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_iata).toBe('BNA');
    expect(decodeResult.raw.arrival_iata).toBe('DCA');
    expect(decodeResult.raw.arrival_runway).toBe('1');
  });
  test('decodes variant P', () => {
    message.text =
      'P,E,2026-11-14 21:57:01,  22262199,14NOV,5618,KORD,KDCA,5150,KDCA,72481,5000,1,6,33,6,5,0,0,0,0,,,,,,0,1,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.message_timestamp).toBe(1794711421);
    expect(decodeResult.raw.departure_icao).toBe('KORD');
    expect(decodeResult.raw.arrival_icao).toBe('KDCA');
  });
  test('decodes variant LDR01', () => {
    message.text =
      'LDR01,6,J,14,KPHL,KCLT,36/,1R/,,,,,0,07,,07,,5,0,0,0,0,,,,,139.9,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('KPHL');
    expect(decodeResult.raw.arrival_icao).toBe('KCLT');
    expect(decodeResult.raw.arrival_runway).toBe('36');
    expect(decodeResult.raw.alternate_runway).toBe('1R');
  });
});
