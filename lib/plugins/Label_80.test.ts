import { MessageDecoder } from '../MessageDecoder';
import { Label_80 } from './Label_80';

describe('Label 80', () => {

  let plugin : Label_80;

    beforeEach(() => {
      const decoder = new MessageDecoder();
      plugin = new Label_80(decoder);
    });
test('matches qualifiers', () => {
  expect(plugin.decode).toBeDefined();
  expect(plugin.name).toBe('label-80');
  expect(plugin.qualifiers).toBeDefined();
  expect(plugin.qualifiers()).toEqual({
    labels: ['80'],
    preambles: [],
});
});

test('decodes POSRPT variant 1', () => {
  // https://app.airframes.io/messages/377573108
  const text = '3N01 POSRPT 5891/04 KIAH/MMGL .XA-VOI\r\n/POS N29395W095133/ALT +15608/MCH 558/FOB 0100/ETA 0410';
  const decodeResult = plugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.raw.flight_number).toBe('5891');
  expect(decodeResult.raw.day).toBe(4);
  expect(decodeResult.raw.position.latitude).toBe(29.395);
  expect(decodeResult.raw.position.longitude).toBe(-95.133);
  expect(decodeResult.raw.altitude).toBe(15608);
  expect(decodeResult.raw.tail).toBe('XA-VOI');
  expect(decodeResult.raw.departure_icao).toBe('KIAH');
  expect(decodeResult.raw.arrival_icao).toBe('MMGL');
  expect(decodeResult.raw.mach).toBe(0.558);
  expect(decodeResult.raw.fuel_on_board).toBe(100);
  //expect(decodeResult.raw.eta_time).toBe('15000');
  expect(decodeResult.formatted.items.length).toBe(10);
  expect(decodeResult.remaining.text).toBe('3N01 POSRPT/');
});
test('decodes POSRPT variant 2', () => {
  // https://app.airframes.io/messages/2416917371
  const text = '3N01 POSRPT 0581/27 KIAD/MSLP .N962AV/04H 11:02\r\n/NWYP CIGAR /HDG 233/MCH 782\r\n/POS N3539.2W07937.2/FL 360/TAS 445/SAT -060\r\n/SWND 110/DWND 306/FOB N009414/ETA 14:26.0 ';
  const decodeResult = plugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-80');
  expect(decodeResult.formatted.description).toBe('Airline Defined Position Report');
  expect(decodeResult.raw.position.latitude).toBe(35.391999999999996); // FIXME?: 35.392
  expect(decodeResult.raw.position.longitude).toBe(-79.372);
  expect(decodeResult.raw.departure_icao).toBe('KIAD');
  expect(decodeResult.raw.arrival_icao).toBe('MSLP');
  expect(decodeResult.raw.tail).toBe('N962AV');
  expect(decodeResult.raw.next_waypoint).toBe('CIGAR');
  expect(decodeResult.raw.heading).toBe(233);
  expect(decodeResult.raw.mach).toBe(0.782);
  expect(decodeResult.raw.altitude).toBe(36000);
  expect(decodeResult.raw.airspeed).toBe(445);
  expect(decodeResult.raw.outside_air_temperature).toBe(-60);
  //expect(decodeResult.raw.wind_data[0].windSpeed).toBe(110);
  //expect(decodeResult.raw.wind_data[0].windDirection).toBe(306);
  expect(decodeResult.raw.fuel_on_board).toBe(9414);
  expect(decodeResult.raw.eta_time).toBe(51960);
  expect(decodeResult.formatted.items.length).toBe(13);
  expect(decodeResult.remaining.text).toBe('3N01 POSRPT/04H 11:02////SWND 110/DWND 306');

});

test('decodes POSRPT variant 3', () => {
  const text = '/FB 0105/AD KCHS/N3950.1,W07548.3,3P01 POSRPT  0267/20 KBOS/KCHS .N3275J\n/UTC 143605/POS N3950.1 W07548.3/ALT 38007\n/SPD 334/FOB 0105/ETA 1622';
  const decodeResult = plugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.raw.flight_number).toBe('0267');
  expect(decodeResult.raw.day).toBe(20);
  expect(decodeResult.raw.fuel_on_board).toBe(105);
  expect(decodeResult.raw.arrival_icao).toBe('KCHS');
  expect(decodeResult.raw.departure_icao).toBe('KBOS');
  expect(decodeResult.raw.tail).toBe('N3275J');
  expect(decodeResult.raw.time_of_day).toBe(52565);
  expect(decodeResult.raw.position.latitude).toBe(39.501);
  expect(decodeResult.raw.position.longitude).toBe(-75.483);
  expect(decodeResult.raw.altitude).toBe(38007);
  expect(decodeResult.raw.groundspeed).toBe(334);
  expect(decodeResult.raw.fuel_on_board).toBe(105);
  expect(decodeResult.raw.eta_time).toBe(58920);
  expect(decodeResult.formatted.items.length).toBe(11);
  expect(decodeResult.remaining.text).toBe('N3950.1/W07548.3 3P01 POSRPT//');
});

test('decodes POS variant 1', () => {
  const text = '3C01 POS N39328W077307  ,,143700,               ,      ,               ,P47,124,0069';
  const decodeResult = plugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.raw.position.latitude).toBe(39.328);
  expect(decodeResult.raw.position.longitude).toBe(-77.307);
  expect(decodeResult.raw.outside_air_temperature).toBe(47);
  expect(decodeResult.raw.time_of_day).toBe(52620);
  expect(decodeResult.raw.airspeed).toBe(124);
  expect(decodeResult.raw.fuel_on_board).toBe(69);
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.remaining.text).toBe('3C01 POS,,      ,               ');
});

test('decodes OPNORM variant 1', () => {
  const text = '3M01 OPNORM 0411/20 KEWR/MMMX .XA-MAT ';
  const decodeResult = plugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.raw.flight_number).toBe('0411');
  expect(decodeResult.raw.day).toBe(20);
  expect(decodeResult.raw.departure_icao).toBe('KEWR');
  expect(decodeResult.raw.arrival_icao).toBe('MMMX');
  expect(decodeResult.raw.tail).toBe('XA-MAT');
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.remaining.text).toBe('3M01 OPNORM');
});


test('decodes INRANG variant 1', () => {
  const text = '3701 INRANG 3451/20 KSBD/KBWI .N613AZ\n/ETA 1254/ERT      ';
  const decodeResult = plugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.raw.flight_number).toBe('3451');
  expect(decodeResult.raw.day).toBe(20);
  expect(decodeResult.raw.departure_icao).toBe('KSBD');
  expect(decodeResult.raw.arrival_icao).toBe('KBWI');
  expect(decodeResult.raw.tail).toBe('N613AZ');
  expect(decodeResult.raw.eta_time).toBe(46440);
  expect(decodeResult.formatted.items.length).toBe(6);
  expect(decodeResult.remaining.text).toBe('3701 INRANG//ERT');
});


test('does not decode invalid messages', () => {
  const text = '3N01 POSRPT Bogus message';
  const decodeResult = plugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-80');
  expect(decodeResult.formatted.description).toBe('Airline Defined Position Report');
  expect(decodeResult.formatted.items.length).toBe(0);
});
});
