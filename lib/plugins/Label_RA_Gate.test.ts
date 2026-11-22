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
const AMERICAN =
  'QUTULYVAA010170FTM\n\tFLT 0170/22 HND-LAX\n\tGATE 153 AVAILABILITY PLN ETA 0534\n\tGATE OPEN\n\tNEXT FLT 0027 ACFT 8LM SKD 0950 HND';
const GOJET = 'QUSTLAVG7~1GATE INFO\r\nFLT 4542 PWM-IAD\r\nGATE C22\r\n';
const PIEDMONT =
  'QUSBYDDPT~1FLT 5966 SYR-PHL\rGATE F37 ETA 707L\rTURN\r\nFLT 5799 ORF DEP 840L MOGT\r\n';
const AIR_WISCONSIN = 'FLT 4940 IAD GATE A4C\r\n';
const FRONTIER =
  'QUANPOCF9~1\r\nFROM PHL OPS\r\n\r\nETA 1233\r\nWHEELCHAIRS 2\r\nGATE  E8\r\nGATE AVAIL AT ARRIVAL  Y\r\nGND PWR  Y\r\nNEXT FLIGHT  2507\r\nNEXT DEST  MCO\r\n';
const WESTJET = 'WS 345 YXE-YYC\r\n\r\nYYC GATE D80/OPS';
const WESTJET_CHANGE =
  '///GATECHANGE///\r\n\r\nWS 736 YVR-YYZ\r\n\r\nARR GATE IS NOW C26/OPS';
const SHANDONG =
  'QUTAOUOSC~10000\r\n\tCURRENT FLIGHT:\r\n\tSC8402 ARR:ZSJN\r\n\tGATE:10\r\n\tWEATHER:\r\n';
const LATAM =
  'QUSCLASLA~1\r\n\r\nGATE ASSIGNMENT\r\n\r\n\r\n\r\nPPOS:602L\r\n\r\nBAG BELT:\r\n\r\nNEXT LEG: LA8142 GRU-AEP 22NOV 14:05Z';
const LATAM_NO_POSITION =
  'QUSCLASLA~1\r\n\tGATE ASSIGNMENT\r\n\t\r\n\tPPOS:N/A\r\n\tBAG BELT:\r\n\tNEXT LEG: LA3091 FLN-CGH 22NOV 11:35Z';
// The crew list that follows in production carries names: not kept here.
const DELTA =
  '48   ATLE15\r\nCREW P/F        \r\nPART  1 OF  1 \r\nFLT 1160 - 22NOV1213 CREW P/F        \r\nARR ATL GTE E15\r\nFLT 1941 PVR 1025L\r\n                     NXT  DEPT  DEPT    \r\n NAME                FLT  TIME  FROM GTE\r\n';
const TURKISH =
  'QUISTBITK~1\r\n- EXPECTED PARKING POSITION: F8R\r\n- NEXT FLIGHT INFO:IST/PRG TK1769 14:45Z\r\n';
const FINNAIR_STAND =
  'QUHELASAY~1\r\nAY1074 22NOV26\r\nARRIVING STAND 131 ELDT 12:53\r\nOHATR->AY1101 23NOV26 ETD - (STD 05:45)\r\n';
const FINNAIR_DELAY =
  'QUHELASAY~1\r\nDELAY SUMMARY\r\nAY818/21NOV2026 ARN-HEL\r\nSTD 20:05\r\nATD 21:19\r\n';
const PARKING_PREASSIGNED =
  'QUCANXMCZ~1RA221348\r\n\tB-309Y\r\n\tPARKING PREASSIGNED:138\r\n\tMETAR ZYTX 221330Z 19007MPS 9999 OVC040 04/M03 Q1020 NOSIG=\r\n';
