import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_C1_Part117 } from './Label_C1_Part117';

// Production messages, 2026-11-22
describe('Label_C1_Part117', () => {
  let plugin: Label_C1_Part117;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_C1_Part117(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-c1-part117');
    expect(plugin.qualifiers()).toEqual({ labels: ['C1'], preambles: ['.'] });
  });

  test('decodes the actual departure', () => {
    const decodeResult = plugin.decode({
      label: 'C1',
      text: '.NDCULUA 220440\r\nAGM\r\nAN N496UA\r\n-  FLT# 2464-21    KSFO     04:40\r\nPART 117        RLS 1   ACT DEP 0439\r\nCCO TIME(ZULU)\r\n----------------------\r\nBLOCK CCO TIME    0809',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Crew Duty Report');
    expect(decodeResult.raw.ground_address).toBe('NDCULUA');
    expect(decodeResult.raw.tail).toBe('N496UA');
    expect(decodeResult.raw.flight_number).toBe('2464');
    expect(decodeResult.raw.departure_day).toBe(21);
    expect(decodeResult.raw.departure_icao).toBe('KSFO');
    expect(decodeResult.raw.out_time).toBe(16740);
    expect(decodeResult.raw.etd_time).toBeUndefined();
  });

  test('decodes the estimated departure', () => {
    const decodeResult = plugin.decode({
      label: 'C1',
      text: '.NDCULUA 220506\r\nAGM\r\nAN N76523\r\n-  FLT# 2056-21   KLAX      05:06\r\nPART 117        RLS 3  EST DEP 0535\r\nCCO TIMES(ZULU)      \r\n',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.departure_icao).toBe('KLAX');
    expect(decodeResult.raw.etd_time).toBe(20100);
    expect(decodeResult.raw.out_time).toBeUndefined();
  });

  test('does not decode other messages', () => {
    const decodeResult = plugin.decode({
      label: 'C1',
      text: '.NDCULUA 220455\r\nAGM\r\nAN N23707\r\n-  SVC INFO SUMMARY\r\nUA2186/21 KSNA KEWR',
    });
    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.formatted.items).toEqual([]);
  });
});
