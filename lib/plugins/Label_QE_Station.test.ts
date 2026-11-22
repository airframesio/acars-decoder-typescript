import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_QE_Station } from './Label_QE_Station';

describe('Label QE/QF/QC/QD short reports with IATA stations', () => {
  let plugin: Label_QE_Station;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_QE_Station(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-qe-station');
    expect(plugin.qualifiers()).toEqual({
      labels: ['QE', 'QF', 'QC', 'QD'],
    });
  });

  test('decodes QE OUT with destination', () => {
    // https://app.airframes.io/messages/8191282944
    const result = plugin.decode({ label: 'QE', text: 'MEL2019       60WSI' });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('OUT Report');
    expect(result.raw.departure_iata).toBe('MEL');
    expect(result.raw.arrival_iata).toBe('WSI');
    expect(result.raw.out_time).toBe(20 * 3600 + 19 * 60);
    expect(result.remaining.text).toBe('60');
  });

  test('decodes QE OUT with door times', () => {
    // https://app.airframes.io/messages/8187953383
    const result = plugin.decode({
      label: 'QE',
      text: 'PHL1349000000078ORF/DC 1349/PB 1349',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.departure_iata).toBe('PHL');
    expect(result.raw.arrival_iata).toBe('ORF');
    expect(result.raw.out_time).toBe(13 * 3600 + 49 * 60);
  });

  test('decodes QE OUT with unknown stations', () => {
    // https://app.airframes.io/messages/8186672282
    const result = plugin.decode({ label: 'QE', text: '---1116       29---' });

    expect(result.decoded).toBe(true);
    expect(result.raw.departure_iata).toBeUndefined();
    expect(result.raw.arrival_iata).toBeUndefined();
    expect(result.raw.out_time).toBe(11 * 3600 + 16 * 60);
  });

  test('decodes QF OFF', () => {
    // https://app.airframes.io/messages/8188170899
    const result = plugin.decode({
      label: 'QF',
      text: 'PHL1412GSOOS GSO/FUL0628',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('OFF Report');
    expect(result.raw.departure_iata).toBe('PHL');
    expect(result.raw.arrival_iata).toBe('GSO');
    expect(result.raw.off_time).toBe(14 * 3600 + 12 * 60);
    expect(result.remaining.text).toBe('OS GSO/FUL0628');
  });

  test('decodes QF OFF without extra text fully', () => {
    // https://app.airframes.io/messages/8190774657
    const result = plugin.decode({ label: 'QF', text: 'SEA1912SFO' });

    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.departure_iata).toBe('SEA');
    expect(result.raw.arrival_iata).toBe('SFO');
    expect(result.raw.off_time).toBe(19 * 3600 + 12 * 60);
  });

  test('decodes QC ON', () => {
    // https://app.airframes.io/messages/8191819929
    const result = plugin.decode({ label: 'QC', text: 'IAD2128' });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('ON Report');
    expect(result.raw.arrival_iata).toBe('IAD');
    expect(result.raw.on_time).toBe(21 * 3600 + 28 * 60);
  });

  test('decodes QD IN', () => {
    // https://app.airframes.io/messages/8189547185
    const result = plugin.decode({ label: 'QD', text: 'SFO164100792' });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('IN Report');
    expect(result.raw.arrival_iata).toBe('SFO');
    expect(result.raw.in_time).toBe(16 * 3600 + 41 * 60);
    expect(result.remaining.text).toBe('00792');
  });

  test('does not decode an empty or invalid report', () => {
    expect(plugin.decode({ label: 'QD', text: '' }).decoded).toBe(false);
    expect(plugin.decode({ label: 'QC', text: 'IAD2561' }).decoded).toBe(false);
  });

  test('text reports still go to the text report plugin', () => {
    const decoder = new MessageDecoder();
    const result = decoder.decode({
      label: 'QC',
      text: '-------ON REPORT\r\nDES RCKU,ON 0843,FOB 111',
    });
    expect(result.decoder.name).toBe('label-qe-report');

    const short = decoder.decode({ label: 'QC', text: 'IAD2128' });
    expect(short.decoder.name).toBe('label-qe-station');
  });
});
