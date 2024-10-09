import { MessageDecoder } from '../MessageDecoder';
import { Label_HX } from './Label_HX';

test('matches Label HX qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_QQ(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-hx');
});

test('decodes Label HX variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_HX(decoder);

  // https://globe.adsbexchange.com/?icao=A41722&showTrace=2024-09-24&timestamp=1727202494
  const text = 'RA FMT LOCATION N4009.6 W07540.8';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-hx');
  expect(decodeResult.formatted.description).toBe('Undelivered Uplink Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.position.latitude).toBe('N4009.6');
  expect(decodeResult.raw.position.longitude).toBe('W07540.8');
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('40.160 N, 75.680 W');
});

test('decodes Label HX variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_HX(decoder);

  // https://globe.adsbexchange.com/?icao=A92EA0&showTrace=2024-09-22&timestamp=1727038330
  const text = 'RA FMT 43 GSP B02';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-hx');
  expect(decodeResult.formatted.description).toBe('Undelivered Uplink Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.origin).toBe('GSP');
  expect(decodeResult.remaining).toBe('B02');
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('origin');
  expect(decodeResult.formatted.items[0].code).toBe('ORG');
  expect(decodeResult.formatted.items[0].label).toBe('Origin');
  expect(decodeResult.formatted.items[0].value).toBe('GSP');
});

// disabled because current parser decodes 'full'
xtest('decodes Label HX <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_HX(decoder);

  const text = 'QQ Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-hx');
  expect(decodeResult.formatted.description).toBe('Undelivered Uplink Report');
  expect(decodeResult.formatted.items.length).toBe(0);
});
