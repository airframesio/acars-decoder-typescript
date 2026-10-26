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

  test('decodes free text in each table', () => {
    // FTX01 table 07: raw L is Q.
    message.text = 'FTX01,07L';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Dispatch Free Text');
    expect(decodeResult.raw.text).toBe('Q');
  });

  test('does not decode PIC01', () => {
    message.text = 'PIC01,01ABC';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.formatted.items.length).toBe(0);
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
