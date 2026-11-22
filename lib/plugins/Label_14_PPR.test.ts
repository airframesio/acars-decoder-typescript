import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_14_PPR } from './Label_14_PPR';

// Production messages, 2026-11-22
describe('Label_14_PPR', () => {
  let plugin: Label_14_PPR;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_14_PPR(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-14-ppr');
    expect(plugin.qualifiers()).toEqual({
      labels: ['14'],
      preambles: ['PRESENT POSITION REPORT'],
    });
  });

  test('decodes a present position report', () => {
    const decodeResult = plugin.decode({
      label: '14',
      text: 'PRESENT POSITION REPORT\r\nDMY 211126,UTC 052937,LAT N41.561,LON W1.427,CAS 271,WD -102,WS 106,ALT 350,FOB 15135,ETA 0600',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.day).toBe(21);
    expect(decodeResult.raw.month).toBe(11);
    expect(decodeResult.raw.message_timestamp).toBe(19777);
    expect(decodeResult.raw.position).toEqual({
      latitude: 41.561,
      longitude: -1.427,
    });
    expect(decodeResult.raw.altitude).toBe(35000);
    expect(decodeResult.raw.fuel_on_board).toBe(15135);
    expect(decodeResult.raw.eta_time).toBe(21600);
    expect(decodeResult.remaining.text).toBe('26,WD -102,WS 106');
  });

  test('does not decode other messages', () => {
    const decodeResult = plugin.decode({
      label: '14',
      text: 'PRESENT POSITION',
    });
    expect(decodeResult.decoded).toBe(false);
  });
});
