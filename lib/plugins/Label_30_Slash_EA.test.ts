import { MessageDecoder } from '../MessageDecoder';
import { Label_30_Slash_EA } from './Label_30_Slash_EA';

test('decodes Label 30 sample 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_30_Slash_EA(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-30-slash-ea');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['30'],
    preambles: ['/EA'],
  });

  const text = '/EA1719/DSKSFO/SK23';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-30-slash-ea');
  expect(decodeResult.formatted.description).toBe('ETA Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.arrival_icao).toBe('KSFO');
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].type).toBe('eta');
  expect(decodeResult.formatted.items[0].code).toBe('ETA');
  expect(decodeResult.formatted.items[0].label).toBe('Estimated Time of Arrival');
  // This test is a bit rough as typescript doesn't have a UTC time string
  // method so the hour will be depend on the test host timezone.
  expect((decodeResult.formatted.items[0].value as string).includes('19')).toBe(true);
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].code).toBe('DST');
  expect(decodeResult.formatted.items[1].label).toBe('Destination');
  expect(decodeResult.formatted.items[1].value).toBe('KSFO');
});
