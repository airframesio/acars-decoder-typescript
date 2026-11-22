import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_Gate_Report } from './Label_Gate_Report';

// Texts from production messages (shortened, names removed).
const AMERICAN_AVAILABILITY =
  'FLT 1658/22 AUS-DFW\r\nGATE D21 AVAILABILITY PLN ETA 0721\r\nGATE OCCUPIED ACFT 3LM SKD 0700\r\nNEXT FLT 0602 ACFT 3JF SKD 0900 GRR\r\n\r\nAUTOMATED FLIGHT INFORMATION';
const AMERICAN_SERVICES =
  'FLT 1658/22 AUS-DFW\r\n\r\nGATE D21 PCA Y ELEC Y DGS Y  \r\n                         \r\nCREW CONNECTING GATE INFO\r\nCREW SEAT FLT DEST GATE TIME\r\nC F       0389MEX  A14  0837\r\nEND';
const AMERICAN_NEW_GATE =
  'FLT 2857 DFW-DCA \r\nNEW ARRIVAL GATE NBR IS  C33 \r\n ';
const AMERICAN_C1 =
  '.TULYVAA 220939\r\nAGM\r\nAN N758AN/FI AA0174/GL LGW\r\n- FLT 0174 RDU-LHR \r\nNEW ARRIVAL GATE NBR IS  320 \r\n \r\n';
const ENVOY_PCA =
  'FLT 4258/22 HPN-DCA  BAG 9   \r\n \r\nGATE D43APCA Y ELEC Y DGS Y  \r\n                         \r\nCREW CONNECTING GATE INFO\r\nCREW SEAT FLT DEST GATE TIME\r\nC F 1 2   4252VPS  D35  1012\r\nEND';
const ENVOY_ARRIVING =
  'FLT 4258   ARRIVING DCA \r\nARRIVAL GATE D43A  BAG CLAIM AREA 9   \r\nCONNECTING GATE INFORMATION\r\nDESTINATION      DESTINATION      GATE  \r\nDALLAS/FT WORTH  ................ C32 AA\r\nEND';
const PSA =
  'FLT 5106 DTW-PHL\r\nGATE F18 ETA 0743L \r\nTURN FLT 5636 DTW DEP 0835L\r\nFREQ=130.100 PWR=Y AIR=Y DOC=N\r\n';
const HAWAIIAN_ARR =
  'ARR GATE MSG   \r\n804 ARR GATE 69A\r\nGND PWR AVL - YES\r\nPARKING LINE - 69A\r\nNXT FLT 0801\r\nDST HNL\r\n';
const HAWAIIAN_AT_GATE =
  'HA0805 AT GATE A6\r\nSHUT DOWN APU\r\nONCE PWR AVAIL.';
const JETBLUE =
  'INR,221156,  GATE:514\r\nCAROUSEL:3\r\nAC TURN: PUJ ON TIME   0959L\r\nCREW CONNECTIONS\r\n X\r\n   -BUF F:0802 ON TIME  1029L G:516\r\n';
const JETBLUE_OWN_LINE =
  'INR,221235\r\n\r\nGATE:A1\r\nCAROUSEL: N/A\r\nAC TURN: BOS ON TIME   0940L\r\n';
const JETSTAR =
  '.MELOJJQ 221217 \r\nAGM\r\nAN VH-VGO/MA 727A\r\n-  /\r\nACK RCPT OF TAC MSG.\r\nARRIVAL GATE THIS FLT:43\r\nARRIVAL REMARKS      :N/A\r\n';
const JETSTAR_CHANGE =
  '.MELOJJQ 221152 \r\n\r\nAGM\r\n\r\nAN VH-VGN/MA 708A\r\n\r\n-  /\r\n\r\nVH-VGN   \r\n\r\nJQ782/22 Nov MEL-ADL\r\n\r\nGATE CHANGE MESSAGE - ARRIVAL\r\n\r\nPREVIOUS GATE: 25\r\n\r\nNEW GATE: 23\r\n\r\nGPU AVAILABLE';
const JAZZ =
  '.YHZITQK 221242\r\n\r\nAGM\r\n\r\nAN CGJUZ/MA 429I\r\n\r\n-  JZA GATE DATA UPLINK\r\n\r\n----\r\n\r\nFLIGHT: 8063/22Nov26/YYC/YVR\r\n\r\nPLANNED ARRIVAL GATE IS C42\r\n';
