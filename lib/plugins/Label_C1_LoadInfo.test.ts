import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_C1_LoadInfo } from './Label_C1_LoadInfo';

// Layout from #416 (Swiss, ZRH-WRO); the preparer's name and licence number
// are replaced.
const BODY =
  'PRELIMINARY LOAD INFO 11:25\r\nZFW 37329\r\nTOW 43129\r\nLAW 40629\r\nPAX C/Y 6/84\r\nMACTOW 16.8\r\nSI ZRH-WRO\r\nNOTOC: NO\r\nSALEABLE CONFIGURATION 9C/104Y\r\nFUEL IN TANKS 6000\r\nPREPARED BY XXXXX/XXXXX 00 00\r\n0000000\r\nEND';

describe('Label_C1_LoadInfo', () => {
  let decoder: MessageDecoder;
  let plugin: Label_C1_LoadInfo;

  beforeEach(() => {
    decoder = new MessageDecoder();
    plugin = new Label_C1_LoadInfo(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-c1-load-info');
    expect(plugin.qualifiers()).toEqual({ labels: ['C1'] });
  });

  test('decodes load info behind an AGM header', () => {
    const r = decoder.decode({
      label: 'C1',
      text: `.FRAGDLH 190925\r\nAGM\r\nAN HB-JVA/MA 277A\r\n-  ${BODY}`,
    });

    expect(r.decoded).toBe(true);
    expect(r.decoder.name).toBe('label-c1-load-info');
    expect(r.formatted.description).toBe('Load Info');
    expect(r.raw.ground_address).toBe('FRAGDLH');
    expect(r.raw.tail).toBe('HB-JVA');
    expect(r.raw.departure_iata).toBe('ZRH');
    expect(r.raw.arrival_iata).toBe('WRO');
    expect(r.raw.loadsheet).toEqual({
      kind: 'loadsheet',
      status: 'prelim',
      time: '1125',
      zfw: 37329,
      tow: 43129,
      law: 40629,
      pax_total: 90,
      pax_breakdown: 'C/Y 6/84',
      mac_tow: 16.8,
      departure: 'ZRH',
      arrival: 'WRO',
      notoc: false,
    });
    expect(r.raw.fuel_on_board).toBe(6000);
    expect(r.raw.cabin_configuration).toBe('9C/104Y');
    const items = Object.fromEntries(
      r.formatted.items.map((i) => [i.code, i.value]),
    );
    expect(items.LSSTAT).toBe('PRELIM');
    expect(items.ZFW).toBe('37329');
    expect(items.PAX).toBe('90 (C/Y 6/84)');
    expect(items.MACTOW).toBe('16.8%');
    expect(items.NOTOC).toBe('NO');
    expect(items.FOB).toBe('6000');
    expect(items.CABCFG).toBe('9C/104Y');
    // The AGM header's DDHHMM and AN suffix are not decoded.
    expect(r.decoder.decodeLevel).toBe('partial');
  });

  test('never outputs the preparer', () => {
    const r = plugin.decode({ label: 'C1', text: BODY });
    expect(JSON.stringify(r.raw)).not.toContain('XXXXX');
    expect(JSON.stringify(r.formatted)).not.toContain('XXXXX');
    expect(r.remaining.text).toBeUndefined();
    expect(r.decoder.decodeLevel).toBe('full');
  });

  test('reads a header written one field per line', () => {
    const r = plugin.decode({
      label: 'C1',
      text: `.FRAGDLH\n190925\nAGM\nAN HB-JVA/MA 277A\n${BODY.replace(/\r/g, '')}`,
    });
    expect(r.decoded).toBe(true);
    expect(r.raw.ground_address).toBe('FRAGDLH');
    expect(r.raw.day).toBe(19);
    expect(r.raw.message_timestamp).toBe(9 * 3600 + 25 * 60);
    expect(r.raw.tail).toBe('HB-JVA');
    expect(r.raw.loadsheet?.status).toBe('prelim');
    // As with splitAgmHeader, the AN suffix 'MA 277A' is not decoded.
    expect(r.remaining.text).toBe('MA 277A');
    expect(r.decoder.decodeLevel).toBe('partial');
  });

  test('reads a one-field-per-line header with a dash and a flight', () => {
    const r = plugin.decode({
      label: 'C1',
      text: `.FRAGDLH\n190925\nAGM\nAN HB-JVA/FI LX1366\n-  ${BODY.replace(/\r/g, '')}`,
    });
    expect(r.decoded).toBe(true);
    expect(r.raw.tail).toBe('HB-JVA');
    expect(r.raw.flight_number).toBe('LX1366');
    expect(r.raw.loadsheet?.zfw).toBe(37329);
    expect(r.decoder.decodeLevel).toBe('full');
  });

  test('reads final load info and keeps unknown lines', () => {
    const r = plugin.decode({
      label: 'C1',
      text: 'FINAL LOAD INFO 1140\nZFW 37400\nTOW 43200\nPAX 91\nDOI 45.1\nTRIM OK\nEND',
    });
    expect(r.decoded).toBe(true);
    expect(r.raw.loadsheet?.status).toBe('final');
    expect(r.raw.loadsheet?.time).toBe('1140');
    expect(r.raw.loadsheet?.pax_total).toBe(91);
    expect(r.raw.loadsheet?.pax_breakdown).toBe('91');
    expect(r.raw.loadsheet?.doi).toBe(45.1);
    expect(r.remaining.text).toBe('TRIM OK');
    expect(r.decoder.decodeLevel).toBe('partial');
  });

  test('reads a dashed one-field-per-line header through the decoder', () => {
    const r = decoder.decode({
      label: 'C1',
      text: '.FRAGDLH\n190925\nAGM\nAN HB-JVA/MA 277A\n-  PRELIMINARY LOAD INFO 11:25\nZFW 37329\nTOW 43129\nEND',
    });
    expect(r.decoder.name).toBe('label-c1-load-info');
    expect(r.raw.loadsheet?.zfw).toBe(37329);
    expect(r.remaining.text).toBe('MA 277A');
  });

  test('splits lines on a bare CR', () => {
    const r = plugin.decode({
      label: 'C1',
      text: 'PRELIMINARY LOAD INFO 11:25\rZFW 37329\rTOW 43129\rEND',
    });
    expect(r.decoded).toBe(true);
    expect(r.raw.loadsheet?.tow).toBe(43129);
  });

  test('reads the issue time only when it is a clock', () => {
    const time = (header: string) =>
      plugin.decode({ label: 'C1', text: `${header}\nZFW 37329` });
    expect(time('PRELIMINARY LOAD INFO 11:25Z').raw.loadsheet?.time).toBe(
      '1125',
    );
    expect(time('PRELIMINARY LOAD INFO  9:25').raw.loadsheet?.time).toBe(
      '0925',
    );
    const bad = time('PRELIMINARY LOAD INFO 11:60');
    expect(bad.decoded).toBe(true);
    expect(bad.raw.loadsheet?.time).toBeUndefined();
    expect(bad.remaining.text).toBe('11:60');
    expect(bad.decoder.decodeLevel).toBe('partial');
  });

  test('keeps digit lines that do not follow the preparer', () => {
    const r = plugin.decode({
      label: 'C1',
      text: 'PRELIMINARY LOAD INFO 11:25\nZFW 37329\n12345\nEND',
    });
    expect(r.remaining.text).toBe('12345');
    expect(r.decoder.decodeLevel).toBe('partial');
  });

  test('accepts any weight and keeps SI free text', () => {
    const r = plugin.decode({
      label: 'C1',
      text: 'FINAL LOAD INFO 1140\nLAW 40629\nSI ZRH-WRO CREW 2/4',
    });
    expect(r.decoded).toBe(true);
    expect(r.raw.loadsheet?.law).toBe(40629);
    expect(r.raw.departure_iata).toBe('ZRH');
    expect(r.remaining.text).toBe('CREW 2/4');
  });

  test('leaves IATA loadsheets to the Loadsheet plugin', () => {
    const text =
      '.FRAGDLH 191010\r\nAGM\r\nAN HB-JVA\r\n-  LOADSHEET FINAL 1005 EDNO1\r\nLX1366/19     19NOV26\r\nZRH WRO HB-JVA   2/3\r\nZFW 37400  MAX 50300\r\nTOF 5800\r\nTOW 43200  MAX 60800\r\nTIF 2500\r\nLAW 40700  MAX 54900\r\nPAX/6/85 TTL 91\r\nNOTE: PRELIMINARY LOAD INFO SUPERSEDED';
    expect(plugin.decode({ label: 'C1', text }).decoded).toBe(false);
    const r = decoder.decode({ label: 'C1', text });
    expect(r.decoder.name).toBe('loadsheet');
    expect(r.raw.loadsheet?.status).toBe('final');
  });

  test('does not decode other C1 messages', () => {
    for (const text of [
      '.NDCULUA 220455\r\nAGM\r\nAN N23707\r\n-  SVC INFO SUMMARY\r\nUA2186/21 KSNA KEWR',
      'PRELIMINARY LOAD INFO WILL FOLLOW',
      'PRELIMINARY LOAD INFO 11:25\nSI ZRH-WRO\nEND',
    ]) {
      const r = plugin.decode({ label: 'C1', text });
      expect(r.decoded).toBe(false);
    }
  });
});
