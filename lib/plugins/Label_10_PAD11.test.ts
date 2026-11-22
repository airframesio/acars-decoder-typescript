import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_10_PAD11 } from './Label_10_PAD11';

describe('Label 10 PAD11', () => {
  let plugin: Label_10_PAD11;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_10_PAD11(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-10-pad11');
    expect(plugin.qualifiers()).toEqual({
      labels: ['10', '11'],
      preambles: [':PAD11', '4PAD11/SLOT'],
    });
  });

  test('decodes a British Airways arrival uplink', () => {
    const result = plugin.decode({
      label: '10',
      text: ':PAD11\r\nUTC\r\nARRIVAL- GZBJI BA130  \r\nSTAND 563  ATA 0847 //\r\n\r\n\r\nA350/A380/B777/B787 LHR ARRIVALS ONLY.',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Arrival Uplink');
    expect(result.raw.tail).toBe('GZBJI');
    expect(result.raw.flight_number).toBe('BA130');
    expect(result.raw.arrival_gate).toBe('563');
    expect(result.raw.in_time).toBe(8 * 3600 + 47 * 60);
    expect(result.remaining.text).toBe(
      'A350/A380/B777/B787 LHR ARRIVALS ONLY.',
    );
  });

  test('decodes an arrival uplink without a stand', () => {
    const result = plugin.decode({
      label: '10',
      text: ':PAD11\r\nUTC\r\nARRIVAL- GNEOZ BA1440 \r\nATA 0851 //',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.flight_number).toBe('BA1440');
    expect(result.raw.arrival_gate).toBeUndefined();
    expect(result.raw.in_time).toBe(8 * 3600 + 51 * 60);
  });

  test('decodes an Iberia slot uplink', () => {
    const result = new MessageDecoder().decode({
      label: '10',
      text: '4PAD11/SLOT\n\tIB154 ECOOL\n\tSTD 0335 STA 1310\n\tATD 0357\n\tDLY 0022 93 0015 89 0007\n\t',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-10-pad11');
    expect(result.formatted.description).toBe('Slot Uplink');
    expect(result.raw.flight_number).toBe('IB154');
    expect(result.raw.tail).toBe('ECOOL');
    expect(result.raw.scheduled_departure_time).toBe(3 * 3600 + 35 * 60);
    expect(result.raw.scheduled_arrival_time).toBe(13 * 3600 + 10 * 60);
    expect(result.raw.out_time).toBe(3 * 3600 + 57 * 60);
    expect(result.remaining.text).toBe('DLY 0022 93 0015 89 0007');
  });

  test('does not decode other PAD11 uplinks', () => {
    for (const text of [
      ':PAD11\r\nPDC/ASAT RECEIVED',
      ':PAD11\r\nSLOT CHANGE\r\n396  LHR - CAI\r\nFP RLS: 9\r\nCTOT: 0915 //',
      '4PAD11/SLOT\n\tIB154 ECOOL\n\tSTD 0335 STA 1310\n\tATD 2599\n\t',
    ]) {
      expect(plugin.decode({ label: '10', text }).decoded).toBe(false);
    }
  });
});
