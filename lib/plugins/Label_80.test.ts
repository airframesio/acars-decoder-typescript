import { MessageDecoder } from '../MessageDecoder';
import { Label_80 } from './Label_80';

test('matches Label 80 qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_80(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-80');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['80'],
    preambles: ['3N01 POSRPT'],
});
});

test('decodes Label 80 variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_80(decoder);

  // https://app.airframes.io/messages/377573108
  const text = '3N01 POSRPT 5891/04 KIAH/MMGL .XA-VOI\r\n/POS N29395W095133/ALT +15608/MCH 558/FOB 0100/ETA 0410';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('none'); //FIXME: full
  expect(decodeResult.decoder.name).toBe('label-80');
  expect(decodeResult.formatted.description).toBe('Airline Defined Position Report');
  expect(decodeResult.raw.position.latitude).toBe(29.395);
  expect(decodeResult.raw.position.longitude).toBe(-95.133);
  expect(decodeResult.raw.altitude).toBe('+15608');
  expect(decodeResult.formatted.items.length).toBe(8);
  expect(decodeResult.formatted.items[0].type).toBe('origin');
  expect(decodeResult.formatted.items[0].code).toBe('ORG');
  expect(decodeResult.formatted.items[0].label).toBe('Origin');
  expect(decodeResult.formatted.items[0].value).toBe('KIAH');
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].code).toBe('DST');
  expect(decodeResult.formatted.items[1].label).toBe('Destination');
  expect(decodeResult.formatted.items[1].value).toBe('MMGL');
  expect(decodeResult.formatted.items[2].type).toBe('tail');
  expect(decodeResult.formatted.items[2].label).toBe('Tail');
  expect(decodeResult.formatted.items[2].value).toBe('XA-VOI');
  expect(decodeResult.formatted.items[3].type).toBe('position');
  expect(decodeResult.formatted.items[3].code).toBe('POS');
  expect(decodeResult.formatted.items[3].label).toBe('Position');
  expect(decodeResult.formatted.items[3].value).toBe('29.395 N, 95.133 W');
  expect(decodeResult.formatted.items[4].type).toBe('altitude');
  expect(decodeResult.formatted.items[4].code).toBe('ALT');
  expect(decodeResult.formatted.items[4].label).toBe('Altitude');
  expect(decodeResult.formatted.items[4].value).toBe('+15608 feet');
  expect(decodeResult.formatted.items[5].type).toBe('mach');
  expect(decodeResult.formatted.items[5].code).toBe('MCH');
  expect(decodeResult.formatted.items[5].label).toBe('Aircraft Speed');
  expect(decodeResult.formatted.items[5].value).toBe('0.558 Mach');
  expect(decodeResult.formatted.items[6].type).toBe('fuel_on_board');
  expect(decodeResult.formatted.items[6].code).toBe('FOB');
  expect(decodeResult.formatted.items[6].label).toBe('Fuel on Board');
  expect(decodeResult.formatted.items[6].value).toBe('0100');
  expect(decodeResult.formatted.items[7].type).toBe('ETA');
  expect(decodeResult.formatted.items[7].code).toBe('ETA');
  expect(decodeResult.formatted.items[7].label).toBe('Estimated Time of Arrival');
  expect(decodeResult.formatted.items[7].value).toBe('0410'); // TODO: format as time
});
test('decodes Label 80 variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_80(decoder);

  // https://app.airframes.io/messages/2416917371
  const text = '3N01 POSRPT 0581/27 KIAD/MSLP .N962AV/04H 11:02\r\n/NWYP CIGAR /HDG 233/MCH 782\r\n/POS N3539.2W07937.2/FL 360/TAS 445/SAT -060\r\n/SWND 110/DWND 306/FOB N009414/ETA 14:26.0 ';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('none'); //FIXME: full
  expect(decodeResult.decoder.name).toBe('label-80');
  expect(decodeResult.formatted.description).toBe('Airline Defined Position Report');
  expect(decodeResult.raw.position.latitude).toBe(35.391999999999996); // FIXME?: 35.392
  expect(decodeResult.raw.position.longitude).toBe(-79.372);
  expect(decodeResult.formatted.items.length).toBe(16);
  expect(decodeResult.formatted.items[0].type).toBe('origin');
  expect(decodeResult.formatted.items[0].code).toBe('ORG');
  expect(decodeResult.formatted.items[0].label).toBe('Origin');
  expect(decodeResult.formatted.items[0].value).toBe('KIAD');
  expect(decodeResult.formatted.items[1].type).toBe('destination');
  expect(decodeResult.formatted.items[1].code).toBe('DST');
  expect(decodeResult.formatted.items[1].label).toBe('Destination');
  expect(decodeResult.formatted.items[1].value).toBe('MSLP');
  expect(decodeResult.formatted.items[2].type).toBe('tail');
  expect(decodeResult.formatted.items[2].label).toBe('Tail');
  expect(decodeResult.formatted.items[2].value).toBe('N962AV');
  expect(decodeResult.formatted.items[3].type).toBe('arrival_gate');
  expect(decodeResult.formatted.items[3].code).toBe('ARG');
  expect(decodeResult.formatted.items[3].label).toBe('Arrival Gate');
  expect(decodeResult.formatted.items[3].value).toBe('04H');
  expect(decodeResult.formatted.items[4].type).toBe('scheduled_time_of_arrival');
  expect(decodeResult.formatted.items[4].code).toBe('STA');
  expect(decodeResult.formatted.items[4].label).toBe('Scheduled Time of Arrival');
  expect(decodeResult.formatted.items[4].value).toBe('11:02');
  expect(decodeResult.formatted.items[5].type).toBe('next_waypoint');
  expect(decodeResult.formatted.items[5].code).toBe('NWYP');
  expect(decodeResult.formatted.items[5].label).toBe('Next Waypoint');
  expect(decodeResult.formatted.items[5].value).toBe('CIGAR');
  expect(decodeResult.formatted.items[6].type).toBe('heading');
  expect(decodeResult.formatted.items[6].code).toBe('HDG');
  expect(decodeResult.formatted.items[6].label).toBe('Heading');
  expect(decodeResult.formatted.items[6].value).toBe(233); // FIXME: string
  expect(decodeResult.formatted.items[7].type).toBe('mach');
  expect(decodeResult.formatted.items[7].code).toBe('MCH');
  expect(decodeResult.formatted.items[7].label).toBe('Aircraft Speed');
  expect(decodeResult.formatted.items[7].value).toBe('0.782 Mach');
  expect(decodeResult.formatted.items[8].type).toBe('position');
  expect(decodeResult.formatted.items[8].code).toBe('POS');
  expect(decodeResult.formatted.items[8].label).toBe('Position');
  expect(decodeResult.formatted.items[8].value).toBe('35.392 N, 79.372 W');
  expect(decodeResult.formatted.items[9].type).toBe('altitude');
  expect(decodeResult.formatted.items[9].code).toBe('ALT');
  expect(decodeResult.formatted.items[9].label).toBe('Altitude');
  expect(decodeResult.formatted.items[9].value).toBe('36000 feet');
  expect(decodeResult.formatted.items[10].type).toBe('TAS');
  expect(decodeResult.formatted.items[10].code).toBe('TAS');
  expect(decodeResult.formatted.items[10].label).toBe('True Airspeed');
  expect(decodeResult.formatted.items[10].value).toBe('445');
  expect(decodeResult.formatted.items[11].type).toBe('SAT');
  expect(decodeResult.formatted.items[11].code).toBe('SAT');
  expect(decodeResult.formatted.items[11].label).toBe('Static Air Temperature');
  expect(decodeResult.formatted.items[11].value).toBe('-060');
  expect(decodeResult.formatted.items[12].type).toBe('wind_speed');
  expect(decodeResult.formatted.items[12].code).toBe('SWND');
  expect(decodeResult.formatted.items[12].label).toBe('Wind Speed');
  expect(decodeResult.formatted.items[12].value).toBe(110); // FIXME: string
  expect(decodeResult.formatted.items[13].type).toBe('wind_direction');
  expect(decodeResult.formatted.items[13].code).toBe('DWND');
  expect(decodeResult.formatted.items[13].label).toBe('Wind Direction');
  expect(decodeResult.formatted.items[13].value).toBe(306); // FIXME: string
  expect(decodeResult.formatted.items[14].type).toBe('fuel_on_board');
  expect(decodeResult.formatted.items[14].code).toBe('FOB');
  expect(decodeResult.formatted.items[14].label).toBe('Fuel on Board');
  expect(decodeResult.formatted.items[14].value).toBe('N009414');
  expect(decodeResult.formatted.items[15].type).toBe('ETA');
  expect(decodeResult.formatted.items[15].code).toBe('ETA');
  expect(decodeResult.formatted.items[15].label).toBe('Estimated Time of Arrival');
  expect(decodeResult.formatted.items[15].value).toBe('14:26.0');
});

test('decodes Label 80 <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_80(decoder);

  const text = '3N01 POSRPT Bogus message';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-80');
  expect(decodeResult.formatted.description).toBe('Airline Defined Position Report');
  expect(decodeResult.formatted.items.length).toBe(0);
});
