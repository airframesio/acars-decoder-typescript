import { MessageDecoder } from '../MessageDecoder';
import { Label_22_OFF } from './Label_22_OFF';

describe('Label 22 OFF', () => {
  let plugin: Label_22_OFF;
  const message = {label: '22', text: ''};

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_22_OFF(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-22-off');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['22'],
      preambles: ['OFF'],
    });
  });

  test('decodes variant 1', () => {
    message.text = 'OFF01YX3661/25251712KIADKPWM171207  92'
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.flight_number).toBe('YX3661');
    expect(decodeResult.raw.departure_day).toBe(25);
    expect(decodeResult.raw.arrival_day).toBe(25);
    expect(decodeResult.raw.time_of_day).toBe(61920);
    expect(decodeResult.raw.off_time).toBe(61927);
    expect(decodeResult.raw.departure_icao).toBe('KIAD');
    expect(decodeResult.raw.arrival_icao).toBe('KPWM');
    expect(decodeResult.formatted.items.length).toBe(7);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('YX3661');
    expect(decodeResult.formatted.items[1].label).toBe('Departure Day');
    expect(decodeResult.formatted.items[1].value).toBe('25');
    expect(decodeResult.formatted.items[2].label).toBe('Arrival Day');
    expect(decodeResult.formatted.items[2].value).toBe('25');
    expect(decodeResult.formatted.items[3].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[3].value).toBe('17:12:00');
    expect(decodeResult.formatted.items[4].label).toBe('Origin');
    expect(decodeResult.formatted.items[4].value).toBe('KIAD');
    expect(decodeResult.formatted.items[5].label).toBe('Destination');
    expect(decodeResult.formatted.items[5].value).toBe('KPWM');
    expect(decodeResult.formatted.items[6].label).toBe('Takeoff Time');
    expect(decodeResult.formatted.items[6].value).toBe('17:12:07');
    expect(decodeResult.remaining.text).toBe('  92');
  });

  test('decodes variant 2', () => {
    message.text = 'OFF02XA0000/N38568 W077261251152KIADEPRZ1152****1958'
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.position.latitude).toBe(38.946666666666665);
    expect(decodeResult.raw.position.longitude).toBe(-77.435);
    expect(decodeResult.raw.day).toBe(25);
    expect(decodeResult.raw.time_of_day).toBe(42720);
    expect(decodeResult.raw.off_time).toBe(42720);
    expect(decodeResult.raw.departure_icao).toBe('KIAD');
    expect(decodeResult.raw.arrival_icao).toBe('EPRZ');
    expect(decodeResult.formatted.items.length).toBe(8);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('XA0000');
    expect(decodeResult.formatted.items[1].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[1].value).toBe('38.947 N, 77.435 W');
    expect(decodeResult.formatted.items[2].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[2].value).toBe('25');
    expect(decodeResult.formatted.items[3].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[3].value).toBe('11:52:00');
    expect(decodeResult.formatted.items[4].label).toBe('Origin');
    expect(decodeResult.formatted.items[4].value).toBe('KIAD');
    expect(decodeResult.formatted.items[5].label).toBe('Destination');
    expect(decodeResult.formatted.items[5].value).toBe('EPRZ');
    expect(decodeResult.formatted.items[6].label).toBe('Takeoff Time');
    expect(decodeResult.formatted.items[6].value).toBe('11:52:00');
    expect(decodeResult.formatted.items[7].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[7].value).toBe('19:58:00');
    expect(decodeResult.remaining.text).toBe('****');
  });

  test('decodes variant 3', () => {
    message.text = 'OFF02\r\nKBWI,KIND,1237,18.4'
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('KBWI');
    expect(decodeResult.raw.arrival_icao).toBe('KIND');
    expect(decodeResult.raw.off_time).toBe(45420);
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('KBWI');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('KIND');
    expect(decodeResult.formatted.items[2].label).toBe('Takeoff Time');
    expect(decodeResult.formatted.items[2].value).toBe('12:37:00');
    expect(decodeResult.remaining.text).toBe('18.4');
  });

  test('does not decode invalid', () => {

    message.text = 'POS Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Takeoff Report');
    expect(decodeResult.message).toBe(message);
  });
});
