import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_80 } from './Label_80';

describe('Label 80', () => {
  let plugin: Label_80;
  const message = { label: '80', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_80(decoder);
  });
  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-80');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['80', '30', '31', '32', '33', '82', '8D'],
      preambles: [],
    });
  });

  test('decodes POSRPT variant 1', () => {
    // https://app.airframes.io/messages/377573108
    message.text =
      '3N01 POSRPT 5891/04 KIAH/MMGL .XA-VOI\r\n/POS N29395W095133/ALT +15608/MCH 558/FOB 0100/ETA 0410';
    const decodeResult = plugin.decode(message);

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
    message.text =
      '3N01 POSRPT 0581/27 KIAD/MSLP .N962AV/04H 11:02\r\n/NWYP CIGAR /HDG 233/MCH 782\r\n/POS N3539.2W07937.2/FL 360/TAS 445/SAT -060\r\n/SWND 110/DWND 306/FOB N009414/ETA 14:26.0 ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-80');
    expect(decodeResult.formatted.description).toBe(
      'Airline Defined Position Report',
    );
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
    expect(decodeResult.remaining.text).toBe(
      '3N01 POSRPT/04H 11:02////SWND 110/DWND 306',
    );
  });

  test('decodes POSRPT variant 3', () => {
    message.text =
      '/FB 0105/AD KCHS/N3950.1,W07548.3,3P01 POSRPT  0267/20 KBOS/KCHS .N3275J\n/UTC 143605/POS N3950.1 W07548.3/ALT 38007\n/SPD 334/FOB 0105/ETA 1622';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.flight_number).toBe('0267');
    expect(decodeResult.raw.day).toBe(20);
    expect(decodeResult.raw.fuel_on_board).toBe(105);
    expect(decodeResult.raw.arrival_icao).toBe('KCHS');
    expect(decodeResult.raw.departure_icao).toBe('KBOS');
    expect(decodeResult.raw.tail).toBe('N3275J');
    expect(decodeResult.raw.message_timestamp).toBe(52565);
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
    message.text =
      '3C01 POS N39328W077307  ,,143700,               ,      ,               ,P47,124,0069';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.position.latitude).toBe(39.328);
    expect(decodeResult.raw.position.longitude).toBe(-77.307);
    expect(decodeResult.raw.outside_air_temperature).toBe(47);
    expect(decodeResult.raw.message_timestamp).toBe(52620);
    expect(decodeResult.raw.airspeed).toBe(124);
    expect(decodeResult.raw.fuel_on_board).toBe(69);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.remaining.text).toBe(
      '3C01 POS,,      ,               ',
    );
  });

  test('decodes OPNORM variant 1', () => {
    message.text = '3M01 OPNORM 0411/20 KEWR/MMMX .XA-MAT ';
    const decodeResult = plugin.decode(message);

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
    message.text = '3701 INRANG 3451/20 KSBD/KBWI .N613AZ\n/ETA 1254/ERT      ';
    const decodeResult = plugin.decode(message);

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

  test('does not decode INR variant 1', () => {
    // decoded by another parser
    message.text =
      'INR/ID91511S,,/DC04032026,143534/MR19,/NR,,,,,,,,950,0/ET041505/FB983/VR32BF4C';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });

  test('does not decode invalid messages', () => {
    message.text = '3N01 POSRPT Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-80');
    expect(decodeResult.formatted.description).toBe(
      'Airline Defined Position Report',
    );
    expect(decodeResult.formatted.items.length).toBe(0);
  });
  describe('OOOI reports', () => {
    test('decodes OFFRP with OUT and OFF times', () => {
      // https://app.airframes.io/messages/8187680733
      const decodeResult = plugin.decode({
        label: '80',
        text: '1101 OFFRP  0001/21 KDCA/KSEA .N535AS\r\n/OUT 1258/OFF 1318/FOB 0391/ETA 1822/CAB 1254/OIL 1304/AFT     /CARGO 1255/SRVC     ',
      });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.formatted.description).toBe('Takeoff Report');
      expect(decodeResult.raw.departure_icao).toBe('KDCA');
      expect(decodeResult.raw.arrival_icao).toBe('KSEA');
      expect(decodeResult.raw.tail).toBe('N535AS');
      expect(decodeResult.raw.out_time).toBe(46680);
      expect(decodeResult.raw.off_time).toBe(47880);
      expect(decodeResult.raw.fuel_on_board).toBe(391);
      expect(decodeResult.raw.eta_time).toBe(66120);
    });

    test('decodes single-line OUTRP', () => {
      // https://app.airframes.io/messages/8187398021
      const decodeResult = plugin.decode({
        label: '80',
        text: '1001 OUTRP 1925/21 KBOS/MMGL .XA-VSX/OUT 1245/FOB  171',
      });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.formatted.description).toBe('Out of Gate Report');
      expect(decodeResult.raw.out_time).toBe(45900);
      expect(decodeResult.raw.fuel_on_board).toBe(171);
    });

    test('decodes SUMMRY with all four times', () => {
      // https://app.airframes.io/messages/8184569399
      const decodeResult = plugin.decode({
        label: '80',
        text: '3501 SUMMRY 3390/20 KPHX/KILN .N337AZ\r\n/OUT 1600/FOB 0541\r\n/OFF 1615/FOB ----\r\n/ON  1930/FOB ----\r\n/IN  1937/FOB 0224',
      });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.formatted.description).toBe('Flight Summary Report');
      expect(decodeResult.raw.out_time).toBe(57600);
      expect(decodeResult.raw.off_time).toBe(58500);
      expect(decodeResult.raw.on_time).toBe(70200);
      expect(decodeResult.raw.in_time).toBe(70620);
      expect(decodeResult.raw.fuel_on_board).toBe(224);
      const fuelItems = decodeResult.formatted.items.filter(
        (item) => item.code === 'FOB',
      );
      expect(fuelItems.map((item) => item.value)).toEqual(['224']);
    });

    test('decodes label 30 OUTRP with briefing prefix', () => {
      // https://app.airframes.io/messages/8193558431
      const decodeResult = plugin.decode({
        label: '30',
        text: '/FB 0123/AD KDTW/N4222.1,W07101.1,1001 OUTRP  1837/22 KBOS/KDTW .N3115J\r\n/OUT 0325/FOB 0123',
      });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.formatted.description).toBe('Out of Gate Report');
      expect(decodeResult.raw.flight_number).toBe('1837');
      expect(decodeResult.raw.departure_icao).toBe('KBOS');
      expect(decodeResult.raw.arrival_icao).toBe('KDTW');
      expect(decodeResult.raw.out_time).toBe(12300);
      // degrees and decimal minutes: 42°22.1' N, 71°01.1' W
      expect(decodeResult.raw.position?.latitude).toBe(42.3683);
      expect(decodeResult.raw.position?.longitude).toBe(-71.0183);
      expect(decodeResult.remaining.text).not.toContain('N4222');
    });

    test('decodes label 30 OUTRP through MessageDecoder', () => {
      const decodeResult = new MessageDecoder().decode({
        label: '30',
        text: '/FB 0123/AD KDTW/N4222.1,W07101.1,1001 OUTRP  1837/22 KBOS/KDTW .N3115J\r\n/OUT 0325/FOB 0123',
      });

      expect(decodeResult.decoder.name).toBe('label-80');
      expect(decodeResult.raw.out_time).toBe(12300);
    });

    test('decodes single-line label 30 OUTRP with briefing prefix', () => {
      const decodeResult = plugin.decode({
        label: '30',
        text: '/FB 0123/AD KDTW/N4222.1,W07101.1,1001 OUTRP 1837/22 KBOS/KDTW .N3115J/OUT 0325/FOB 0123',
      });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.raw.departure_icao).toBe('KBOS');
      expect(decodeResult.raw.out_time).toBe(12300);
      expect(decodeResult.raw.position?.latitude).toBe(42.3683);
    });

    test('decodes label 32 ONRP with seconds', () => {
      // https://app.airframes.io/messages/8193536291
      const decodeResult = plugin.decode({
        label: '32',
        text: ' /FB 0092/AD KBOS/N 42.331,W 71.042,1201 ONRP   0266/22 KRSW/KBOS .N956JT\r\n/ON  031924/FOB 0092',
      });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.formatted.description).toBe('Landing Report');
      expect(decodeResult.raw.on_time).toBe(11964);
      // decimal degrees
      expect(decodeResult.raw.position?.latitude).toBe(42.331);
      expect(decodeResult.raw.position?.longitude).toBe(-71.042);
    });

    test('decodes label 33 INRP', () => {
      const decodeResult = plugin.decode({
        label: '33',
        text: ' /FB 0080/AD KBOS/N 42.371,W 71.006,1301 INRP   2166/21 KRSW/KBOS .N558JB\r\n/ON  1547/IN  1552/FOB 0080',
      });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.formatted.description).toBe('In Gate Report');
      expect(decodeResult.raw.on_time).toBe(56820);
      expect(decodeResult.raw.in_time).toBe(57120);
    });

    test('decodes label 8D INRP', () => {
      const decodeResult = plugin.decode({
        label: '8D',
        text: '13H3 INRP   2513/21 EKCH/EGPH .OY-KBR\r\n/ON 1825/IN 1828',
      });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.raw.departure_icao).toBe('EKCH');
      expect(decodeResult.raw.arrival_icao).toBe('EGPH');
      expect(decodeResult.raw.on_time).toBe(66300);
      expect(decodeResult.raw.in_time).toBe(66480);
    });

    test('does not decode other formats on labels other than 80', () => {
      const decodeResult = plugin.decode({
        label: '31',
        text: '-P1326  10114360/05G--  729.88122 3993REY UMBALIN 8662149172115.525.114.2129.326.0 1',
      });

      expect(decodeResult.decoded).toBe(false);
      expect(decodeResult.decoder.decodeLevel).toBe('none');
    });

    test('ignores a blank OOOI time', () => {
      const decodeResult = plugin.decode({
        label: '80',
        text: '1101 OFFRP  0549/21 YPPH/WADD .PK-AZF\r\n/OUT 2241/OFF ----/FOB 0152/ETA     ',
      });

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.raw.out_time).toBe(81660);
      expect(decodeResult.raw.off_time).toBeUndefined();
    });

    test('ignores an out-of-range OOOI time', () => {
      const decodeResult = plugin.decode({
        label: '80',
        text: '1101 OFFRP  0549/21 YPPH/WADD .PK-AZF\r\n/OUT 2241/OFF 1260',
      });

      expect(decodeResult.raw.out_time).toBe(81660);
      expect(decodeResult.raw.off_time).toBeUndefined();
      expect(decodeResult.remaining.text).toContain('OFF 1260');
    });
  });
});
