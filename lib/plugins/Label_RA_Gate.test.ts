import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_RA_Gate } from './Label_RA_Gate';

// Texts from production RA uplinks (shortened, names removed).
const UNITED =
  'QUNDCULUA~1GATE ASSIGN\r\nUA1720/09 KMSP KDEN   \r\nSENT: 10:41:16Z \r\nGATE B47   OPEN\r\nRAMP FREQ  130.950\r\nOPS FREQ   \r\nEON        1208Z\r\nGROUND PWR AVAIL -YES-\r\n\r\nPLANNED GROUND TIME \r\nIS 01:36\r\nNEXT FLT UA1127/09\r\nKDEN KSN';
const UNITED_TABS =
  'QUNDCULUA~1GATE ASSIGN\r\n\tUA0942/21 KIAD LPPT\r\n\tSENT: 09:14:42Z\r\n\tGATE 43    OPEN\r\n\tRAMP FREQ  \r\n\tOPS FREQ   131.575\r\n\tEON        1003Z\r\n';
const UNITED_CHANGE =
  'QUNDCULUA~1GATE CHANGE\r\nUA0214/21 KSTL KSFO\r\nSENT: 05:22:32Z\r\n\r\n**** CREW ALERT ****\r\nGATE ASSIGN\r\nHAS CHANGED\r\nGATE D7    OPEN\r\nRAMP FREQ  119.225\r\n';
const REPUBLIC =
  'QUHDQDDRP~1ARRIVAL GATE\r\nINFORMATION\r\nRPA N401YX YX4450 ORD MSN ETA = 0542 GATE = 16\r\nAIRCRAFT TURNS TO - YX,NEX \r\n';
const SKYWEST =
  'QUHDQITOO.1ARR GATE INFO   \r\nBFL ARRIVAL GATE 4\r\nNEXT FLIGHT INFORMATION-\r\n** ALL TIMES LOCAL **\r\nAC N939SW\r\n N-A 4634 BFL-SFO 220700\r\nCA X\r\n';
const SKYWEST_DEN =
  'QUSILITOO.1ARR GATE INFO   \r\nDEN ARRIVAL GATE A28\r\nNEXT FLIGHT INFORMATION-\r\n';
const FINNAIR_CONNECTIONS =
  'QUHELASAY~1\r\nCURRENT FLIGHT\r\nFLIGHT  ESTIMATED ARRIVAL TIME\r\nAY1014   EIBT  UTC  \r\n\r\nCONNECTION INFO\r\nFLIGHT DATE     TIME  TO  GATE \r\nAY0957 20261122 09:35 CPH 31\r\n';

