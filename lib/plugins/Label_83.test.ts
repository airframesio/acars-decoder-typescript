import { MessageDecoder } from '../MessageDecoder';
import { Label_83 } from './Label_83';

test('matches Label 83 qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_83(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-83');
});

test('decodes Label 83 variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_83(decoder);

  // https://globe.adsbexchange.com/?icao=A2A3B5&showTrace=2024-09-22&timestamp=1726967032
  const text = 'KLAX,KEWR,220103, 40.53,- 74.47, 3836,212, 140.0, 19700';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-83');
  expect(decodeResult.formatted.description).toBe('Airline Defined');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.departure_icao).toBe('KLAX');
  expect(decodeResult.raw.arrival_icao).toBe('KEWR');
  expect(decodeResult.raw.day_of_month).toBe('22');
  expect(decodeResult.raw.position.latitude).toBe(40.53);
  expect(decodeResult.raw.position.longitude).toBe(-74.47);
  expect(decodeResult.raw.altitude).toBe('3836');
  expect(decodeResult.raw.groundspeed).toBe('212');
  expect(decodeResult.raw.heading).toBe('140.0');
  expect(decodeResult.remaining.text).toBe('19700');
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].type).toBe('origin');
  expect(decodeResult.formatted.items[0].value).toBe('KLAX');
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].value).toBe('KEWR');
  expect(decodeResult.formatted.items[2].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[2].value).toBe('40.530 N, 74.470 W');
  expect(decodeResult.formatted.items[3].type).toBe('altitude');
  expect(decodeResult.formatted.items[3].value).toBe('3836 feet');
  expect(decodeResult.formatted.items[4].type).toBe('aircraft_groundspeed');
  expect(decodeResult.formatted.items[4].value).toBe('212 knots');
  expect(decodeResult.formatted.items[5].type).toBe('heading');
  expect(decodeResult.formatted.items[5].value).toBe('140.0');
});

test('decodes Label 83 variant 1 (C-band)', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_83(decoder);

  // https://app.airframes.io/messages/3413113024
  const text = 'M05AUA0007KIAH,RJAA,110012, 39.12,-175.10,39001,265,-107.6, 64900';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-83');
  expect(decodeResult.formatted.description).toBe('Airline Defined');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.flight_number).toBe('UA7');
  expect(decodeResult.raw.departure_icao).toBe('KIAH');
  expect(decodeResult.raw.arrival_icao).toBe('RJAA');
  expect(decodeResult.raw.day_of_month).toBe('11');
  expect(decodeResult.raw.position.latitude).toBe(39.12);
  expect(decodeResult.raw.position.longitude).toBe(-175.1);
  expect(decodeResult.raw.altitude).toBe('39001');
  expect(decodeResult.raw.groundspeed).toBe('265');
  expect(decodeResult.raw.heading).toBe('-107.6');
  expect(decodeResult.remaining.text).toBe('64900');
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.formatted.items[0].type).toBe('origin');
  expect(decodeResult.formatted.items[0].value).toBe('KIAH');
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].value).toBe('RJAA');
  expect(decodeResult.formatted.items[2].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[2].value).toBe('39.120 N, 175.100 W');
  expect(decodeResult.formatted.items[3].type).toBe('altitude');
  expect(decodeResult.formatted.items[3].value).toBe('39001 feet');
  expect(decodeResult.formatted.items[4].type).toBe('aircraft_groundspeed');
  expect(decodeResult.formatted.items[4].value).toBe('265 knots');
  expect(decodeResult.formatted.items[5].type).toBe('heading');
  expect(decodeResult.formatted.items[5].value).toBe('-107.6');
});

test('decodes Label 83 variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_83(decoder);

  // https://globe.adsbexchange.com/?icao=478F43&showTrace=2024-09-22&timestamp=1727022863
  const text = '4DH3 ETAT2  0907/22 ENGM/KEWR .LN-RKO\r\n/ETA 1641';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-83');
  expect(decodeResult.formatted.description).toBe('Airline Defined');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.departure_icao).toBe('ENGM');
  expect(decodeResult.raw.arrival_icao).toBe('KEWR');
  expect(decodeResult.raw.day_of_month).toBe('22');
  expect(decodeResult.raw.tail).toBe('LN-RKO');
  expect(decodeResult.raw.eta_time).toBe('164100');
  expect(decodeResult.remaining.text).toBe('0907');
  expect(decodeResult.formatted.items.length).toBe(4);
  expect(decodeResult.formatted.items[0].type).toBe('origin');
  expect(decodeResult.formatted.items[0].value).toBe('ENGM');
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].value).toBe('KEWR');
  expect(decodeResult.formatted.items[2].type).toBe('tail');
  expect(decodeResult.formatted.items[2].value).toBe('LN-RKO');
  expect(decodeResult.formatted.items[3].type).toBe('eta');
  expect(decodeResult.formatted.items[3].value).toBe('16:41:00');
});

test('decodes Label 83 variant 3', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_83(decoder);

  // https://globe.adsbexchange.com/?icao=AC15A1&showTrace=2024-09-22&timestamp=1726977342
  const text = '001PR22035539N4038.6W07427.80292500008';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-83');
  expect(decodeResult.formatted.description).toBe('Airline Defined');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.day_of_month).toBe('22');
  expect(decodeResult.raw.position.latitude).toBe(40.64333333333333);
  expect(decodeResult.raw.position.longitude).toBe(-74.46333333333334);
  expect(decodeResult.raw.altitude).toBe(2925);
  expect(decodeResult.remaining.text).toBe('00008');
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].value).toBe('40.643 N, 74.463 W');
  expect(decodeResult.formatted.items[1].type).toBe('altitude');
  expect(decodeResult.formatted.items[1].value).toBe('2925 feet');
});

test('decodes Label 83 variant 3 (C-band)', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_83(decoder);

  // https://app.airframes.io/messages/3413346742
  const text = 'M09AXA0001001PR11013423N0556.6E11603.0000000----';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-83');
  expect(decodeResult.formatted.description).toBe('Airline Defined');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.flight_number).toBe('XA1');
  expect(decodeResult.raw.day_of_month).toBe('11');
  expect(decodeResult.raw.position.latitude).toBe(5.943333333333333);
  expect(decodeResult.raw.position.longitude).toBe(116.05);
  expect(decodeResult.raw.altitude).toBe(0);
  expect(decodeResult.remaining.text).toBe('0----');
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[0].value).toBe('5.943 N, 116.050 E');
  expect(decodeResult.formatted.items[1].type).toBe('altitude');
  expect(decodeResult.formatted.items[1].value).toBe('0 feet');
});

test('decodes Label 83 <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_83(decoder);

  const text = '83 Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-83');
  expect(decodeResult.formatted.description).toBe('Airline Defined');
  expect(decodeResult.formatted.items.length).toBe(0);
});
