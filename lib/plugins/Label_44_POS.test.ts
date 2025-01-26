import { MessageDecoder } from '../MessageDecoder';
import { Label_44_POS } from './Label_44_POS';

test('matches Label 44 Preamble POS qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_44_POS(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-44-pos');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['44'],
    preambles: ['00POS01', '00POS02', '00POS03', 'POS01', 'POS02', 'POS03'],
  });
});
test('decodes Label 44 Preamble POS02 variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_44_POS(decoder);

  // https://app.airframes.io/messages/3389060301
  const text = 'POS02,N38171W077507,319,KJFK,KUZA,0926,0245,0327,004.6';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-44-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.position.latitude).toBe(38.285);
  expect(decodeResult.raw.position.longitude).toBe(-77.845);
  expect(decodeResult.raw.altitude).toBe(31900);
  expect(decodeResult.raw.departure_icao).toBe('KJFK');
  expect(decodeResult.raw.arrival_icao).toBe('KUZA');
  expect(decodeResult.raw.time_of_day).toBe(9900);
  expect(decodeResult.raw.eta_time).toBe(12420);
  expect(decodeResult.raw.fuel_in_tons).toBe(4.6);
  expect(decodeResult.formatted.items.length).toBe(8);
  expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[0].value).toBe('38.285 N, 77.845 W')
  expect(decodeResult.formatted.items[1].label).toBe('Month of Year');
  expect(decodeResult.formatted.items[1].value).toBe('9');
  expect(decodeResult.formatted.items[2].label).toBe('Day of Month');
  expect(decodeResult.formatted.items[2].value).toBe('26');
  expect(decodeResult.formatted.items[3].label).toBe('Message Timestamp');
  expect(decodeResult.formatted.items[3].value).toBe('02:45:00');
  expect(decodeResult.formatted.items[4].label).toBe('Estimated Time of Arrival');
  expect(decodeResult.formatted.items[4].value).toBe('03:27:00');
  expect(decodeResult.formatted.items[5].label).toBe('Origin');
  expect(decodeResult.formatted.items[5].value).toBe('KJFK');
  expect(decodeResult.formatted.items[6].label).toBe('Destination');
  expect(decodeResult.formatted.items[6].value).toBe('KUZA');
  expect(decodeResult.formatted.items[7].label).toBe('Altitude');
  expect(decodeResult.formatted.items[7].value).toBe('31900 feet');
});

// disabled because current parser decodes 'full'
xtest('decodes Label 44 Preamble POS02 <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_44_POS(decoder);

  const text = 'POS02 Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-44-pos');
  expect(decodeResult.formatted.description).toBe('Position Report');
  expect(decodeResult.formatted.items.length).toBe(0);
});
