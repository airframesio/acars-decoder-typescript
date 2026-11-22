import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_B3_PDC } from './Label_B3_PDC';

// Texts from production B3 uplinks (shortened).
const JAZZ =
  '/CYWG.DC1/RCD 024\r\nJZA110-CYWG-GATE 12-CYOW\r\nATIS O\r\n-TYP/CRJ9912E';
const BRITISH_AIRWAYS =
  '/EGKK./RCD 046\r\nBAW22G -EGKK-GATE 27-MDPC\r\nATIS B\r\n-TYP/B772';
const NO_GATE = '/LSZH.DC1/RCD 011\r\nSWR72-LSZH-GATE -KIAD\r\n';

describe('Label B3 pre-departure clearance', () => {
  let decoder: MessageDecoder;
  let plugin: Label_B3_PDC;

  beforeEach(() => {
    decoder = new MessageDecoder();
    plugin = new Label_B3_PDC(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-b3-pdc');
    expect(plugin.qualifiers()).toEqual({ labels: ['B3'] });
  });

  test('decodes the departure gate', () => {
    const r = plugin.decode({ label: 'B3', text: JAZZ });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('partial');
    expect(r.formatted.description).toBe('Pre-Departure Clearance');
    expect(r.raw.callsign).toBe('JZA110');
    expect(r.raw.departure_icao).toBe('CYWG');
    expect(r.raw.departure_gate).toBe('12');
    expect(r.raw.arrival_icao).toBe('CYOW');
    expect(r.raw.arrival_gate).toBeUndefined();
    expect(r.remaining.text).toBe('/CYWG.DC1/RCD 024\nATIS O\n-TYP/CRJ9912E');
    expect(r.formatted.items.find((i) => i.code === 'DGATE')?.value).toBe('12');
  });

  test('decodes a callsign followed by a space', () => {
    const r = plugin.decode({ label: 'B3', text: BRITISH_AIRWAYS });
    expect(r.decoded).toBe(true);
    expect(r.raw.callsign).toBe('BAW22G');
    expect(r.raw.departure_icao).toBe('EGKK');
    expect(r.raw.departure_gate).toBe('27');
    expect(r.raw.arrival_icao).toBe('MDPC');
  });

  test('does not decode a clearance without a gate', () => {
    const r = plugin.decode({ label: 'B3', text: NO_GATE });
    expect(r.decoded).toBe(false);
    expect(r.raw.departure_gate).toBeUndefined();
  });

  test('is reached through MessageDecoder', () => {
    const r = decoder.decode({ label: 'B3', text: JAZZ });
    expect(r.decoder.name).toBe('label-b3-pdc');
    expect(r.raw.departure_gate).toBe('12');
  });
});