const PARKING_NA = 'QUCANXMCZ~1RA221348\r\n\tPARKING ASSIGNED:NA\r\n';

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
    expect(r.raw.ramp_frequency).toBeUndefined();
    expect(r.raw.ops_frequency).toBe(131.575);
    expect(r.raw.eon_time).toBe(10 * 3600 + 3 * 60);
    expect(r.raw.ground_power).toBe('NO');
    expect(r.raw.planned_ground_time).toBe('02:13');
    // Only the next flight block is left.
    expect(r.remaining.text).toBe('NEXT FLT UA0943/22\nLPPT KIAD ETD 1220Z');
    expect(r.formatted.items.find((i) => i.code === 'EON')?.value).toBe(
      '10:03:00',
    );
    expect(r.formatted.items.find((i) => i.code === 'OPSFREQ')?.value).toBe(
      '131.575 MHz',
    );
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
    expect(r.raw.ramp_frequency).toBe(130.95);
    expect(r.raw.ops_frequency).toBeUndefined();
    expect(r.raw.eon_time).toBe(12 * 3600 + 8 * 60);
    expect(r.raw.ground_power).toBe('YES');
    expect(r.raw.planned_ground_time).toBe('01:36');
    expect(r.remaining.text).toBe('NEXT FLT UA1127/09\nKDEN KSN');
  });

  test('does not take a gate from the United next flight block', () => {
    const r = plugin.decode({
      label: 'RA',
      text: UNITED_PLAIN.replace('KDEN KSN', 'KDEN KSNA\r\nGATE C12   OPEN'),
    });
    expect(r.raw.arrival_gate).toBe('B47');
    expect(r.remaining.text).toBe(
      'NEXT FLT UA1127/09\nKDEN KSNA\nGATE C12   OPEN',
    );
  });

  test('decodes United gate available later', () => {
    const r = plugin.decode({ label: 'RA', text: UNITED_AVAIL });
    expect(r.decoded).toBe(true);
    expect(r.raw.arrival_icao).toBe('PHNL');
    expect(r.raw.arrival_gate).toBe('G5');
    expect(r.raw.gate_status).toBe('AVAIL 06:30');
    expect(r.raw.ramp_frequency).toBe(121.9);
    expect(r.raw.ops_frequency).toBe(130.3);
    expect(r.raw.eon_time).toBe(6 * 3600 + 39 * 60);
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

  test('decodes American route and gate, tab indented', () => {
    const r = plugin.decode({ label: 'RA', text: AMERICAN });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Arrival Gate');
    expect(r.raw.flight_number).toBe('0170');
    expect(r.raw.day).toBe(22);
    expect(r.raw.departure_iata).toBe('HND');
    expect(r.raw.arrival_iata).toBe('LAX');
    expect(r.raw.arrival_gate).toBe('153');
    expect(r.remaining.text).toBe(
      'QUTULYVAA010170FTM\nAVAILABILITY PLN ETA 0534\nGATE OPEN\nNEXT FLT 0027 ACFT 8LM SKD 0950 HND',
    );
  });

  test('decodes GoJet route and gate after a header line', () => {
    const r = plugin.decode({ label: 'RA', text: GOJET });
    expect(r.raw.flight_number).toBe('4542');
    expect(r.raw.arrival_iata).toBe('IAD');
    expect(r.raw.arrival_gate).toBe('C22');
    expect(r.remaining.text).toBe('QUSTLAVG7~1GATE INFO');
  });

  test('decodes Piedmont gate run into the route line', () => {
    const r = plugin.decode({ label: 'RA', text: PIEDMONT });
    expect(r.raw.flight_number).toBe('5966');
    expect(r.raw.departure_iata).toBe('SYR');
    expect(r.raw.arrival_iata).toBe('PHL');
    expect(r.raw.arrival_gate).toBe('F37');
    expect(r.remaining.text).toContain('FLT 5799 ORF DEP 840L MOGT');
  });

  test('decodes Air Wisconsin flight, airport and gate', () => {
    const r = plugin.decode({ label: 'RA', text: AIR_WISCONSIN });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('full');
    expect(r.raw.flight_number).toBe('4940');
    expect(r.raw.arrival_iata).toBe('IAD');
    expect(r.raw.arrival_gate).toBe('A4C');
  });

  test('decodes Frontier ops gate, not the next flight', () => {
    const r = plugin.decode({ label: 'RA', text: FRONTIER });
    expect(r.decoded).toBe(true);
    expect(r.raw.arrival_iata).toBe('PHL');
    expect(r.raw.arrival_gate).toBe('E8');
    expect(r.remaining.text).toContain('GATE AVAIL AT ARRIVAL  Y');
    expect(r.remaining.text).toContain('NEXT FLIGHT  2507');
  });

  test('decodes WestJet ops gate', () => {
    const r = plugin.decode({ label: 'RA', text: WESTJET });
    expect(r.decoded).toBe(true);
    expect(r.raw.flight_number).toBe('WS345');
    expect(r.raw.departure_iata).toBe('YXE');
    expect(r.raw.arrival_iata).toBe('YYC');
    expect(r.raw.arrival_gate).toBe('D80');
  });

  test('decodes WestJet arrival gate change at the destination', () => {
    const r = plugin.decode({ label: 'RA', text: WESTJET_CHANGE });
    expect(r.raw.flight_number).toBe('WS736');
    expect(r.raw.arrival_iata).toBe('YYZ');
    expect(r.raw.arrival_gate).toBe('C26');
    expect(r.remaining.text).toBe('///GATECHANGE///');
  });

  test('decodes current flight ICAO arrival and gate', () => {
    const r = plugin.decode({ label: 'RA', text: SHANDONG });
    expect(r.decoded).toBe(true);
    expect(r.raw.flight_number).toBe('SC8402');
    expect(r.raw.arrival_icao).toBe('ZSJN');
    expect(r.raw.arrival_gate).toBe('10');
    expect(r.remaining.text).toBe('QUTAOUOSC~10000\nWEATHER:');
  });

  test('decodes LATAM parking position, not the next leg', () => {
    const r = plugin.decode({ label: 'RA', text: LATAM });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Gate Assignment');
    expect(r.raw.arrival_gate).toBe('602L');
    expect(r.remaining.text).toContain('NEXT LEG: LA8142 GRU-AEP');
  });

  test('does not decode LATAM gate assignment without a position', () => {
    const r = plugin.decode({ label: 'RA', text: LATAM_NO_POSITION });
    expect(r.decoded).toBe(false);
    expect(r.raw.arrival_gate).toBeUndefined();
  });

  test('decodes Delta crew P/F arrival gate', () => {
    const r = plugin.decode({ label: 'RA', text: DELTA });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Crew P/F Report');
    expect(r.raw.arrival_iata).toBe('ATL');
    expect(r.raw.arrival_gate).toBe('E15');
    expect(r.remaining.text).toContain('FLT 1941 PVR 1025L');
  });

  test('decodes Turkish expected parking position', () => {
    const r = plugin.decode({ label: 'RA', text: TURKISH });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Parking Position');
    expect(r.raw.arrival_gate).toBe('F8R');
    expect(r.remaining.text).toContain('- NEXT FLIGHT INFO');
  });

  test('decodes preassigned parking', () => {
    const r = plugin.decode({ label: 'RA', text: PARKING_PREASSIGNED });
    expect(r.decoded).toBe(true);
    expect(r.raw.arrival_gate).toBe('138');
  });

  test('does not decode parking that is not assigned', () => {
    const r = plugin.decode({ label: 'RA', text: PARKING_NA });
    expect(r.decoded).toBe(false);
  });

  test('decodes Finnair arriving stand', () => {
    const r = plugin.decode({ label: 'RA', text: FINNAIR_STAND });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Arrival Stand');
    expect(r.raw.flight_number).toBe('AY1074');
    expect(r.raw.day).toBe(22);
    expect(r.raw.arrival_gate).toBe('131');
    expect(r.remaining.text).toBe(
      'QUHELASAY~1\nELDT 12:53\nOHATR->AY1101 23NOV26 ETD - (STD 05:45)',
    );
  });

  test('does not decode a Finnair delay summary', () => {
    const r = plugin.decode({ label: 'RA', text: FINNAIR_DELAY });
    expect(r.decoded).toBe(false);
  });

  test('is reached through MessageDecoder', () => {
    const r = decoder.decode({ label: 'RA', text: UNITED_TABS });
    expect(r.decoder.name).toBe('label-ra-gate');
    expect(r.raw.arrival_gate).toBe('43');

    const f = decoder.decode({ label: 'RA', text: FINNAIR_CONNECTIONS });
    expect(f.raw.arrival_gate).toBeUndefined();
  });
});
