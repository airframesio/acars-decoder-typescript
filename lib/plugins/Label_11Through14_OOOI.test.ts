import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_11Through14_OOOI } from './Label_11Through14_OOOI';

describe('Labels 11-14 OOOI reports', () => {
  let plugin: Label_11Through14_OOOI;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_11Through14_OOOI(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-11-14-oooi');
    expect(plugin.qualifiers()).toEqual({
      labels: ['11', '12', '13', '14'],
      preambles: ['OUT01', 'OFF01', 'ONN01', 'INN01'],
    });
  });

  test('decodes label 11 OUT report', () => {
    // https://app.airframes.io/messages/8193180719
    const result = plugin.decode({
      label: '11',
      text: 'OUT01    ETH309/22220151HKJKHAAB\r\n0151 16510600',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Out of Gate Report');
    expect(result.raw.flight_number).toBe('ETH309');
    expect(result.raw.departure_day).toBe(22);
    expect(result.raw.day).toBe(22);
    expect(result.raw.departure_icao).toBe('HKJK');
    expect(result.raw.arrival_icao).toBe('HAAB');
    expect(result.raw.out_time).toBe(1 * 3600 + 51 * 60);
    expect(result.remaining.text).toBe('16510600');
  });

  test('decodes label 12 OFF report', () => {
    // https://app.airframes.io/messages/8191300924
    const result = plugin.decode({
      label: '12',
      text: 'OFF01    CSN654/21212021EGKKZHCC\r\n2021 5490936  98,4697.89,144230, 198788, 51.149,-   .18,093652,',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Takeoff Report');
    expect(result.raw.flight_number).toBe('CSN654');
    expect(result.raw.departure_icao).toBe('EGKK');
    expect(result.raw.arrival_icao).toBe('ZHCC');
    expect(result.raw.off_time).toBe(20 * 3600 + 21 * 60);
  });

  test('decodes label 13 ON report across midnight', () => {
    // https://app.airframes.io/messages/8192780027
    const result = plugin.decode({
      label: '13',
      text: 'ONN01   WJA2251/21220021MMPRCYYC\r\n00210167',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Landing Report');
    expect(result.raw.flight_number).toBe('WJA2251');
    expect(result.raw.departure_day).toBe(21);
    expect(result.raw.day).toBe(22);
    expect(result.raw.departure_icao).toBe('MMPR');
    expect(result.raw.arrival_icao).toBe('CYYC');
    expect(result.raw.on_time).toBe(21 * 60);
  });

  test('decodes label 14 IN report with left-aligned flight', () => {
    // https://app.airframes.io/messages/8186264630
    const result = plugin.decode({
      label: '14',
      text: 'INN01UAE179    /21211019OMDBEPWA\r\n1017 1761011',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('In Gate Report');
    expect(result.raw.flight_number).toBe('UAE179');
    expect(result.raw.departure_icao).toBe('OMDB');
    expect(result.raw.arrival_icao).toBe('EPWA');
    expect(result.raw.in_time).toBe(10 * 3600 + 17 * 60);
  });

  test('decodes BA label 11 OUT report without a slash', () => {
    const result = plugin.decode({
      label: '11',
      text: 'OUT0105400525LSZHEGLL',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Out of Gate Report');
    expect(result.raw.departure_icao).toBe('LSZH');
    expect(result.raw.arrival_icao).toBe('EGLL');
    expect(result.raw.out_time).toBe(5 * 3600 + 40 * 60);
    expect(result.remaining.text).toBe('0525');
  });

  test('decodes BA label 12 OFF report with ETA', () => {
    const result = plugin.decode({
      label: '12',
      text: 'OFF010247DIA02KEWREGLL0859BAB7080926130450READY ',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Takeoff Report');
    expect(result.raw.departure_icao).toBe('KEWR');
    expect(result.raw.arrival_icao).toBe('EGLL');
    expect(result.raw.off_time).toBe(2 * 3600 + 47 * 60);
    expect(result.raw.eta_time).toBe(8 * 3600 + 59 * 60);
    expect(result.remaining.text).toBe('02,BAB7080926130450READY');
  });

  test('decodes BA label 13 ON report', () => {
    const result = plugin.decode({ label: '13', text: 'ONN011317EGJB' });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('Landing Report');
    expect(result.raw.arrival_icao).toBe('EGJB');
    expect(result.raw.on_time).toBe(13 * 3600 + 17 * 60);
  });

  test('decodes BA label 14 IN report', () => {
    const result = plugin.decode({
      label: '14',
      text: 'INN010611EGLL 484 480  56  54',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('In Gate Report');
    expect(result.raw.arrival_icao).toBe('EGLL');
    expect(result.raw.in_time).toBe(6 * 3600 + 11 * 60);
    expect(result.remaining.text).toBe('484 480  56  54');
  });

  test('decodes BA label 14 IN report without a station', () => {
    const result = plugin.decode({ label: '14', text: 'INN011053----' });

    expect(result.decoded).toBe(true);
    expect(result.raw.arrival_icao).toBeUndefined();
    expect(result.raw.in_time).toBe(10 * 3600 + 53 * 60);
  });

  test('decodes ANA IN report behind a C-Band header', () => {
    const result = new MessageDecoder().decode({
      label: '14',
      text: 'M99ANH0218INN01ANA218    /21212126EDDMRJTT\n\t2124192 ',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('c-band-label-11-14-oooi');
    expect(result.raw.departure_icao).toBe('EDDM');
    expect(result.raw.arrival_icao).toBe('RJTT');
    expect(result.raw.in_time).toBe(21 * 3600 + 24 * 60);
    expect(result.raw.flight_number).toBe('ANA218');
    expect(
      result.formatted.items.filter((i) => i.type === 'flight_number'),
    ).toHaveLength(1);
  });

  test('keeps unknown BA OFF fields in remaining', () => {
    const result = plugin.decode({
      label: '12',
      text: 'OFF010247DIA02KEWREGLL9999',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.raw.off_time).toBe(2 * 3600 + 47 * 60);
    expect(result.raw.eta_time).toBeUndefined();
    expect(result.remaining.text).toBe('02,9999');
  });

  test('leaves the ANA OFF01A report to the day plugin', () => {
    const result = new MessageDecoder().decode({
      label: '11',
      text: 'OFF01A21070436RJSSRJCC070421',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.name).toBe('label-10-14-oooi-day');
  });

  test('decodes Iberia compact reports', () => {
    const decoder = new MessageDecoder();
    const out = decoder.decode({
      label: '11',
      text: 'OUT0118321827LSZH.FOB19560',
    });
    expect(out.decoded).toBe(true);
    expect(out.decoder.name).toBe('label-11-14-oooi');
    expect(out.raw.departure_icao).toBe('LSZH');
    expect(out.raw.arrival_icao).toBeUndefined();
    expect(out.raw.out_time).toBe(18 * 3600 + 32 * 60);
    expect(out.raw.fuel_on_board).toBe(19560);
    expect(out.remaining.text).toBe('1827');

    const off = decoder.decode({ label: '12', text: 'OFF010652LSZHLEMD' });
    expect(off.decoded).toBe(true);
    expect(off.decoder.decodeLevel).toBe('full');
    expect(off.raw.departure_icao).toBe('LSZH');
    expect(off.raw.arrival_icao).toBe('LEMD');
    expect(off.raw.off_time).toBe(6 * 3600 + 52 * 60);

    const inn = decoder.decode({ label: '14', text: 'INN010817EGLL.FOB6920' });
    expect(inn.decoded).toBe(true);
    expect(inn.decoder.decodeLevel).toBe('full');
    expect(inn.raw.arrival_icao).toBe('EGLL');
    expect(inn.raw.in_time).toBe(8 * 3600 + 17 * 60);
    expect(inn.raw.fuel_on_board).toBe(6920);
  });

  test('does not decode a compact OUT cut off after the origin', () => {
    const result = plugin.decode({ label: '11', text: 'OUT0105400525LSZH' });
    expect(result.decoded).toBe(false);
  });

  test('does not decode an out-of-range time', () => {
    const result = plugin.decode({
      label: '11',
      text: 'OUT01    ETH309/22220151HKJKHAAB\r\n1260 16510600',
    });

    expect(result.decoded).toBe(false);
  });
});
