import { MessageDecoder } from '../MessageDecoder';
import { Label_1M_Slash } from './Label_1M_Slash';

test('decodes Label 8E sample 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_1M_Slash(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-1m-slash');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['1M'],
    preambles: ['/'],
  });

  const text = '/BA0843/ETA01/230822/LDSP/EGLL/EGSS/2JK0\n1940/EGLL27L/10';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-1m-slash');
  expect(decodeResult.formatted.description).toBe('ETA Report');
  expect(decodeResult.message.text).toBe(text);
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
  expect(decodeResult.formatted.items[4].type).toBe('epoch');
  expect(decodeResult.formatted.items[4].code).toBe('ETA');
  expect(decodeResult.formatted.items[4].label).toBe('Estimated Time of Arrival');
  expect(decodeResult.formatted.items[4].value).toBe('2023-08-22T19:40:00Z');
});
