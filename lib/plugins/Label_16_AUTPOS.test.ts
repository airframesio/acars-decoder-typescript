import { MessageDecoder } from '../MessageDecoder';
import { Label_16_AUTPOS } from './Label_16_AUTPOS';

describe('Label 16 AUTPOS', () => {
  let plugin: Label_16_AUTPOS;
  const message = { label: '16', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_16_AUTPOS(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-16-autpos');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['16'],
      preambles: [''],
    });
  });

  test('matches redacted', () => {
    message.text =
      '283806/AUTPOS/LLD N400547 W0774954\r\n/ALT 12932/SAT ****\r\n/WND ******/TAT ****/TAS ****/CRZ ***\r\n/FOB 065120\r\n/DAT 260228/TIM 150742';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.day).toBe(28);
    expect(decodeResult.raw.flight_number).toBe('3806');
    expect(decodeResult.raw.position.latitude).toBeCloseTo(40.096, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-77.832, 3);
    expect(decodeResult.raw.altitude).toBe(12932);
    expect(decodeResult.raw.fuel_on_board).toBe(65120);
    expect(decodeResult.raw.message_timestamp).toBe(1772291262);
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(6);
  });

  test('matches all values', () => {
    message.text =
      '289142/AUTPOS/LLD N395538 W0753341 \r\n/ALT 35000/SAT -057\r\n/WND 239065/TAT -027/TAS 476/CRZ 836\r\n/FOB 107600\r\n/DAT 260228/TIM 132714';
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.day).toBe(28);
    expect(decodeResult.raw.flight_number).toBe('9142');
    expect(decodeResult.raw.position.latitude).toBeCloseTo(39.927, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-75.561, 3);
    expect(decodeResult.raw.altitude).toBe(35000);
    expect(decodeResult.raw.wind_data[0].windSpeed).toBe(65);
    expect(decodeResult.raw.wind_data[0].windDirection).toBe(239);
    expect(decodeResult.raw.total_air_temperature).toBe(-27);
    expect(decodeResult.raw.airspeed).toBe(476);
    expect(decodeResult.raw.mach).toBe(0.836);
    expect(decodeResult.raw.fuel_on_board).toBe(107600);
    expect(decodeResult.raw.message_timestamp).toBe(1772285234);
    expect(decodeResult.formatted.items.length).toBe(11);
  });

  test('does not match if wrong format', () => {
    message.text = 'invalid AUTPOS message';
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(false);
  });
});
