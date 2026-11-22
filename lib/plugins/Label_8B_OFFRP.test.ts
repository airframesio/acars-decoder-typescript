import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_8B_OFFRP } from './Label_8B_OFFRP';

// Production messages, 2026-11-22
describe('Label_8B_OFFRP', () => {
  let plugin: Label_8B_OFFRP;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_8B_OFFRP(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-8b-offrp');
    expect(plugin.qualifiers()).toEqual({ labels: ['8B'], preambles: ['V'] });
  });

  test('decodes a SAS takeoff report', () => {
    const decodeResult = plugin.decode({
      label: '8B',
      text: 'V09CA032/OFFRP/ESSA/EKCH/22/0505/ETA0602/',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Takeoff Report');
    expect(decodeResult.raw.departure_icao).toBe('ESSA');
    expect(decodeResult.raw.arrival_icao).toBe('EKCH');
    expect(decodeResult.raw.day).toBe(22);
    expect(decodeResult.raw.off_time).toBe(18300);
    expect(decodeResult.raw.eta_time).toBe(21720);
    expect(decodeResult.remaining.text).toBe('V09CA032');
  });

  test('does not decode other messages', () => {
    for (const text of [
      'V09CA032/OFFRP/ESSA/EKCH/22/2505/ETA0602/',
      'V09CA033/ETA-30/0550/',
    ]) {
      const decodeResult = plugin.decode({ label: '8B', text });
      expect(decodeResult.decoded).toBe(false);
      expect(decodeResult.decoder.decodeLevel).toBe('none');
    }
  });

  test('keeps a bad ETA in remaining', () => {
    const decodeResult = plugin.decode({
      label: '8B',
      text: 'V09CA032/OFFRP/ESSA/EKCH/22/0505/ETA2560/',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.off_time).toBe(18300);
    expect(decodeResult.raw.eta_time).toBeUndefined();
    expect(decodeResult.remaining.text).toBe('V09CA032/ETA2560');
  });

  test('reads an ETA at the end of the text', () => {
    const decodeResult = plugin.decode({
      label: '8B',
      text: 'V09CA032/OFFRP/ESSA/EKCH/22/0505/ETA0602',
    });

    expect(decodeResult.raw.eta_time).toBe(21720);
    expect(decodeResult.remaining.text).toBe('V09CA032');
  });
});
