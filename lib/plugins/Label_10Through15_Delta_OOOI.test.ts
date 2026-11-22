import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_10Through15_Delta_OOOI } from './Label_10Through15_Delta_OOOI';

describe('Labels 10-15 Delta OOOI reports', () => {
  let plugin: Label_10Through15_Delta_OOOI;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_10Through15_Delta_OOOI(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-10-15-delta-oooi');
    expect(plugin.qualifiers()).toEqual({
      labels: ['10', '11', '13', '14', '15'],
    });
  });

  test('decodes label 13 OUT report', () => {
    const result = plugin.decode({
      label: '13',
      text: '210513 KLAX KATL6\r\n07830550038005490542            ',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Out of Gate Report');
    expect(result.raw.day).toBe(21);
    expect(result.raw.flight_number).toBe('783');
    expect(result.raw.departure_icao).toBe('KLAX');
    expect(result.raw.arrival_icao).toBe('KATL');
    expect(result.raw.out_time).toBe(5 * 3600 + 50 * 60);
    expect(result.remaining.text).toBe('0380,05490542');
  });

  test('decodes label 10 OFF report with the OUT time', () => {
    const result = plugin.decode({
      label: '10',
      text: '210610 KLAX KATL6\r\n07830603037905520549054205500550            ',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Takeoff Report');
    expect(result.raw.off_time).toBe(6 * 3600 + 3 * 60);
    expect(result.raw.out_time).toBe(5 * 3600 + 50 * 60);
    expect(result.remaining.text).toBe('0379,055205490542');
  });

  test('decodes label 10 OFF report with blank fields', () => {
    const result = plugin.decode({
      label: '10',
      text: '212010 KORD KATL6\r\n2894200502051942        19411941000000000000',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.off_time).toBe(20 * 3600 + 5 * 60);
    expect(result.raw.out_time).toBe(19 * 3600 + 41 * 60);
  });

  test('decodes label 15 ON report', () => {
    const result = plugin.decode({
      label: '15',
      text: '210015 KSAT KBOS6\r\n081600450059\r\n000000903094901036000000000000001160000148',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Landing Report');
    expect(result.raw.flight_number).toBe('816');
    expect(result.raw.on_time).toBe(45 * 60);
  });

  test('decodes label 14 IN report', () => {
    const result = plugin.decode({
      label: '14',
      text: '210014 KSAT KBOS6\r\n0816005600560059',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('In Gate Report');
    expect(result.raw.in_time).toBe(56 * 60);
    expect(result.remaining.text).toBe('0056,0059');
  });

  test('decodes label 14 IN report without fuel', () => {
    const result = plugin.decode({
      label: '14',
      text: '212214 KJFK KSFO6\r\n03632222        ',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.in_time).toBe(22 * 3600 + 22 * 60);
  });

  test('decodes label 11 IN summary with the ON time', () => {
    const result = plugin.decode({
      label: '11',
      text: '210111 KSAT KBOS6\r\n081600560056111390  0       0011600001490045\r\n\r\n',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('In Gate Summary');
    expect(result.raw.in_time).toBe(56 * 60);
    expect(result.raw.on_time).toBe(45 * 60);
  });

  test('decodes label 11 IN summary with blank fuel', () => {
    const result = plugin.decode({
      label: '11',
      text: '210511 KSLC KBOS8\r\n07020454    111200  0                   0449\r\n',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.in_time).toBe(4 * 3600 + 54 * 60);
    expect(result.raw.on_time).toBe(4 * 3600 + 49 * 60);
  });

  test('decodes label 15 ON report behind a C-Band header', () => {
    const result = new MessageDecoder().decode({
      label: '15',
      text: 'M70ADL0065201915 KLAX NZAA6\n\t006519470293\n\t      391944456540488833007827            ',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('c-band-label-10-15-delta-oooi');
    expect(result.raw.arrival_icao).toBe('NZAA');
    expect(result.raw.on_time).toBe(19 * 3600 + 47 * 60);
    expect(result.raw.flight_number).toBe('DL65');
    expect(
      result.formatted.items.filter((i) => i.type === 'flight_number'),
    ).toHaveLength(1);
  });

  test('decodes label 11 with a blank ON time', () => {
    const result = new MessageDecoder().decode({
      label: '11',
      text: '210511 KSLC KBOS8\r\n07020454    111200  0                   ----',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-10-15-delta-oooi');
    expect(result.raw.in_time).toBe(4 * 3600 + 54 * 60);
    expect(result.raw.on_time).toBeUndefined();
  });

  test('does not decode label 11 with an invalid IN time', () => {
    const result = plugin.decode({
      label: '11',
      text: '210511 KSLC KBOS8\r\n07029999    111200  0      0449',
    });

    expect(result.decoded).toBe(false);
  });

  test('keeps an invalid OFF time out of the label 10 result', () => {
    const result = new MessageDecoder().decode({
      label: '10',
      text: '210610 KLAX KATL6\r\n07839999037905520549054205500550',
    });

    expect(result.decoded).toBe(false);
    expect(result.raw.off_time).toBeUndefined();
  });

  test('keeps a second OUT copy that differs', () => {
    const result = plugin.decode({
      label: '10',
      text: '210610 KLAX KATL6\r\n07830603037905520549054205500999',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.out_time).toBe(5 * 3600 + 50 * 60);
    expect(result.remaining.text).toBe('0379,055205490542,0999');
  });

  test('does not decode a header with an invalid day or hour', () => {
    for (const text of [
      '992513 KLAX KATL6\r\n07830550038005490542',
      '219913 KLAX KATL6\r\n07830550038005490542',
    ]) {
      expect(plugin.decode({ label: '13', text }).decoded).toBe(false);
    }
  });

  test('is used by the decoder ahead of other label 10 plugins', () => {
    const result = new MessageDecoder().decode({
      label: '10',
      text: '210510 KLAX KSFO6\r\n29860557015005490544053905480548029282009875',
    });

    expect(result.decoder.name).toBe('label-10-15-delta-oooi');
  });

  test('does not decode a header for another label', () => {
    const result = plugin.decode({
      label: '13',
      text: '210514 KDTW KLAX6\r\n0694062900810084',
    });

    expect(result.decoded).toBe(false);
  });

  test('does not decode a delay remark', () => {
    const result = plugin.decode({
      label: '11',
      text: '212211 KSFO KATL6\r\n2253\r\nLONG LINE OF DEPARTURES\r\n',
    });

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
  });
});
