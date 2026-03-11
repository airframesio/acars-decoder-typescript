import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_ATIS } from './Label_H1_ATIS';

describe('Label H1 ATIS Subscription', () => {
  let plugin: Label_H1_ATIS;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_ATIS(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-atis');
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1', '5Z'],
      preambles: ['L'],
    });
  });

  test('decodes KSFO ATIS subscription', () => {
    message.text = 'L95AQF0073/KSFO.TI2/030KSFOAFF5C';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.decoder.name).toBe('label-h1-atis');
    expect(decodeResult.formatted.description).toBe('ATIS Subscription');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.flight_number).toBe('QF0073');
    expect(decodeResult.raw.arrival_icao).toBe('KSFO');
    expect(decodeResult.raw.atis_code).toBe('030');
    expect(decodeResult.raw.checksum).toBe(0xAFF5C);
  });

  test('decodes OERK ATIS subscription', () => {
    message.text = 'L01AMC5477/OERK.TI2/024OERKC8781';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.flight_number).toBe('MC5477');
    expect(decodeResult.raw.arrival_icao).toBe('OERK');
    expect(decodeResult.raw.atis_code).toBe('024');
    expect(decodeResult.raw.checksum).toBe(0xC8781);
  });

  test('decodes LICC ATIS subscription', () => {
    message.text = 'L11AMC5477/LICC.TI2/024LICCAFBD9';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.flight_number).toBe('MC5477');
    expect(decodeResult.raw.arrival_icao).toBe('LICC');
    expect(decodeResult.raw.atis_code).toBe('024');
    expect(decodeResult.raw.checksum).toBe(0xAFBD9);
  });

  test('decodes with label 5Z', () => {
    const msg5Z = {
      label: '5Z',
      text: 'L95AQF0073/KSFO.TI2/030KSFOAFF5C',
    };
    const decodeResult = plugin.decode(msg5Z);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.flight_number).toBe('QF0073');
    expect(decodeResult.raw.arrival_icao).toBe('KSFO');
  });

  test('rejects invalid message', () => {
    message.text = 'LINVALID MESSAGE';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-h1-atis');
    expect(decodeResult.remaining.text).toBe(message.text);
  });

  test('rejects non-ATIS message', () => {
    message.text = 'FLR/FR24030411230034583106FWC2';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });
});
