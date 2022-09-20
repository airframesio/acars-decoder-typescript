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
  console.log(JSON.stringify(decodeResult, null, 2));

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
  expect(decodeResult.formatted.items.length).toBe(3);
  expect(decodeResult.formatted.items[0].type).toBe('eta');
  expect(decodeResult.formatted.items[0].code).toBe('ETA');
  expect(decodeResult.formatted.items[0].label).toBe('Estimated Time of Arrival');
  // Check for the minutes as typescript doesn't have a UTC time string method
  // so the hour will depend on the test host timezone.
  expect((decodeResult.formatted.items[0].value as string).includes('40')).toBe(true);
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].code).toBe('DST');
  expect(decodeResult.formatted.items[1].label).toBe('Destination');
  expect(decodeResult.formatted.items[1].value).toBe('EGLL');
  expect(decodeResult.formatted.items[2].type).toBe('origin');
  expect(decodeResult.formatted.items[2].code).toBe('ORG');
  expect(decodeResult.formatted.items[2].label).toBe('Origin');
  expect(decodeResult.formatted.items[2].value).toBe('LDSP');
});
