import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_11Through14_CSV_OOOI } from './Label_11Through14_CSV_OOOI';

describe('Labels 11-14 CSV OOOI reports (Cathay Pacific)', () => {
  let plugin: Label_11Through14_CSV_OOOI;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_11Through14_CSV_OOOI(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-11-14-csv-oooi');
    expect(plugin.qualifiers()).toEqual({
      labels: ['11', '12', '13', '14', '16'],
      preambles: ['OUT,V', 'OFF,V', 'ONE,V', 'CAR,V'],
    });
  });

  test('decodes label 11 OUT report', () => {
    const result = plugin.decode({
      label: '11',
      text: 'OUT,V02,CX 837 20261121 1,CYVR,VHHH,2044,2036,----, 1179',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Out of Gate Report');
    expect(result.raw.flight_number).toBe('CX837');
    expect(result.raw.departure_day).toBe(21);
    expect(result.raw.departure_icao).toBe('CYVR');
    expect(result.raw.arrival_icao).toBe('VHHH');
    expect(result.raw.out_time).toBe(20 * 3600 + 44 * 60);
    expect(result.remaining.text).toBe('V02,1,2036,----, 1179');
  });

  test('decodes label 13 ON report', () => {
    const result = plugin.decode({
      label: '13',
      text: 'ONE,V02,CX 105 20261122 1,VHHH,YMML,0124,   96',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Landing Report');
    expect(result.raw.flight_number).toBe('CX105');
    expect(result.raw.arrival_icao).toBe('YMML');
    expect(result.raw.on_time).toBe(1 * 3600 + 24 * 60);
  });

  test('decodes OFF reports with the OUT time they repeat', () => {
    const v02 = plugin.decode({
      label: '12',
      text: 'OFF,V02,CX 837 20261121 1,CYVR,VHHH,2044,2104,1004, 1175',
    });
    expect(v02.decoded).toBe(true);
    expect(v02.formatted.description).toBe('Takeoff Report');
    expect(v02.raw.flight_number).toBe('CX837');
    expect(v02.raw.departure_icao).toBe('CYVR');
    expect(v02.raw.arrival_icao).toBe('VHHH');
    expect(v02.raw.out_time).toBe(20 * 3600 + 44 * 60);
    expect(v02.raw.off_time).toBe(21 * 3600 + 4 * 60);
    expect(v02.raw.eta_time).toBe(10 * 3600 + 4 * 60);
    expect(v02.remaining.text).toBe('V02,1, 1175');

    // V03 has 'CX' where the ETA is; V01 can run the number into the date.
    const v03 = plugin.decode({
      label: '12',
      text: 'OFF,V03,CX 83  20261121 2,KLAX,VHHH,0437,0500,CX,1711',
    });
    expect(v03.decoded).toBe(true);
    expect(v03.raw.flight_number).toBe('CX83');
    expect(v03.raw.out_time).toBe(4 * 3600 + 37 * 60);
    expect(v03.raw.off_time).toBe(5 * 3600);
    expect(v03.raw.eta_time).toBeUndefined();

    const v01 = plugin.decode({
      label: '12',
      text: 'OFF,V01,CX 314220261121 1,VIDP,VHHH,1008,1029,,  473',
    });
    expect(v01.decoded).toBe(true);
    expect(v01.raw.flight_number).toBe('CX3142');
    expect(v01.raw.departure_day).toBe(21);
    expect(v01.raw.off_time).toBe(10 * 3600 + 29 * 60);

    const decoded = new MessageDecoder().decode({
      label: '12',
      text: 'OFF,V02,CX 837 20261121 1,CYVR,VHHH,2044,2104,1004, 1175',
    });
    expect(decoded.decoder.name).toBe('label-11-14-csv-oooi');
    expect(decoded.raw.off_time).toBe(21 * 3600 + 4 * 60);
  });

  test('decodes the CAR end of flight summary', () => {
    const result = new MessageDecoder().decode({
      label: '16',
      text: 'CAR,V03,CX 181 20261122 1,CX0181,22NOV26,VHHH,YSSY,01,Y\r\n1655,1721,0151,0157,1655,0829,---,--------,--------, ',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-11-14-csv-oooi');
    expect(result.formatted.description).toBe('Flight Summary Report');
    expect(result.raw.flight_number).toBe('CX181');
    expect(result.raw.departure_icao).toBe('VHHH');
    expect(result.raw.arrival_icao).toBe('YSSY');
    expect(result.raw.out_time).toBe(16 * 3600 + 55 * 60);
    expect(result.raw.off_time).toBe(17 * 3600 + 21 * 60);
    expect(result.raw.on_time).toBe(1 * 3600 + 51 * 60);
    expect(result.raw.in_time).toBe(1 * 3600 + 57 * 60);
    expect(result.remaining.text).toBe(
      'V03,1,01,Y,1655,0829,---,--------,--------,',
    );
  });

  test('keeps CAR fields it cannot read', () => {
    const result = plugin.decode({
      label: '16',
      text: 'CAR,V03,CX 181 20261122 1,CX0180,21NOV26,VHHH,YSSY,01,Y\r\n1655,2560,0151,----,1655, ',
    });
    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.raw.out_time).toBe(16 * 3600 + 55 * 60);
    expect(result.raw.off_time).toBeUndefined();
    expect(result.raw.in_time).toBeUndefined();
    expect(result.remaining.text).toBe('V03,1,21NOV26,CX0180,01,Y,2560,1655,');
  });

  test('does not decode an INC report', () => {
    const result = plugin.decode({
      label: '10',
      text: 'INC,V02,21NOV26,155615,-------,CX0140,YPPH,VHHH,00672',
    });

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
  });

  test('does not decode other event codes in the OUT layout', () => {
    for (const text of [
      'INC,V02,CX 140 20261122 1,YPPH,VHHH,1556',
      'ONA,V02,CX 105 20261122 1,VHHH,YMML,0124',
    ]) {
      const result = new MessageDecoder().decode({ label: '13', text });
      expect(result.decoder.name).not.toBe('label-11-14-csv-oooi');
      expect(result.raw.in_time).toBeUndefined();
      expect(result.raw.on_time).toBeUndefined();
    }
  });

  test('is used by the decoder', () => {
    const result = new MessageDecoder().decode({
      label: '13',
      text: 'ONE,V02,CX 105 20261122 1,VHHH,YMML,0124,   96',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-11-14-csv-oooi');
    expect(result.raw.on_time).toBe(1 * 3600 + 24 * 60);
  });
});
