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
      labels: ['40', '41', '42', 'C1', '21', '3T', '5Z'],
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
