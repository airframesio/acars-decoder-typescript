import { MessageDecoder } from '../MessageDecoder';
import { Label_1L_070 } from './Label_1L_070';

describe('Label_1L 070', () => {
  let plugin: Label_1L_070;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_1L_070(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-1l-070');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['1L'],
      preambles: ['000000070'],
    });
  });

  test('decodes variant 1', () => {
    // https://app.airframes.io/messages/3492019143
    const text = '000000070LOWW,KEWR,0932,1744,N 49.223,E 12.038,0659'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('LOWW');
    expect(decodeResult.raw.arrival_icao).toBe('KEWR');
    expect(decodeResult.raw.time_of_day).toBe(34320);
    expect(decodeResult.raw.eta_time).toBe(63840);
    expect(decodeResult.raw.position.latitude).toBe(49.223);
    expect(decodeResult.raw.position.longitude).toBe(12.038);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('LOWW');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('KEWR');
    expect(decodeResult.formatted.items[2].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[2].value).toBe('09:32:00');
    expect(decodeResult.formatted.items[3].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[3].value).toBe('17:44:00');
    expect(decodeResult.formatted.items[4].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[4].value).toBe('49.223 N, 12.038 E');
    expect(decodeResult.remaining.text).toBe('0659');
  });

  test('does not decode <invalid>', () => {

    const text = 'POS Bogus Message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-1l-070');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message.text).toBe(text);
  });
});