import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_10_ETA } from './Label_10_ETA';

// Production messages, 2026-11-22
describe('Label_10_ETA', () => {
  let plugin: Label_10_ETA;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_10_ETA(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-10-eta');
    expect(plugin.qualifiers()).toEqual({ labels: ['10'], preambles: ['ETA'] });
  });

  test('decodes a KLM ETA report', () => {
    const decodeResult = plugin.decode({
      label: '10',
      text: 'ETA31A22055150KLC1708 ELLXEHAM220602EHAM  30',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.day).toBe(22);
    expect(decodeResult.raw.message_timestamp).toBe(21110);
    expect(decodeResult.raw.flight_number).toBe('KLC1708');
    expect(decodeResult.raw.departure_icao).toBe('ELLX');
    expect(decodeResult.raw.arrival_icao).toBe('EHAM');
    expect(decodeResult.raw.arrival_day).toBe(22);
    expect(decodeResult.raw.eta_time).toBe(21720);
    expect(decodeResult.remaining.text).toBe('31,EHAM  30');
  });

  test('does not decode other messages', () => {
    const decodeResult = plugin.decode({ label: '10', text: 'ETA 0602' });
    expect(decodeResult.decoded).toBe(false);
  });
});
