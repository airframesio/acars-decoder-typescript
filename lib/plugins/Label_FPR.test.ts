import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_FPR } from './Label_FPR';

// Production messages, 2026-11-22
describe('Label_FPR', () => {
  let plugin: Label_FPR;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_FPR(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-fpr');
    expect(plugin.qualifiers()).toEqual({ labels: ['40', 'C1'] });
  });

  test('decodes a label 40 flight progress report', () => {
    const decodeResult = plugin.decode({
      label: '40',
      text: 'FPR\r\n. FLT 1407 PHX-DFW SKD ARR 2355L\r\n                 A PLUS 14 0009L\r\n                   PLN     0051L\r\n  OUT  0421             0219  TOT / CTR\r\n  OFF  0434             0215      /\r\nWETAL  0439     123/    0197      /',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Flight Progress Report');
    expect(decodeResult.raw.flight_number).toBe('1407');
    expect(decodeResult.raw.departure_iata).toBe('PHX');
    expect(decodeResult.raw.arrival_iata).toBe('DFW');
    expect(decodeResult.raw.out_time).toBe(15660);
    expect(decodeResult.raw.off_time).toBe(16440);
    expect(decodeResult.remaining.text).toContain('WETAL  0439');
  });

  test('decodes a tab indented C1 uplink', () => {
    const decodeResult = plugin.decode({
      label: 'C1',
      text: '.TULYVAA 220558\n\tAGM\n\tAN N786AN/FI AA0996\n\t-   FPR\n\t. FLT 996  EZE-DFW SKD ARR 0630L\n\t                 A PLUS 14 0644L\n\t                   PLN     1028L\n\t  OUT  0538             1904  TOT / CTR\n\t  OFF  0554             1890      /\n\tR212J  0559     096/    1827      /',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.ground_address).toBe('TULYVAA');
    expect(decodeResult.raw.tail).toBe('N786AN');
    expect(decodeResult.raw.flight_number).toBe('AA0996');
    expect(decodeResult.raw.departure_iata).toBe('EZE');
    expect(decodeResult.raw.out_time).toBe(20280);
    expect(decodeResult.raw.off_time).toBe(21240);
  });

  test('does not decode other messages', () => {
    for (const [label, text] of [
      ['40', 'FPR\r\nNO FLIGHT'],
      [
        'C1',
        '.NDCULUA 220455\r\nAGM\r\nAN N23707\r\n-  SVC INFO SUMMARY\r\nUA2186/21 KSNA KEWR',
      ],
    ]) {
      const decodeResult = plugin.decode({ label, text });
      expect(decodeResult.decoded).toBe(false);
      expect(decodeResult.formatted.items).toEqual([]);
    }
  });

  test('is the plugin MessageDecoder picks for label 40', () => {
    const result = new MessageDecoder().decode({
      label: '40',
      text: 'FPR\r\n. FLT 1407 PHX-DFW SKD ARR 2355L\r\n  OUT  0421             0219  TOT / CTR\r\n',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-fpr');
  });
});
