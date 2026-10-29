import { MessageDecoder } from '../MessageDecoder';
import { Label_40_SWA } from './Label_40_SWA';

describe('Label_40_SWA', () => {
  let plugin: Label_40_SWA;
  const message = { label: '40', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_40_SWA(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-40-swa');
    expect(plugin.qualifiers()).toEqual({ labels: ['40'] });
  });

  test('decodes ASR01 approach stability report', () => {
    // 1675,148,137, 979, 0.0,-0.8, 5.4, 9.2||
    message.text = 'ASR01,08OLN9SO7RSOZNS15N5S1.J.S/.JRS19J7S15JW\n\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe(
      'Approach Stability Report',
    );
    expect(decodeResult.formatted.items.length).toBe(8);
    expect(decodeResult.raw.reverser_distance).toBe('1675');
    expect(decodeResult.raw.max_ias).toBe('148');
    expect(decodeResult.raw.min_ias).toBe('137');
    expect(decodeResult.raw.touchdown_distance).toBe('979');
    expect(decodeResult.raw.glideslope_above).toBe('0.0');
    expect(decodeResult.raw.glideslope_below).toBe('-0.8');
    expect(decodeResult.raw.max_pitch).toBe('5.4');
    expect(decodeResult.raw.tailstrike_pitch).toBe('9.2');
  });

  test('decodes ASR01 with no glideslope flown', () => {
    // 1781,143,132, 995,XX.X,XX.X, 4.7,12.3||
    message.text = 'ASR01,02QVTQKQ51KQ1YKHNNWK))L)K))L)KH5LVKQYL1\n\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.raw.glideslope_above).toBeUndefined();
    expect(decodeResult.raw.tailstrike_pitch).toBe('12.3');
  });

  test('decodes GAR03 gate assignment response', () => {
    // C45 ,N,N,Y,N,N,129.300,|
    message.text = 'GAR03,01EPZV81818/818185-YM0NN8\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Gate Assignment Response');
    expect(decodeResult.raw.gate).toBe('C45');
    expect(decodeResult.raw.ramp_frequency).toBe('129.300 MHz');
    expect(decodeResult.remaining.text).toBe('N,N,Y,N,N');
  });

  test('decodes POS01 position report request', () => {
    message.text = 'POS01,Y,05';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Position Report Request');
    expect(decodeResult.raw.report_interval).toBe(5);
  });

  test('decodes free text in table 07', () => {
    // FTX01 table 07: raw L is Q.
    message.text = 'FTX01,07L';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Dispatch Free Text');
    expect(decodeResult.raw.text).toBe('Q');
  });

  test.each([
    // Every FTX01 opens "DISPATCH MSG" and a line break; these are its raw forms in each table.
    ['FTX01,01H 73AJEWV.7T\n'],
    ['FTX01,026:EUJO0,HBE \n'],
    ['FTX01,039BOV-D6L47OH\n'],
    ['FTX01,04Q(KCJNO 17KZ\n'],
    ['FTX01,052AUO,W0:3IU8\n'],
    ['FTX01,0672Z):Y83A.Z4\n'],
    ['FTX01,07)5PJWR 3:DP1\n'],
    ['FTX01,08(P8Y2H6A1V8,\n'],
    ['FTX01,09A2JOKET069J)\n'],
  ])('decodes the FTX01 opening %j', (text) => {
    message.text = text;
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.text).toBe('DISPATCH MSG\n');
  });

  test('decodes a crew schedule message as sent', () => {
    // MSG FROM CREW SCHEDULE|26 BOS-BWI|CAE 12345 FOE 654321| (made-up numbers)
    message.text =
      'GEN01,05IU836SMI30S4)3U0:42YG4\nLT3.MUB.)A\n0,43JLNPR36M43TRPNLJ\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.text).toBe(
      'MSG FROM CREW SCHEDULE\n26 BOS-BWI\nCAE 12345 FOE 654321\n',
    );
  });

  test('decodes dispatch free text as sent', () => {
    // DISPATCH MSG|FO 654321 IS ON THE SCHEDULE| (made-up number)
    message.text = 'FTX01,0672Z):Y83A.Z4\n5,ALMNOPQA2ZA,-AY36AZ8367X/6\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.text).toBe(
      'DISPATCH MSG\nFO 654321 IS ON THE SCHEDULE\n',
    );
  });

  test('decodes table code 00 as plain text', () => {
    message.text =
      'GEN01,00PRE DEPT CLR ,PDC MSG RECEIVED        ,\nPDC NOT AVAILABLE       \nCONTACT CLNC DEL        \n\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Company Message');
    expect(decodeResult.raw.text).toBe(
      'PRE DEPT CLR ,PDC MSG RECEIVED        ,\nPDC NOT AVAILABLE       \nCONTACT CLNC DEL        \n\n',
    );
  });

  test('does not decode a type name Southwest does not send', () => {
    message.text = 'ABC12,07L';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });

  test('decodes PIC01 duty extension request', () => {
    // WITH MAX EXT AVAIL|LATEST OFF TIME 0501Z|
    message.text = 'PIC01,03ZBDL47- 4A D4-K-B3\n3-DAOD4NWW4DB7A4505F:\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe(
      'Part 117 Duty Extension Request',
    );
    expect(decodeResult.raw.text).toBe(
      'WITH MAX EXT AVAIL\nLATEST OFF TIME 0501Z\n',
    );
  });

  test('does not decode a body outside the SWA layout', () => {
    message.text = 'HELLO WORLD';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });

  test('is chosen by MessageDecoder for label 40', () => {
    const decoder = new MessageDecoder();
    const decodeResult = decoder.decode({
      label: '40',
      text: 'ASR01,08OLN9SO7RSOZNS15N5S1.J.S/.JRS19J7S15JW\n\n',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.name).toBe('label-40-swa');
  });
});
