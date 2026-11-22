import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_1M_Slash } from './Label_1M_Slash';

describe('Label 1M Slash', () => {
  let plugin: Label_1M_Slash;
  const message = { label: '1M', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_1M_Slash(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-1m-slash');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['1M'],
      preambles: ['/'],
    });
  });

  test('decodes variant 1', () => {
    message.text = '/BA0843/ETA01/230822/LDSP/EGLL/EGSS/2JK0\n1940/EGLL27L/10';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-1m-slash');
    expect(decodeResult.formatted.description).toBe('ETA Report');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.alternate_icao).toBe('EGSS');
    expect(decodeResult.raw.arrival_icao).toBe('EGLL');
    expect(decodeResult.raw.arrival_runway).toBe('27L');
    expect(decodeResult.raw.departure_icao).toBe('LDSP');
    expect(decodeResult.raw.flight_number).toBe('BA0843');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].type).toBe('icao');
    expect(decodeResult.formatted.items[0].code).toBe('ORG');
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('LDSP');
    expect(decodeResult.formatted.items[1].type).toBe('icao');
    expect(decodeResult.formatted.items[1].code).toBe('DST');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('EGLL');
    expect(decodeResult.formatted.items[2].type).toBe('icao');
    expect(decodeResult.formatted.items[2].code).toBe('ALT_DST');
    expect(decodeResult.formatted.items[2].label).toBe('Alternate Destination');
    expect(decodeResult.formatted.items[2].value).toBe('EGSS');
    expect(decodeResult.formatted.items[3].type).toBe('runway');
    expect(decodeResult.formatted.items[3].code).toBe('ARWY');
    expect(decodeResult.formatted.items[3].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[3].value).toBe('27L');
    expect(decodeResult.formatted.items[4].type).toBe('time');
    expect(decodeResult.formatted.items[4].code).toBe('ETA');
    expect(decodeResult.formatted.items[4].label).toBe(
      'Estimated Time of Arrival',
    );
    // 230822 is 23 Aug 2022 (DDMMYY); the old YYMMDD rearrangement was wrong
    expect(decodeResult.formatted.items[4].value).toBe('2022-08-23T19:40:00Z');
  });
  test('reads the date as DDMMYY', () => {
    // Finnair, sent 2026-11-22 05:27 UTC
    message.text =
      '/AY0531/ETA01/221126/EFHK/EFRO/EFOU/2JK0\r\n0626/EFRO03/   ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.raw.arrival_icao).toBe('EFRO');
    expect(decodeResult.formatted.items[4].value).toBe('2026-11-22T06:26:00Z');
  });

  test('does not decode a short body', () => {
    message.text = '/AY0531/ETA01/221126/EFHK';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });
});
