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

  test('decodes an arrival stand without the trailing //', () => {
    const result = new MessageDecoder().decode({
      label: '10',
      text: ':PAD11\r\nUTC\r\nARRIVAL- GTNED BA1447  \r\nSTAND 503  ETA 1357\r\nON STAND- BA424   \r\nETD 1350\r\n\r\nCREW DEPT- FOR INFO ONLY\r\nGTNED BA1372  TO X\r\nSTAND 503\r\n',
    });

    expect(result.decoder.name).toBe('label-10-pad11');
    expect(result.formatted.description).toBe('Arrival Uplink');
    expect(result.raw.flight_number).toBe('BA1447');
    expect(result.raw.arrival_gate).toBe('503');
    expect(result.raw.eta_time).toBe(13 * 3600 + 57 * 60);
    expect(result.remaining.text).toMatch(/^ON STAND- BA424/);
  });

  test('decodes an arrival stand with a letter suffix on label 11', () => {
    const result = new MessageDecoder().decode({
      label: '11',
      text: ':PAD11\r\nUTC\r\nARRIVAL- GMEDK BA2661  \r\nSTAND 36M  ETA 1341 //\r\nON STAND- UNKNOWN //',
    });

    expect(result.decoder.name).toBe('label-10-pad11');
    expect(result.raw.arrival_gate).toBe('36M');
  });

  test('does not take the crew departure stand as the arrival stand', () => {
    const result = plugin.decode({
      label: '10',
      text: ':PAD11\r\nUTC\r\nARRIVAL- GTNEF BA1421  \r\nETA 1343\r\nCREW DEPT- FOR INFO ONLY\r\nSTAND 506\r\n',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.flight_number).toBe('BA1421');
    expect(result.raw.arrival_gate).toBeUndefined();
    expect(result.remaining.text).toContain('STAND 506');
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

  test('only takes the 4PAD11 slot uplink', () => {
    const result = new MessageDecoder().decode({
      label: '10',
      text: '5PAD11/SLOT\n\tIB154 ECOOL\n\tSTD 0335 STA 1310\n\tATD 0357\n\t',
    });
    expect(result.decoder.name).not.toBe('label-10-pad11');
    expect(
      plugin.decode({
        label: '10',
        text: '5PAD11/SLOT\n\tIB154 ECOOL\n\tSTD 0335 STA 1310\n\tATD 0357\n\t',
      }).decoded,
    ).toBe(false);
  });

  test('does not decode other PAD11 uplinks', () => {
    for (const text of [
      ':PAD11\r\nPDC/ASAT RECEIVED',
      ':PAD11\r\nSLOT CHANGE\r\n396  LHR - CAI\r\nFP RLS: 9\r\nCTOT: 0915 //',
      ':PAD11\r\nSLOT CHANGE\r\n396  LHR - CAI\r\nCTOT: 0915 //\r\nEOBT: 2560',
      ':PAD11\r\nUTC\r\nARRIVAL- GXWBB BA066  \r\nSTAND 305  ETA 2560 //',
      '4PAD11/SLOT\n\tIB154 ECOOL\n\tSTD 0335 STA 1310\n\tATD 2599\n\t',
    ]) {
      expect(plugin.decode({ label: '10', text }).decoded).toBe(false);
    }
  });

  test('decodes an arrival uplink with the ETA before on-blocks', () => {
    const result = plugin.decode({
      label: '11',
      text: ':PAD11\r\nUTC\r\nARRIVAL- GXWBB BA066  \r\nSTAND 305  ETA 0658 //\r\nON STAND- UNKNOWN //',
    });
    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Arrival Uplink');
    expect(result.raw.tail).toBe('GXWBB');
    expect(result.raw.flight_number).toBe('BA066');
    expect(result.raw.arrival_gate).toBe('305');
    expect(result.raw.eta_time).toBe(6 * 3600 + 58 * 60);
    expect(result.raw.in_time).toBeUndefined();
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.remaining.text).toBe('ON STAND- UNKNOWN //');
  });

  test('decodes a British Airways flight release as the ETD', () => {
    const result = plugin.decode({
      label: '10',
      text: ':PAD11\r\n22NOV26 BA356    GEUUZ LHR-LYS\r\nETD 0700Z FLIGHT RELEASE OFP  5',
    });
    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Flight Release Uplink');
    expect(result.raw.flight_number).toBe('BA356');
    expect(result.raw.tail).toBe('GEUUZ');
    expect(result.raw.departure_iata).toBe('LHR');
    expect(result.raw.arrival_iata).toBe('LYS');
    expect(result.raw.etd_time).toBe(7 * 3600);
    expect(result.raw.departure_day).toBe(22);
    expect(result.raw.month).toBe(11);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.remaining.text).toBe('26,OFP  5');

    // Without the OFP tail the year still keeps it partial.
    const short = plugin.decode({
      label: '10',
      text: ':PAD11\r\n22NOV26 BA356    GEUUZ LHR-LYS\r\nETD 0700Z FLIGHT RELEASE',
    });
    expect(short.decoder.decodeLevel).toBe('partial');
    expect(short.remaining.text).toBe('26');
  });

  test('decodes a departure planning uplink (TOBT) as the ETD', () => {
    const result = plugin.decode({
      label: '10',
      text: ':PAD11CDM CHANGE\r\n396   LHR - CAI\r\nTOBT 0855\r\nTSAT 0855\r\nTTOT 0915',
    });
    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Departure Planning Uplink');
    expect(result.raw.flight_number).toBe('396');
    expect(result.raw.departure_iata).toBe('LHR');
    expect(result.raw.arrival_iata).toBe('CAI');
    expect(result.raw.etd_time).toBe(8 * 3600 + 55 * 60);
    expect(result.remaining.text).toBe('TSAT 0855\r\nTTOT 0915');
  });

  test('decodes a slot change uplink (EOBT) as the ETD', () => {
    const result = plugin.decode({
      label: '10',
      text: ':PAD11\r\nSLOT CHANGE\r\n396  LHR - CAI\r\nFP RLS: 9\r\nCTOT: 0915 //\r\nTTO: PTID TSL\r\nTO 1148  FL F350\r\nEOBT: 0855\r\nDELAY: AX/000\r\nTAXITIME: 26',
    });
    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.formatted.description).toBe('Slot Change Uplink');
    expect(result.raw.flight_number).toBe('396');
    expect(result.raw.departure_iata).toBe('LHR');
    expect(result.raw.arrival_iata).toBe('CAI');
    expect(result.raw.etd_time).toBe(8 * 3600 + 55 * 60);
    expect(result.remaining.text).toContain('CTOT: 0915');
    expect(result.remaining.text).toContain('DELAY: AX/000');
    expect(result.remaining.text).toContain('TAXITIME: 26');
  });

  test('decodes the new PAD11 uplinks through the message decoder', () => {
    const decoder = new MessageDecoder();
    const cases: [string, string, string, number][] = [
      [
        '11',
        ':PAD11\r\nUTC\r\nARRIVAL- GXWBB BA066  \r\nSTAND 305  ETA 0658 //\r\nON STAND- UNKNOWN //',
        'eta_time',
        6 * 3600 + 58 * 60,
      ],
      [
        '10',
        ':PAD11\r\n22NOV26 BA356    GEUUZ LHR-LYS\r\nETD 0700Z FLIGHT RELEASE OFP  5',
        'etd_time',
        7 * 3600,
      ],
      [
        '10',
        ':PAD11CDM CHANGE\r\n396   LHR - CAI\r\nTOBT 0855\r\nTSAT 0855\r\nTTOT 0915',
        'etd_time',
        8 * 3600 + 55 * 60,
      ],
      [
        '10',
        ':PAD11\r\nSLOT CHANGE\r\n396  LHR - CAI\r\nCTOT: 0915 //\r\nEOBT: 0855\r\nTAXITIME: 26',
        'etd_time',
        8 * 3600 + 55 * 60,
      ],
    ];
    for (const [label, text, field, value] of cases) {
      const result = decoder.decode({ label, text });
      expect(result.decoder.name).toBe('label-10-pad11');
      expect((result.raw as Record<string, unknown>)[field]).toBe(value);
    }
  });
});
