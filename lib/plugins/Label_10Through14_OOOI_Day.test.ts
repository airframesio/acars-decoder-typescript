import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_10Through14_OOOI_Day } from './Label_10Through14_OOOI_Day';

describe('Labels 10-14 OOOI reports with day and HHMMSS (JAL, ANA)', () => {
  let plugin: Label_10Through14_OOOI_Day;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_10Through14_OOOI_Day(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-10-14-oooi-day');
    expect(plugin.qualifiers()).toEqual({
      labels: ['10', '11', '12', '13', '14'],
      preambles: ['OUT', 'OFF', 'ONN', 'INN'],
    });
  });

  test('decodes JAL OUT report', () => {
    const result = plugin.decode({
      label: '10',
      text: 'OUT04A21204409KSFO2044RJTT',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Out of Gate Report');
    expect(result.raw.day).toBe(21);
    expect(result.raw.departure_icao).toBe('KSFO');
    expect(result.raw.arrival_icao).toBe('RJTT');
    expect(result.raw.out_time).toBe(20 * 3600 + 44 * 60 + 9);
    expect(result.remaining.text).toBe('04,2044');
  });

  test('decodes JAL OFF report', () => {
    const result = plugin.decode({
      label: '10',
      text: 'OFF10A22062819RJCH0628RJTT',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Takeoff Report');
    expect(result.raw.day).toBe(22);
    expect(result.raw.departure_icao).toBe('RJCH');
    expect(result.raw.arrival_icao).toBe('RJTT');
    expect(result.raw.off_time).toBe(6 * 3600 + 28 * 60 + 19);
  });

  test('decodes JAL ON report', () => {
    const result = plugin.decode({
      label: '10',
      text: 'ONN04A21200226YSSY2002',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Landing Report');
    expect(result.raw.departure_icao).toBeUndefined();
    expect(result.raw.arrival_icao).toBe('YSSY');
    expect(result.raw.on_time).toBe(20 * 3600 + 2 * 60 + 26);
  });

  test('decodes JAL IN report', () => {
    const result = plugin.decode({
      label: '10',
      text: 'INN04A21201154YSSY20060381    ',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('In Gate Report');
    expect(result.raw.arrival_icao).toBe('YSSY');
    expect(result.raw.in_time).toBe(20 * 3600 + 11 * 60 + 54);
    expect(result.remaining.text).toBe('04,2006,0381');
  });

  test('decodes ANA OFF report', () => {
    const result = plugin.decode({
      label: '11',
      text: 'OFF01A21070436RJSSRJCC070421',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.departure_icao).toBe('RJSS');
    expect(result.raw.arrival_icao).toBe('RJCC');
    expect(result.raw.off_time).toBe(7 * 3600 + 4 * 60 + 36);
    expect(result.remaining.text).toBe('01,070421');
  });

  test('decodes JAL OUT report behind a C-Band header', () => {
    const result = new MessageDecoder().decode({
      label: '10',
      text: 'M34AJL0111OUT04A22003718RJTT0037RJOO',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('c-band-label-10-14-oooi-day');
    expect(result.raw.flight_number).toBe('JL111');
    expect(result.raw.out_time).toBe(37 * 60 + 18);
  });

  test('does not decode a JAL ETA report', () => {
    const result = plugin.decode({
      label: '10',
      text: 'ETA04M22062329   VTBS090161  340Y',
    });

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
  });

  test('does not decode an out-of-range time', () => {
    const result = plugin.decode({
      label: '10',
      text: 'OUT04A21254409KSFO2544RJTT',
    });

    expect(result.decoded).toBe(false);
  });

  test('keeps the second airport of an IN report', () => {
    const result = plugin.decode({
      label: '10',
      text: 'INN04A21201154YSSY2006RJTT',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.arrival_icao).toBe('YSSY');
    expect(result.remaining.text).toBe('04,2006,RJTT');
  });

  test('does not decode an invalid day', () => {
    const result = plugin.decode({
      label: '10',
      text: 'OUT04A99204409KSFO2044RJTT',
    });

    expect(result.decoded).toBe(false);
  });
});