const ALASKA =
  ',,1\r\nGATE UPDATE\r\nGATE CHANGE IN LAX\r\nAS1636\r\nNEW GATE: 210A\r\n\r\n';
const PSA_ACK = '/ACKFLT GATE F1';
const JAZZ_FLIGHT_DATA =
  '.YHZITQK 220419\r\nAGM\r\nAN CGJUZ/MA 395I\r\n-  DFR FLT 8074\r\n----\r\nFIN 726/CGJUZ/CRA\r\nDEP YVR/06:20Z/GTE C40\r\nARR YYC/07:48Z/GTE A17\r\nPAX 46/PAD 8/FUEL \r\n';
// The crew list that follows in production carries names: not kept here.
const DELTA_25 =
  '48   JFKB22\r\nCREW P/F        \r\nPART  1 OF  1 \r\nFLT 0028 - 22NOV1236 CREW P/F        \r\nARR JFK GTE B22\r\n';
const VIRGIN_AUSTRALIA = 'VA1007, BAY: 45A\r\nGPU: NO\r\nPCA: \r\n';

describe('Label gate report', () => {
  let decoder: MessageDecoder;
  let plugin: Label_Gate_Report;

  beforeEach(() => {
    decoder = new MessageDecoder();
    plugin = new Label_Gate_Report(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-gate-report');
    expect(plugin.qualifiers()).toEqual({
      labels: [
        '40',
        '41',
        '42',
        'C1',
        '21',
        '3T',
        '5Z',
        '25',
        '3M',
        '3E',
        'HX',
        '32',
        '33',
        '48',
      ],
    });
  });

  test('decodes American route and gate availability', () => {
    const r = plugin.decode({ label: '40', text: AMERICAN_AVAILABILITY });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('partial');
    expect(r.formatted.description).toBe('Arrival Gate');
    expect(r.raw.flight_number).toBe('1658');
    expect(r.raw.day).toBe(22);
    expect(r.raw.departure_iata).toBe('AUS');
    expect(r.raw.arrival_iata).toBe('DFW');
    expect(r.raw.arrival_gate).toBe('D21');
    expect(r.remaining.text).toBe(
      'AVAILABILITY PLN ETA 0721\nGATE OCCUPIED ACFT 3LM SKD 0700\nNEXT FLT 0602 ACFT 3JF SKD 0900 GRR\nAUTOMATED FLIGHT INFORMATION',
    );
  });

  test('decodes American gate services, not the crew connection gates', () => {
    const r = plugin.decode({ label: '40', text: AMERICAN_SERVICES });
    expect(r.raw.arrival_gate).toBe('D21');
    expect(r.remaining.text).toContain('PCA Y ELEC Y DGS Y');
    expect(r.remaining.text).toContain('0389MEX  A14');
  });

  test('decodes American new arrival gate', () => {
    const r = plugin.decode({ label: '40', text: AMERICAN_NEW_GATE });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('full');
    expect(r.formatted.description).toBe('Arrival Gate Change');
    expect(r.raw.flight_number).toBe('2857');
    expect(r.raw.arrival_iata).toBe('DCA');
    expect(r.raw.arrival_gate).toBe('C33');
  });

  test('decodes American on label C1 with its AGM header', () => {
    const r = plugin.decode({ label: 'C1', text: AMERICAN_C1 });
    expect(r.decoded).toBe(true);
    expect(r.raw.ground_address).toBe('TULYVAA');
    expect(r.raw.tail).toBe('N758AN');
    // The header's flight number, not the route line's again.
    expect(r.raw.flight_number).toBe('AA0174');
    expect(r.formatted.items.filter((i) => i.code === 'FLIGHT')).toHaveLength(
      1,
    );
    expect(r.raw.departure_iata).toBe('RDU');
    expect(r.raw.arrival_iata).toBe('LHR');
    expect(r.raw.arrival_gate).toBe('320');
  });

  test('decodes Envoy gate run into PCA', () => {
    const r = plugin.decode({ label: '40', text: ENVOY_PCA });
    expect(r.raw.flight_number).toBe('4258');
    expect(r.raw.arrival_iata).toBe('DCA');
    expect(r.raw.arrival_gate).toBe('D43A');
    expect(r.remaining.text).toMatch(/^BAG 9\nPCA Y ELEC Y DGS Y\n/);
  });

  test('decodes Envoy arriving', () => {
    const r = plugin.decode({ label: '40', text: ENVOY_ARRIVING });
    expect(r.decoded).toBe(true);
    expect(r.raw.flight_number).toBe('4258');
    expect(r.raw.arrival_iata).toBe('DCA');
    expect(r.raw.departure_iata).toBeUndefined();
    expect(r.raw.arrival_gate).toBe('D43A');
    expect(r.remaining.text).toMatch(/^BAG CLAIM AREA 9\n/);
  });

  test('decodes PSA on label 41', () => {
    const r = plugin.decode({ label: '41', text: PSA });
    expect(r.raw.flight_number).toBe('5106');
    expect(r.raw.arrival_iata).toBe('PHL');
    expect(r.raw.arrival_gate).toBe('F18');
  });

  test('decodes Hawaiian arrival gate on label 3T', () => {
    const r = plugin.decode({ label: '3T', text: HAWAIIAN_ARR });
    expect(r.decoded).toBe(true);
    expect(r.raw.flight_number).toBe('804');
    expect(r.raw.arrival_gate).toBe('69A');
    expect(r.remaining.text).toMatch(/^GND PWR AVL - YES\n/);
  });

  test('decodes Hawaiian at gate on label 40', () => {
    const r = plugin.decode({ label: '40', text: HAWAIIAN_AT_GATE });
    expect(r.raw.flight_number).toBe('HA0805');
    expect(r.raw.arrival_gate).toBe('A6');
  });

  test('decodes JetBlue in range, not the crew connection gate', () => {
    const r = plugin.decode({ label: '41', text: JETBLUE });
    expect(r.decoded).toBe(true);
    expect(r.raw.arrival_gate).toBe('514');
    expect(r.remaining.text).toMatch(/^INR,221156,\nCAROUSEL:3\n/);
  });

  test('decodes JetBlue gate on its own line', () => {
    const r = plugin.decode({ label: '42', text: JETBLUE_OWN_LINE });
    expect(r.raw.arrival_gate).toBe('A1');
  });

  test('decodes Jetstar arrival gate', () => {
    const r = plugin.decode({ label: 'C1', text: JETSTAR });
    expect(r.decoded).toBe(true);
    expect(r.raw.arrival_gate).toBe('43');
    expect(r.remaining.text).toContain('ACK RCPT OF TAC MSG.');
  });

  test('decodes Jetstar gate change', () => {
    const r = plugin.decode({ label: 'C1', text: JETSTAR_CHANGE });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Arrival Gate Change');
    expect(r.raw.flight_number).toBe('JQ782');
    expect(r.raw.day).toBe(22);
    expect(r.raw.departure_iata).toBe('MEL');
    expect(r.raw.arrival_iata).toBe('ADL');
    expect(r.raw.arrival_gate).toBe('23');
    expect(r.remaining.text).toContain('PREVIOUS GATE: 25');
  });

  test('decodes Jazz gate data', () => {
    const r = plugin.decode({ label: 'C1', text: JAZZ });
    expect(r.decoded).toBe(true);
    expect(r.raw.flight_number).toBe('8063');
    expect(r.raw.day).toBe(22);
    expect(r.raw.departure_iata).toBe('YYC');
    expect(r.raw.arrival_iata).toBe('YVR');
    expect(r.raw.arrival_gate).toBe('C42');
  });

  test('decodes Alaska gate change', () => {
    const r = plugin.decode({ label: '21', text: ALASKA });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Arrival Gate Change');
    expect(r.raw.flight_number).toBe('AS1636');
    expect(r.raw.arrival_iata).toBe('LAX');
    expect(r.raw.arrival_gate).toBe('210A');
    expect(r.remaining.text).toBe(',,1\nGATE UPDATE');
  });

  test('decodes PSA crew gate acknowledgement on label 5Z', () => {
    const r = plugin.decode({ label: '5Z', text: PSA_ACK });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('full');
    expect(r.raw.arrival_gate).toBe('F1');
  });

  test('decodes Jazz flight data departure and arrival gates', () => {
    const r = plugin.decode({ label: 'C1', text: JAZZ_FLIGHT_DATA });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Flight Data');
    expect(r.raw.tail).toBe('CGJUZ');
    expect(r.raw.departure_iata).toBe('YVR');
    expect(r.raw.departure_gate).toBe('C40');
    expect(r.raw.arrival_iata).toBe('YYC');
    expect(r.raw.arrival_gate).toBe('A17');
    expect(r.remaining.text).toContain('PAX 46/PAD 8/FUEL');
  });

  test('decodes Delta crew P/F arrival gate on label 25', () => {
    const r = plugin.decode({ label: '25', text: DELTA_25 });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Crew P/F Report');
    expect(r.raw.arrival_iata).toBe('JFK');
    expect(r.raw.arrival_gate).toBe('B22');
  });

  test('decodes Virgin Australia bay on label 3M', () => {
    const r = plugin.decode({ label: '3M', text: VIRGIN_AUSTRALIA });
    expect(r.decoded).toBe(true);
    expect(r.raw.flight_number).toBe('VA1007');
    expect(r.raw.arrival_gate).toBe('45A');
    expect(r.remaining.text).toBe('GPU: NO\nPCA:');
  });

  test.each([
    [
      'gate status only, gate in the next flight block',
      '40',
      'FLT 0278/21 PHL-EDI\r\nGATE STATUS NOT AVAIL\r\nNEXT FLT 0602 ACFT 3JF SKD 0900 GRR\r\nGATE B12\r\n',
    ],
    [
      'crew connection gates only',
      '40',
      'FLT 4258/22 HPN-DCA\r\nCREW CONNECTING GATE INFO\r\nCREW SEAT FLT DEST GATE TIME\r\nGATE D35\r\n',
    ],
    [
      'JetBlue crew connection gate',
      '41',
      'INR,221156\r\nCAROUSEL:3\r\nCREW CONNECTIONS\r\n X\r\n   -BUF F:0802 ON TIME  1029L G:516\r\n',
    ],
    ['PSA acknowledgement without a gate', '5Z', '/ACKFLT GATE E'],
    ['gate request downlink', '5Z', '/C3 GATE REQ       / KAUS KIAH\r\n'],
    ['Hawaiian format on another label', '40', HAWAIIAN_ARR],
    ['JetBlue format on another label', '40', JETBLUE],
    ['Delta gate line outside a crew P/F message', '25', 'ARR JFK GTE B22\r\n'],
  ])('does not decode %s', (_name, label, text) => {
    const r = plugin.decode({ label, text });
    expect(r.decoded).toBe(false);
    expect(r.raw.arrival_gate).toBeUndefined();
  });

  test('is reached through MessageDecoder after the other plugins', () => {
    for (const [label, text, gate] of [
      ['40', AMERICAN_AVAILABILITY, 'D21'],
      ['40', HAWAIIAN_AT_GATE, 'A6'],
      ['41', JETBLUE, '514'],
      ['42', JETBLUE_OWN_LINE, 'A1'],
      ['C1', AMERICAN_C1, '320'],
      ['C1', JETSTAR, '43'],
      ['C1', JAZZ, 'C42'],
      ['21', ALASKA, '210A'],
      ['3T', HAWAIIAN_ARR, '69A'],
      ['5Z', PSA_ACK, 'F1'],
      ['C1', JAZZ_FLIGHT_DATA, 'A17'],
      ['25', DELTA_25, 'B22'],
      ['3M', VIRGIN_AUSTRALIA, '45A'],
    ]) {
      const r = decoder.decode({ label, text });
      expect(r.decoder.name).toBe('label-gate-report');
      expect(r.raw.arrival_gate).toBe(gate);
    }
    // The route format is tied to the labels it was seen on.
    const h1 = decoder.decode({
      label: 'H1',
      text: 'FLT 1658/22 AUS-DFW\r\nGATE D21\r\n',
    });
    expect(h1.raw.arrival_gate).toBeUndefined();
  });
});

// Texts from production messages of 2026-11-19 (shortened, names removed).
const FINNAIR_3E = 'AY1074 22NOV26\r\nARRIVING STAND 131 ELDT 12:53\r\n';
// The crew list that follows in production carries names: not kept here.
const DELTA_HX =
  'RA IV3 48   DTWA67\r\nCREW P/F        \r\nPART  1 OF  1 \r\nFLT 1849 - 19NOV0102 CREW P/F        \r\nARR DTW GTE A67\r\n';
const WESTJET_ENCORE = 'FTX01,WS 3564 YVR-YLW\r\nYLW GATE 9/OPS';
const ALASKA_ETA_ACK =
  ',,\r\nETA ACK\r\nFROM:LAX OPS\r\nAS1831\r\nETA:0057\r\nARRIVAL GATE:65B \r\nEXT ELECT AVAIL W/INTERLOCK\r\nNEXT FLT:1397 PDX \r\n';
const SAS =
  '.HDQBQSK 191354\r\n\tAGM\r\n\tAN LN-RKS/FI SK932/MA 767I\r\n\tATT SK0932  ETA: 1414  GATE: C33   TERM: 3    BC: \r\n\tCONNECTIONS\r\n\t -VIE SK1693 0755  B9   3   Vienna\r\n';
const EDELWEISS =
  'STA/ETA  1135LT\r\nARR TERM 2 BY BUS\r\nARR GATE GRZ\r\nARR POS  D12\r\nBAG BELT 21\r\nCONNECTING GATE INFO 19NOV1004Z\r\n       1220 B10 LX1270 Copenhagen\r\n';
const SWISS = 'ARR GATE A52\r\nARR POS  A52\r\n';
const VIRGIN_ARR_BAY = 'VA1007, ARR BAY: 45A\r\n';
// Not this flight's gate, or not a gate.
const JAZZ_NEXT_FLIGHT =
  '.YHZITQK 190005\r\nAGM\r\nAN CFCJZ/MA 988I\r\n-  NEXT FLIGHT INFORMATION\r\nFLT: 8908\r\nDES: YYZ\r\nGATE:E02\r\n';
const AIR_CANADA_4C = '-GTE C001  C47 \r\n';
const CREW_FREE_TEXT =
  'FTX01.OPC\r\nHI STAND PLANNING. WE\r\nHAVE STAND 515 BUT A/C\r\n';

describe('Label gate report, round 5 formats', () => {
  let decoder: MessageDecoder;
  let plugin: Label_Gate_Report;

  beforeEach(() => {
    decoder = new MessageDecoder();
    plugin = new Label_Gate_Report(decoder);
  });

  test('decodes the Finnair arriving stand on label 3E', () => {
    const r = plugin.decode({ label: '3E', text: FINNAIR_3E });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Arrival Stand');
    expect(r.raw.flight_number).toBe('AY1074');
    expect(r.raw.day).toBe(22);
    expect(r.raw.arrival_gate).toBe('131');
    expect(r.remaining.text).toBe('ELDT 12:53');
  });

  test('decodes Delta crew P/F arrival gate on label HX', () => {
    const r = plugin.decode({ label: 'HX', text: DELTA_HX });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Crew P/F Report');
    expect(r.raw.arrival_iata).toBe('DTW');
    expect(r.raw.arrival_gate).toBe('A67');
  });

  test('decodes WestJet Encore on label 41', () => {
    const r = plugin.decode({ label: '41', text: WESTJET_ENCORE });
    expect(r.decoded).toBe(true);
    expect(r.decoder.decodeLevel).toBe('full');
    expect(r.raw.flight_number).toBe('WS3564');
    expect(r.raw.departure_iata).toBe('YVR');
    expect(r.raw.arrival_iata).toBe('YLW');
    expect(r.raw.arrival_gate).toBe('9');
  });

  test('decodes the Alaska ETA acknowledgement, not the next flight', () => {
    const r = plugin.decode({ label: '21', text: ALASKA_ETA_ACK });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('ETA Acknowledgement');
    expect(r.raw.flight_number).toBe('AS1831');
    expect(r.raw.arrival_iata).toBe('LAX');
    expect(r.raw.arrival_gate).toBe('65B');
    expect(r.remaining.text).toContain('NEXT FLT:1397 PDX');
  });

  test('decodes SAS passenger info', () => {
    const r = plugin.decode({ label: 'C1', text: SAS });
    expect(r.decoded).toBe(true);
    expect(r.formatted.description).toBe('Passenger Information');
    expect(r.raw.arrival_gate).toBe('C33');
    expect(r.remaining.text).toContain('-VIE SK1693 0755  B9   3   Vienna');
  });

  test('decodes the Edelweiss arrival position when the gate is a bus', () => {
    const r = plugin.decode({ label: '32', text: EDELWEISS });
    expect(r.decoded).toBe(true);
    expect(r.raw.arrival_gate).toBe('D12');
    expect(r.remaining.text).toContain('1220 B10 LX1270 Copenhagen');
  });

  test('decodes the Swiss arrival gate before the position', () => {
    const r = plugin.decode({ label: '32', text: SWISS });
    expect(r.raw.arrival_gate).toBe('A52');
    expect(r.remaining.text).toBe('ARR POS  A52');
  });

  test('decodes the Virgin Australia arrival bay', () => {
    const r = plugin.decode({ label: '3M', text: VIRGIN_ARR_BAY });
    expect(r.raw.flight_number).toBe('VA1007');
    expect(r.raw.arrival_gate).toBe('45A');
  });

  test('does not read the Jazz next flight gate', () => {
    const r = plugin.decode({ label: 'C1', text: JAZZ_NEXT_FLIGHT });
    expect(r.decoded).toBe(false);
  });

  test('does not read other formats', () => {
    for (const [label, text] of [
      ['4C', AIR_CANADA_4C],
      ['10', CREW_FREE_TEXT],
    ]) {
      const r = decoder.decode({ label, text });
      expect(r.raw.arrival_gate).toBeUndefined();
      expect(r.raw.departure_gate).toBeUndefined();
    }
    const j = decoder.decode({ label: 'C1', text: JAZZ_NEXT_FLIGHT });
    expect(j.raw.arrival_gate).toBeUndefined();
  });

  test('is reached through MessageDecoder after the other plugins', () => {
    for (const [label, text, gate] of [
      ['3E', FINNAIR_3E, '131'],
      ['HX', DELTA_HX, 'A67'],
      ['41', WESTJET_ENCORE, '9'],
      ['21', ALASKA_ETA_ACK, '65B'],
      ['C1', SAS, 'C33'],
      ['32', EDELWEISS, 'D12'],
      ['32', SWISS, 'A52'],
      ['3M', VIRGIN_ARR_BAY, '45A'],
    ]) {
      const r = decoder.decode({ label, text });
      expect(r.decoder.name).toBe('label-gate-report');
      expect(r.raw.arrival_gate).toBe(gate);
    }
  });
});

// Texts from production messages of 2026-11-17 (shortened, names removed).
const KLM =
  'P64AMSKWKL170542\r\nCONNECTION INFO.\r\nKL 1750 \r\nALL TIMES LOCAL\r\nGATE  A04  POS  A62 \r\nSCHED 0715 ETA  0715\r\nNXM   KL 1771  17NOV 0805  B30 A62\r\n';
const KLM_NEXT_FLIGHT_ONLY =
  'P64AMSKWKL170542\r\nCONNECTION INFO.\r\nKL 1750 \r\nNXM   KL 1771  17NOV 0805  B30 A62\r\nGATE  B30  POS  A62\r\n';
const KOREAN = 'SPOT NO : 606\r\n';
const AER_LINGUS =
  'FLIGHT NUMBER = EI0122\r\n\tDATE = 17 NOV\r\n\tTIME = 0334\r\n\tTAIL = EI-FNH\r\n\tSTAND INFO = 400C\r\n';

describe('Label gate report, round 6 formats', () => {
  let decoder: MessageDecoder;
  let plugin: Label_Gate_Report;

  beforeEach(() => {
    decoder = new MessageDecoder();
    plugin = new Label_Gate_Report(decoder);
  });

  test('decodes KLM connection info gate at AMS', () => {
    const r = plugin.decode({ label: '32', text: KLM });
    expect(r.decoded).toBe(true);
    expect(r.raw.flight_number).toBe('KL1750');
    expect(r.raw.arrival_iata).toBe('AMS');
    expect(r.raw.arrival_gate).toBe('A04');
    expect(r.remaining.text).toContain('POS A62');
    expect(r.remaining.text).toContain('NXM   KL 1771  17NOV 0805  B30 A62');
  });

  test('does not read the KLM next flight gate', () => {
    const r = plugin.decode({ label: '32', text: KLM_NEXT_FLIGHT_ONLY });
    expect(r.decoded).toBe(false);
  });

  test('decodes the Korean Air spot on label 33', () => {
    const r = plugin.decode({ label: '33', text: KOREAN });
    expect(r.raw.arrival_gate).toBe('606');
  });

  test('decodes the Aer Lingus stand on label 48', () => {
    const r = plugin.decode({ label: '48', text: AER_LINGUS });
    expect(r.raw.arrival_gate).toBe('400C');
  });

  test('is reached through MessageDecoder after the other plugins', () => {
    for (const [label, text, gate] of [
      ['32', KLM, 'A04'],
      ['33', KOREAN, '606'],
      ['48', AER_LINGUS, '400C'],
    ]) {
      const r = decoder.decode({ label, text });
      expect(r.decoder.name).toBe('label-gate-report');
      expect(r.raw.arrival_gate).toBe(gate);
    }
    const n = decoder.decode({ label: '32', text: KLM_NEXT_FLIGHT_ONLY });
    expect(n.raw.arrival_gate).toBeUndefined();
  });
});
