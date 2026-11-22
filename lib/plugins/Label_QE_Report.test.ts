import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_QE_Report } from './Label_QE_Report';

describe('Label QE/QF/QC/QD text OOOI reports', () => {
  let plugin: Label_QE_Report;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_QE_Report(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-qe-report');
    expect(plugin.qualifiers()).toEqual({
      labels: ['QE', 'QF', 'QC', 'QD'],
    });
  });

  test('decodes QE OUT report', () => {
    const result = plugin.decode({
      label: 'QE',
      text: '-------------------OUT REPORT\r\nDEP RCKU,OUT 1118,FOB 106',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('OUT Report');
    expect(result.raw.departure_icao).toBe('RCKU');
    expect(result.raw.out_time).toBe(11 * 3600 + 18 * 60);
    expect(result.raw.fuel_on_board).toBe(106);
  });

  test('decodes QF OFF report with destination', () => {
    const result = plugin.decode({
      label: 'QF',
      text: '----------OFF REPORT\r\nDEP RCKU,OFF 1124,DES RCSS,FOB 106',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('OFF Report');
    expect(result.raw.departure_icao).toBe('RCKU');
    expect(result.raw.arrival_icao).toBe('RCSS');
    expect(result.raw.off_time).toBe(11 * 3600 + 24 * 60);
  });

  test('decodes QC ON report', () => {
    const result = plugin.decode({
      label: 'QC',
      text: '-------ON REPORT\r\nDES RCKU,ON 0843,FOB 111',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('ON Report');
    expect(result.raw.arrival_icao).toBe('RCKU');
    expect(result.raw.on_time).toBe(8 * 3600 + 43 * 60);
  });

  test('decodes QD IN report', () => {
    const result = plugin.decode({
      label: 'QD',
      text: '------------IN REPORT\r\nDES RCKU,IN 0849,FOB 109',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('IN Report');
    expect(result.raw.in_time).toBe(8 * 3600 + 49 * 60);
  });

  test('decodes report behind a multi-block header', () => {
    const result = plugin.decode({
      label: 'QE',
      text: 'M77ASC4873-------------------OUT REPORT,DEP ZSQD,OUT 2350,FOB 110',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.raw.departure_icao).toBe('ZSQD');
    expect(result.raw.out_time).toBe(23 * 3600 + 50 * 60);
    expect(result.remaining.text).toBe('M77ASC4873');
  });

  test('does not decode other formats', () => {
    const result = plugin.decode({ label: 'QE', text: 'MEL2010' });

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
  });
});
