import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_11_INRANG } from './Label_11_INRANG';

// Production messages, 2026-11-22
describe('Label_11_INRANG', () => {
  let plugin: Label_11_INRANG;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_11_INRANG(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-11-inrang');
    expect(plugin.qualifiers()).toEqual({ labels: ['11'] });
  });

  test('decodes a FedEx in range report', () => {
    const decodeResult = plugin.decode({
      label: '11',
      text: '216023/INRANG/DS PANC/ETA 0538/FOB  24300\r\n/APU AVAIL/UPL NO',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('In Range Report');
    expect(decodeResult.raw.flight_number).toBe('6023');
    expect(decodeResult.raw.arrival_icao).toBe('PANC');
    expect(decodeResult.raw.eta_time).toBe(20280);
    expect(decodeResult.raw.fuel_on_board).toBe(24300);
    expect(decodeResult.remaining.text).toBe('21//APU AVAIL/UPL NO');
  });

  test('does not decode other messages', () => {
    const decodeResult = plugin.decode({
      label: '11',
      text: 'OUT0105400525LSZHEGLL',
    });
    expect(decodeResult.decoded).toBe(false);
  });
});
