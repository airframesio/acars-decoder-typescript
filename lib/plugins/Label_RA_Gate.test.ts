import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_RA_Gate } from './Label_RA_Gate';

// Texts from production RA uplinks (shortened, names removed).
const UNITED_TABS =
  'QUNDCULUA~1GATE ASSIGN\n\tUA0942/21 KIAD LPPT\n\tSENT: 09:14:42Z\n\tGATE 43    OPEN\n\tRAMP FREQ  \n\tOPS FREQ   131.575\n\tEON        1003Z\n\tGROUND PWR AVAIL -NO-\n\t\n\tPLANNED GROUND TIME\n\tIS 02:13\n\tNEXT FLT UA0943/22\n\tLPPT KIAD ETD 1220Z';
const UNITED_PLAIN =
  'QUNDCULUA~1GATE ASSIGN\r\nUA1720/09 KMSP KDEN   \r\nSENT: 10:41:16Z \r\nGATE B47   OPEN\r\nRAMP FREQ  130.950\r\nOPS FREQ   \r\nEON        1208Z\r\nGROUND PWR AVAIL -YES-\r\n\r\nPLANNED GROUND TIME \r\nIS 01:36\r\nNEXT FLT UA1127/09\r\nKDEN KSN';
const UNITED_AVAIL =
  'QUNDCULUA~1GATE ASSIGN\n\tUA1170/21 KLAX PHNL\n\tSENT: 05:36:45Z\n\tGATE G5    AVAIL 06:30\n\tRAMP FREQ  121.9\n\tOPS FREQ   130.300\n\tEON        0639Z\n\tGROUND PWR AVAIL -YES-\n\t\n\tPLANNED GROUND TIME\n\tIS 02:05\n\tNEXT FLT UA1169/21\n\tPHNL KLAX ETD 0850Z';
const UNITED_CHANGE =
  'QUNDCULUA~1GATE CHANGE\r\nUA0214/21 KSTL KSFO\r\nSENT: 05:22:32Z\r\n/////////////////////\r\n**** CREW ALERT ****\r\nGATE ASSIGN\r\n***ACCOMPLISH\r\nTERMINATION CHECKLIST***\r\nGATE D7    OPEN\r\nRAMP FREQ  119.225\r\nOPS FREQ   129.100\r\nEON        0521Z\r\nGROUND PWR AVAIL -YES-\r\n';
const REPUBLIC =
  'QUHDQDDRP~1ARRIVAL GATE\r\nINFORMATION\r\nRPA N401YX YX4450 ORD MSN ETA = 0542 GATE = 16\r\nAIRCRAFT TURNS TO - YX,NEX ,NE-,NE ETD-\r\n\r\nNOTE - NEXT FLT SUBJECT TO CHANGE\r\n';
const REPUBLIC_SUFFIX =
  'QUHDQDDRP~1ARRIVAL GATE\r\nINFORMATION\r\nRPA N211JQ YX5845 BOS PHL ETA = 1454 GATE = D10B\r\nAIRCRAFT TURNS TO - YX5845 PHL-BOS ETD-1610\r\nNOTE - NEXT FLT SUBJECT TO CHANGE\r\n';
const SKYWEST =
  'QUHDQITOO.1ARR GATE INFO   \r\nBFL ARRIVAL GATE 4\r\nNEXT FLIGHT INFORMATION-\r\n** ALL TIMES LOCAL **\r\nAC N939SW\r\n N-A 4634 BFL-SFO 220700\r\nCA X\r\n N-A 4634 BFL-SFO 220700\r\n';
const SKYWEST_SIL =
  'QUSILITOO.1ARR GATE INFO   \r\nORD ARRIVAL GATE B24\r\nNEXT FLIGHT INFORMATION-\r\n** ALL TIMES LOCAL **\r\nAC N964SW\r\n B24 5874 ORD-DSM 221010\r\n';
const SKYWEST_SAME_LINE =
  'QUHDQITOO.1ARR GATE INFO   LAX ARRIVAL GATE 26B\r\n*APU ON AFTER LANDING*\r\nNEXT FLIGHT INFORMATION-\r\n** ALL TIMES LOCAL **\r\nAC N305SY\r\n 26B 3856 LAX-SJC 220735\r\n';
const SKYWEST_NO_GATE =
  'QUHDQITOO.1ARR GATE INFO   \r\nSGU ARRIVAL GATE \r\nNEXT FLIGHT INFORMATION-\r\n** ALL TIMES LOCAL **\r\nAC N961SW\r\n N-A 5050 SGU-SLC 220600\r\n';
const FINNAIR_CONNECTIONS =
  'QUHELASAY~1\r\nCURRENT FLIGHT\r\nFLIGHT  ESTIMATED ARRIVAL TIME\r\nAY1014   EIBT  UTC  \r\n\r\nCONNECTION INFO\r\nFLIGHT DATE     TIME  TO  GATE \r\nAY0957 20261122 09:35 CPH 31\r\n\r\nDECISION          CLASS PAX BAGS\r\nPENDING           Y     3   2      \r\n';

