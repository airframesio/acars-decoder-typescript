import { MessageDecoder } from '../MessageDecoder';
import { Label_44_ETA } from './Label_44_ETA';

describe('Label 44 Preamble ETA', () => {
  let plugin: Label_44_ETA;
  const message = { label: '44', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_44_ETA(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-44-eta');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['44'],
      preambles: ['00ETA01', '00ETA02', '00ETA03', 'ETA01', 'ETA02', 'ETA03'],
    });
  });

  test('decodes variant 1', () => {
    // https://app.airframes.io/messages/3569460297
    message.text = '00ETA03,N38241W081357,330,KBNA,KBWI,1107,0123,0208,008.1';
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.position.latitude).toBe(38.401666666666664);
    expect(decodeResult.raw.position.longitude).toBe(-81.595);
    expect(decodeResult.raw.altitude).toBe(33000);
    expect(decodeResult.raw.departure_icao).toBe('KBNA');
    expect(decodeResult.raw.arrival_icao).toBe('KBWI');
    expect(decodeResult.raw.month).toBe(11);
    expect(decodeResult.raw.day).toBe(7);
    expect(decodeResult.raw.time_of_day).toBe(4980);
    expect(decodeResult.raw.eta_time).toBe(7680);
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('38.402 N, 81.595 W');
    expect(decodeResult.formatted.items[1].label).toBe('Altitude');
    expect(decodeResult.formatted.items[1].value).toBe('33000 feet');
    expect(decodeResult.formatted.items[2].label).toBe('Origin');
    expect(decodeResult.formatted.items[2].value).toBe('KBNA');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('KBWI');
    expect(decodeResult.formatted.items[4].label).toBe('Month of Year');
    expect(decodeResult.formatted.items[4].value).toBe('11');
    expect(decodeResult.formatted.items[5].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[5].value).toBe('7');
    expect(decodeResult.formatted.items[6].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[6].value).toBe('01:23:00');
    expect(decodeResult.formatted.items[7].label).toBe(
      'Estimated Time of Arrival',
    );
    expect(decodeResult.formatted.items[7].value).toBe('02:08:00');
    expect(decodeResult.formatted.items[8].label).toBe('Fuel Remaining');
    expect(decodeResult.formatted.items[8].value).toBe('8.1');
  });

  test('does not decode invalid', () => {
    message.text = '00OFF01 Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.message).toBe(message);
  });
});
