import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_M_POS } from './Label_H1_M_POS';

describe('Label H1 M-Series Position Report', () => {
  let plugin: Label_H1_M_POS;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_M_POS(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-m-pos');
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1'],
    });
  });

  test('decodes M85 position report', () => {
    message.text =
      'M85AQF0073YSSY,KSFO,101621,- 4.9985,-169.9820,35003,290,  35.1, 44100,S05W169,S02W167,1645';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-h1-m-pos');
    expect(decodeResult.formatted.description).toBe(
      'M-Series Periodic Position Report',
    );
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.flight_number).toBe('QF0073');
    expect(decodeResult.raw.departure_icao).toBe('YSSY');
    expect(decodeResult.raw.arrival_icao).toBe('KSFO');
    expect(decodeResult.raw.day).toBe(10);
    expect(decodeResult.raw.position.latitude).toBeCloseTo(-4.9985, 4);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-169.982, 4);
    expect(decodeResult.raw.altitude).toBe(35003);
    expect(decodeResult.raw.heading).toBe(290);
  });

  test('decodes M87 position report', () => {
    message.text =
      'M87AQF0073YSSY,KSFO,101702,  0.7144,-166.0643,36000,282,  34.1, 40200,S00W166,N03W162,1739';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.flight_number).toBe('QF0073');
    expect(decodeResult.raw.departure_icao).toBe('YSSY');
    expect(decodeResult.raw.arrival_icao).toBe('KSFO');
    expect(decodeResult.raw.position.latitude).toBeCloseTo(0.7144, 4);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-166.0643, 4);
    expect(decodeResult.raw.altitude).toBe(36000);
    expect(decodeResult.raw.heading).toBe(282);
  });

  test('decodes M89 position report', () => {
    message.text =
      'M89AQF0073YSSY,KSFO,101819,  7.2016,-158.1146,37001,275,  33.5, 32700,N07W158,N11W153,1900';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.flight_number).toBe('QF0073');
    expect(decodeResult.raw.position.latitude).toBeCloseTo(7.2016, 4);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-158.1146, 4);
    expect(decodeResult.raw.altitude).toBe(37001);
    expect(decodeResult.raw.heading).toBe(275);
  });

  test('rejects invalid message', () => {
    message.text = 'FLR/FR24030411230034583106FWC2';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-h1-m-pos');
    expect(decodeResult.remaining.text).toBe(message.text);
  });

  test('rejects message with too few fields', () => {
    message.text = 'M85AQF0073YSSY,KSFO';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });
});