describe('Label RA gate', () => {
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

  test('decodes United gate assignment with tab-indented lines', () => {
    const r = plugin.decode({ label: 'RA', text: UNITED_TABS });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('partial');
    expect(r.formatted.description).toBe('Gate Assignment');
    expect(r.raw.flight_number).toBe('UA0942');
    expect(r.raw.day).toBe(21);
    expect(r.raw.departure_icao).toBe('KIAD');
    expect(r.raw.arrival_icao).toBe('LPPT');
    expect(r.raw.message_timestamp).toBe(9 * 3600 + 14 * 60 + 42);
    expect(r.raw.arrival_gate).toBe('43');
    expect(r.raw.gate_status).toBe('OPEN');
    expect(r.remaining.text).toContain('OPS FREQ   131.575');
    expect(r.remaining.text).not.toContain('GATE 43');
  });

  test('decodes United gate assignment with plain lines', () => {
    const r = plugin.decode({ label: 'RA', text: UNITED_PLAIN });
    expect(r.decoded).toBe(true);
    expect(r.raw.flight_number).toBe('UA1720');
    expect(r.raw.day).toBe(9);
    expect(r.raw.departure_icao).toBe('KMSP');
    expect(r.raw.arrival_icao).toBe('KDEN');
    expect(r.raw.arrival_gate).toBe('B47');
    expect(r.raw.gate_status).toBe('OPEN');
  });

  test('decodes United gate available later', () => {
    const r = plugin.decode({ label: 'RA', text: UNITED_AVAIL });
    expect(r.decoded).toBe(true);
    expect(r.raw.arrival_icao).toBe('PHNL');
    expect(r.raw.arrival_gate).toBe('G5');
    expect(r.raw.gate_status).toBe('AVAIL 06:30');
  });

  test('decodes United gate change, ignoring the crew alert line', () => {
    const r = plugin.decode({ label: 'RA', text: UNITED_CHANGE });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Gate Change');
    expect(r.raw.flight_number).toBe('UA0214');
    expect(r.raw.departure_icao).toBe('KSTL');
    expect(r.raw.arrival_icao).toBe('KSFO');
    expect(r.raw.arrival_gate).toBe('D7');
    expect(r.raw.gate_status).toBe('OPEN');
    expect(r.remaining.text).toContain('GATE ASSIGN');
  });

  test('takes the last gate when a United message names several', () => {
    const text = UNITED_CHANGE.replace(
      'GATE D7    OPEN',
      'GATE D5    OPEN\r\nGATE D7    OPEN',
    );
    const r = plugin.decode({ label: 'RA', text });
    expect(r.raw.arrival_gate).toBe('D7');
    expect(r.remaining.text).toContain('GATE D5');
  });

  test('decodes Republic arrival gate', () => {
    const r = plugin.decode({ label: 'RA', text: REPUBLIC });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('partial');
    expect(r.formatted.description).toBe('Arrival Gate');
    expect(r.raw.tail).toBe('N401YX');
    expect(r.raw.flight_number).toBe('YX4450');
    expect(r.raw.departure_iata).toBe('ORD');
    expect(r.raw.arrival_iata).toBe('MSN');
    expect(r.raw.arrival_icao).toBeUndefined();
    expect(r.raw.eta_time).toBe(5 * 3600 + 42 * 60);
    expect(r.raw.arrival_gate).toBe('16');
    expect(r.remaining.text).toBe(
      'AIRCRAFT TURNS TO - YX,NEX ,NE-,NE ETD-\nNOTE - NEXT FLT SUBJECT TO CHANGE',
    );
  });

  test('decodes Republic gate with a letter suffix', () => {
    const r = plugin.decode({ label: 'RA', text: REPUBLIC_SUFFIX });
    expect(r.raw.arrival_iata).toBe('PHL');
    expect(r.raw.arrival_gate).toBe('D10B');
  });

  test('decodes SkyWest arrival gate, leaving the next flight block', () => {
    const r = plugin.decode({ label: 'RA', text: SKYWEST });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('partial');
    expect(r.formatted.description).toBe('Arrival Gate');
    expect(r.raw.arrival_iata).toBe('BFL');
    expect(r.raw.arrival_gate).toBe('4');
    expect(r.raw.departure_iata).toBeUndefined();
    expect(r.raw.flight_number).toBeUndefined();
    expect(r.raw.tail).toBeUndefined();
    expect(r.remaining.text).toContain('N-A 4634 BFL-SFO 220700');
  });

  test('decodes SkyWest QUSILITOO arrival gate', () => {
    const r = plugin.decode({ label: 'RA', text: SKYWEST_SIL });
    expect(r.raw.arrival_iata).toBe('ORD');
    expect(r.raw.arrival_gate).toBe('B24');
  });

  test('decodes SkyWest arrival gate on the header line', () => {
    const r = plugin.decode({ label: 'RA', text: SKYWEST_SAME_LINE });
    expect(r.decoded).toBe(true);
    expect(r.raw.arrival_iata).toBe('LAX');
    expect(r.raw.arrival_gate).toBe('26B');
    expect(r.remaining.text).toContain('*APU ON AFTER LANDING*');
  });

  test('does not decode SkyWest arrival gate info without a gate', () => {
    const r = plugin.decode({ label: 'RA', text: SKYWEST_NO_GATE });
    expect(r.decoded).toBe(false);
    expect(r.raw.arrival_gate).toBeUndefined();
  });

  test('does not read Finnair connection gates as an arrival gate', () => {
    const r = plugin.decode({ label: 'RA', text: FINNAIR_CONNECTIONS });
    expect(r.decoded).toBe(false);
    expect(r.raw.arrival_gate).toBeUndefined();
  });

  test('is reached through MessageDecoder', () => {
    const r = decoder.decode({ label: 'RA', text: UNITED_TABS });
    expect(r.decoder.name).toBe('label-ra-gate');
    expect(r.raw.arrival_gate).toBe('43');

    const f = decoder.decode({ label: 'RA', text: FINNAIR_CONNECTIONS });
    expect(f.raw.arrival_gate).toBeUndefined();
  });
});