describe('Label RA arrival gate', () => {
  let decoder: MessageDecoder;
  let plugin: Label_RA_Gate;

  beforeEach(() => {
    decoder = new MessageDecoder();
    plugin = new Label_RA_Gate(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-ra-gate');
    expect(plugin.qualifiers()).toEqual({ labels: ['RA'] });
  });

  test('decodes a United gate assignment', () => {
    const r = decoder.decode({ label: 'RA', text: UNITED });
    expect(r.decoded).toBe(true);
    expect(r.decoder.name).toBe('label-ra-gate');
    expect(r.decoder.decodeLevel).toBe('partial');
    expect(r.formatted.description).toBe('Gate Assignment');
    expect(r.raw.flight_number).toBe('UA1720');
    expect(r.raw.day).toBe(9);
    expect(r.raw.departure_icao).toBe('KMSP');
    expect(r.raw.arrival_icao).toBe('KDEN');
    expect(r.raw.message_timestamp).toBe(10 * 3600 + 41 * 60 + 16);
    expect(r.raw.arrival_gate).toBe('B47');
    expect(r.raw.gate_status).toBe('OPEN');
    expect(r.raw.eon_time).toBe(12 * 3600 + 8 * 60);
    expect(r.raw.ramp_frequency).toBe(130.95);
    expect(r.raw.ops_frequency).toBeUndefined();
    expect(r.raw.ground_power).toBe('YES');
    expect(r.raw.planned_ground_time).toBe('01:36');
    // The next flight is left undecoded.
    expect(r.remaining.text).toBe('NEXT FLT UA1127/09\nKDEN KSN');
    const gate = r.formatted.items.find((i) => i.code === 'AGATE');
    expect(gate?.label).toBe('Arrival Gate');
    expect(gate?.value).toBe('B47');
    expect(r.formatted.items.find((i) => i.code === 'EON')?.value).toBe(
      '12:08:00',
    );
  });

  test('decodes a tab indented United gate assignment', () => {
    const r = decoder.decode({ label: 'RA', text: UNITED_TABS });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('full');
    expect(r.raw.flight_number).toBe('UA0942');
    expect(r.raw.day).toBe(21);
    expect(r.raw.departure_icao).toBe('KIAD');
    expect(r.raw.arrival_icao).toBe('LPPT');
    expect(r.raw.arrival_gate).toBe('43');
    expect(r.raw.gate_status).toBe('OPEN');
    expect(r.raw.ramp_frequency).toBeUndefined();
    expect(r.raw.ops_frequency).toBe(131.575);
    expect(r.raw.eon_time).toBe(10 * 3600 + 3 * 60);
  });

  test('decodes a United gate change', () => {
    const r = decoder.decode({ label: 'RA', text: UNITED_CHANGE });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('full');
    expect(r.formatted.description).toBe('Gate Change');
    expect(r.raw.departure_icao).toBe('KSTL');
    expect(r.raw.arrival_icao).toBe('KSFO');
    expect(r.raw.arrival_gate).toBe('D7');
    expect(r.raw.ramp_frequency).toBe(119.225);
  });

  test('decodes a Republic arrival gate', () => {
    const r = decoder.decode({ label: 'RA', text: REPUBLIC });
    expect(r.decoded).toBe(true);
    expect(r.decoder.name).toBe('label-ra-gate');
    expect(r.formatted.description).toBe('Arrival Gate');
    expect(r.raw.tail).toBe('N401YX');
    expect(r.raw.flight_number).toBe('YX4450');
    expect(r.raw.departure_iata).toBe('ORD');
    expect(r.raw.arrival_iata).toBe('MSN');
    expect(r.raw.arrival_icao).toBeUndefined();
    expect(r.raw.eta_time).toBe(5 * 3600 + 42 * 60);
    expect(r.raw.arrival_gate).toBe('16');
    expect(r.remaining.text).toBe('AIRCRAFT TURNS TO - YX,NEX');
  });

  test('decodes a SkyWest arrival gate and leaves the next flight', () => {
    const r = decoder.decode({ label: 'RA', text: SKYWEST });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('partial');
    expect(r.raw.arrival_iata).toBe('BFL');
    expect(r.raw.arrival_gate).toBe('4');
    expect(r.raw.departure_iata).toBeUndefined();
    expect(r.raw.flight_number).toBeUndefined();
    expect(r.raw.tail).toBeUndefined();
    expect(r.remaining.text).toContain('NEXT FLIGHT INFORMATION-');
    expect(r.remaining.text).toContain('BFL-SFO');

    const den = decoder.decode({ label: 'RA', text: SKYWEST_DEN });
    expect(den.raw.arrival_iata).toBe('DEN');
    expect(den.raw.arrival_gate).toBe('A28');
  });

  test('does not read Finnair connection gates as an arrival gate', () => {
    const r = plugin.decode({ label: 'RA', text: FINNAIR_CONNECTIONS });
    expect(r.decoded).toBe(false);
    expect(r.raw.arrival_gate).toBeUndefined();
  });

  test('does not decode a United assignment without a gate', () => {
    const r = plugin.decode({
      label: 'RA',
      text: 'QUNDCULUA~1GATE ASSIGN\r\nUA1720/09 KMSP KDEN\r\nSENT: 10:41:16Z\r\nGATE ASSIGN\r\n',
    });
    expect(r.decoded).toBe(false);
  });

  test('ignores other RA text', () => {
    const r = plugin.decode({ label: 'RA', text: 'QUARINCXA~1 ARINC MSG' });
    expect(r.decoded).toBe(false);
    expect(r.decoder.decodeLevel).toBe('none');
  });
});
