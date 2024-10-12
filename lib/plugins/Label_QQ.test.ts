import { MessageDecoder } from '../MessageDecoder';
import { Label_QQ } from './Label_QQ';

test('matches Label QQ qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_QQ(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-qq');
});

test('decodes Label QQ variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_QQ(decoder);

  // https://app.airframes.io/messages/3409269161
  const text = 'KSDLKLAS0025\r\n001FE09002543N3336.6W11155.90281750042';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-qq');
  expect(decodeResult.formatted.description).toBe('OFF Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.departure_icao).toBe('KSDL');
  expect(decodeResult.raw.arrival_icao).toBe('KLAS');
  expect(decodeResult.raw.wheels_off).toBe('002543');
  expect(decodeResult.raw.day_of_month).toBe('09');
  expect(decodeResult.raw.position.latitude).toBe(33.61);
  expect(decodeResult.raw.position.longitude).toBe(-111.93166666666667);
  expect(decodeResult.raw.groundspeed).toBe('175');
  expect(decodeResult.remaining.text).toBe('028,0042');
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].type).toBe('origin');
  expect(decodeResult.formatted.items[0].code).toBe('ORG');
  expect(decodeResult.formatted.items[0].label).toBe('Origin');
  expect(decodeResult.formatted.items[0].value).toBe('KSDL');
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].code).toBe('DST');
  expect(decodeResult.formatted.items[1].label).toBe('Destination');
  expect(decodeResult.formatted.items[1].value).toBe('KLAS');
  expect(decodeResult.formatted.items[2].type).toBe('aircraft_groundspeed');
  expect(decodeResult.formatted.items[2].code).toBe('GSPD');
  expect(decodeResult.formatted.items[2].label).toBe('Aircraft Groundspeed');
  expect(decodeResult.formatted.items[2].value).toBe('175 knots');
  expect(decodeResult.formatted.items[3].type).toBe('wheels_off');
  expect(decodeResult.formatted.items[3].code).toBe('WOFF');
  expect(decodeResult.formatted.items[3].label).toBe('Wheels OFF');
  expect(decodeResult.formatted.items[3].value).toBe('002543');
  expect(decodeResult.formatted.items[4].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[4].code).toBe('POS');
  expect(decodeResult.formatted.items[4].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[4].value).toBe('33.610 N, 111.932 W');
});

test('decodes Label QQ variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_QQ(decoder);

  // https://app.airframes.io/messages/3406443370
  const text = 'KLGBKLAX0004\r\n001FE07000444N3349.8W11810.1---0200009';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-qq');
  expect(decodeResult.formatted.description).toBe('OFF Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.departure_icao).toBe('KLGB');
  expect(decodeResult.raw.arrival_icao).toBe('KLAX');
  expect(decodeResult.raw.wheels_off).toBe('000444');
  expect(decodeResult.raw.day_of_month).toBe('07');
  expect(decodeResult.raw.position.latitude).toBe(33.83);
  expect(decodeResult.raw.position.longitude).toBe(-118.16833333333334);
  expect(decodeResult.remaining.text).toBe('---,020,0009');
  expect(decodeResult.formatted.items.length).toBe(4);
  expect(decodeResult.formatted.items[0].type).toBe('origin');
  expect(decodeResult.formatted.items[0].code).toBe('ORG');
  expect(decodeResult.formatted.items[0].label).toBe('Origin');
  expect(decodeResult.formatted.items[0].value).toBe('KLGB');
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].code).toBe('DST');
  expect(decodeResult.formatted.items[1].label).toBe('Destination');
  expect(decodeResult.formatted.items[1].value).toBe('KLAX');
  expect(decodeResult.formatted.items[2].type).toBe('wheels_off');
  expect(decodeResult.formatted.items[2].code).toBe('WOFF');
  expect(decodeResult.formatted.items[2].label).toBe('Wheels OFF');
  expect(decodeResult.formatted.items[2].value).toBe('000444');
  expect(decodeResult.formatted.items[3].type).toBe('aircraft_position');
  expect(decodeResult.formatted.items[3].code).toBe('POS');
  expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
  expect(decodeResult.formatted.items[3].value).toBe('33.830 N, 118.168 W');
});

test('decodes Label QQ variant 3', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_QQ(decoder);

  // https://app.airframes.io/messages/3409293914
  const text = 'CYOWKMEM0058/OFFRPT/090155';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-qq');
  expect(decodeResult.formatted.description).toBe('OFF Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.departure_icao).toBe('CYOW');
  expect(decodeResult.raw.arrival_icao).toBe('KMEM');
  expect(decodeResult.raw.wheels_off).toBe('0058');
  expect(decodeResult.remaining.text).toBe('/OFFRPT/090155');
  expect(decodeResult.formatted.items.length).toBe(3);
  expect(decodeResult.formatted.items[0].type).toBe('origin');
  expect(decodeResult.formatted.items[0].code).toBe('ORG');
  expect(decodeResult.formatted.items[0].label).toBe('Origin');
  expect(decodeResult.formatted.items[0].value).toBe('CYOW');
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].code).toBe('DST');
  expect(decodeResult.formatted.items[1].label).toBe('Destination');
  expect(decodeResult.formatted.items[1].value).toBe('KMEM');
  expect(decodeResult.formatted.items[2].type).toBe('wheels_off');
  expect(decodeResult.formatted.items[2].code).toBe('WOFF');
  expect(decodeResult.formatted.items[2].label).toBe('Wheels OFF');
  expect(decodeResult.formatted.items[2].value).toBe('0058');
});

// disabled because all messages should decode
xtest('decodes Label QQ <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_QQ(decoder);

  const text = 'QQ Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-qq');
  expect(decodeResult.formatted.description).toBe('OFF Report');
  expect(decodeResult.formatted.items.length).toBe(0);
});
