import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_3A_ETA } from './Label_3A_ETA';

// Production messages, 2026-11-22
describe('Label_3A_ETA', () => {
  let plugin: Label_3A_ETA;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_3A_ETA(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-3a-eta');
    expect(plugin.qualifiers()).toEqual({
      labels: ['3A'],
      preambles: ['/ETA '],
    });
  });

  test('decodes a position report with an ETA', () => {
    const decodeResult = plugin.decode({
      label: '3A',
      text: '/ETA 0905/LAT N 49.194/LON E 14.547/ALT 29999/FB 70',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.eta_time).toBe(32700);
    expect(decodeResult.raw.position).toEqual({
      latitude: 49.194,
      longitude: 14.547,
    });
    expect(decodeResult.raw.altitude).toBe(29999);
    expect(decodeResult.raw.fuel_on_board).toBe(70);
  });

  test('decodes a report without a position', () => {
    const decodeResult = plugin.decode({
      label: '3A',
      text: '/ETA 0902/LAT ----.---/LON ----.---/ALT 30007/FB ',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.eta_time).toBe(32520);
    expect(decodeResult.raw.position).toBeUndefined();
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.remaining.text).toBe('LAT ----.---/LON ----.---/FB ');
  });

  test('does not decode other messages', () => {
    const decodeResult = plugin.decode({
      label: '3A',
      text: '/ETA 2599/LAT N 49.194',
    });
    expect(decodeResult.decoded).toBe(false);
  });

  test('keeps a lone coordinate in remaining', () => {
    const decodeResult = plugin.decode({
      label: '3A',
      text: '/ETA 0905/LAT N 49.194/LON ----.---/ALT 29999/FB 70',
    });

    expect(decodeResult.raw.position).toBeUndefined();
    expect(decodeResult.remaining.text).toBe('LON ----.---/LAT N 49.194');
  });
});
