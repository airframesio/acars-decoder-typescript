import { MessageDecoder } from '../MessageDecoder';
import { Label_15 } from './Label_15';

describe('Label_15', () => {
  let plugin: Label_15;
  const message = { label: '15', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_15(decoder);
  });

  test('matches Label 15s qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-15');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['15'],
      preambles: ['(2'],
    });
  });

  test('decodes short variant missing unkown', () => {
    message.text = '(2N38448W 77216--- 28 20  7(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('38.747 N, 77.360 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('2000 feet');
    expect(decodeResult.formatted.items[2].label).toBe(
      'Outside Air Temperature (C)',
    );
    expect(decodeResult.formatted.items[2].value).toBe('7 degrees');
    expect(decodeResult.remaining.text).toBe('--- 28');
  });

  test('decodes short variant all fields', () => {
    message.text = '(2N40492W 77179248 99380-53(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('40.820 N, 77.298 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('38000 feet');
    expect(decodeResult.formatted.items[2].label).toBe(
      'Outside Air Temperature (C)',
    );
    expect(decodeResult.formatted.items[2].value).toBe('-53 degrees');
    expect(decodeResult.remaining.text).toBe('248 99');
  });

  test('decodes short variant missing alt', () => {
    message.text = '(2N39269W 77374--- 42---- 5(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('39.448 N, 77.623 W');
    expect(decodeResult.formatted.items[1].label).toBe(
      'Outside Air Temperature (C)',
    );
    expect(decodeResult.formatted.items[1].value).toBe('-5 degrees');
    expect(decodeResult.remaining.text).toBe('--- 42');
  });

  test('decodes off variant no unkown', () => {
    message.text = '(2N39018W 77284OFF11112418101313--------(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('39.030 N, 77.473 W');
    expect(decodeResult.formatted.items[1].label).toBe('Takeoff Time');
    expect(decodeResult.formatted.items[1].value).toBe('2024-11-11T18:10:00Z');
    expect(decodeResult.remaining.text).toBe('1313--------');
  });

  test('decodes off variant no date and unknown', () => {
    // https://app.airframes.io/messages/3593342701
    message.text = '(2N42589W 83520OFF------13280606--------(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('42.982 N, 83.867 W');
    expect(decodeResult.formatted.items[1].label).toBe('Takeoff Time');
    expect(decodeResult.formatted.items[1].value).toBe('13:28:00');
    expect(decodeResult.remaining.text).toBe('0606--------');
  });

  test('decodes off variant all fields', () => {
    // https://app.airframes.io/messages/3603048708
    message.text = '(2N39042W 77308OFF1311240327B1818 015(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('39.070 N, 77.513 W');
    expect(decodeResult.formatted.items[1].label).toBe('Takeoff Time');
    expect(decodeResult.formatted.items[1].value).toBe('2024-11-13T03:27:00Z');
    expect(decodeResult.remaining.text).toBe('B1818 015');
  });

  test('does not decode Label 15 <invalid>', () => {
    message.text = '(2 Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-15');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.message).toBe(message);
  });
});
