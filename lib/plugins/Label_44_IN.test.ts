import { MessageDecoder } from '../MessageDecoder';
import { Label_44_IN } from './Label_44_IN';

describe('Label 44 IN', () => {
  let plugin: Label_44_IN;
  const message = {label: '44', text: ''};

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_44_IN(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-44-in');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['44'],
      preambles: ['00IN01', '00IN02', '00IN03', 'IN01', 'IN02', 'IN03'],
    });
  });

  test('decodes variant 1', () => {
    // https://app.airframes.io/messages/3563679070
    message.text = 'IN01,N33528W084181,KCLT,KPDK,1106,0045,---.-'
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.position.latitude).toBe(33.88);
    expect(decodeResult.raw.position.longitude).toBe(-84.30166666666666);
    expect(decodeResult.raw.departure_icao).toBe('KCLT');
    expect(decodeResult.raw.arrival_icao).toBe('KPDK');
    expect(decodeResult.raw.month).toBe(11);
    expect(decodeResult.raw.day).toBe(6);
    expect(decodeResult.raw.in_time).toBe(2700);
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('33.880 N, 84.302 W');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KCLT');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KPDK');
    expect(decodeResult.formatted.items[3].label).toBe('Month of Year');
    expect(decodeResult.formatted.items[3].value).toBe('11');
    expect(decodeResult.formatted.items[4].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[4].value).toBe('6');
    expect(decodeResult.formatted.items[5].label).toBe('In Gate Time');
    expect(decodeResult.formatted.items[5].value).toBe('00:45:00');
  });

  test('decodes variant 2', () => {
    message.text = 'IN02,N38338W121179,KMHR,KPDX,0806,2355,005.1'
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.position.latitude).toBe(38.56333333333333);
    expect(decodeResult.raw.position.longitude).toBe(-121.29833333333333);
    expect(decodeResult.raw.departure_icao).toBe('KMHR');
    expect(decodeResult.raw.arrival_icao).toBe('KPDX');
    expect(decodeResult.raw.month).toBe(8);
    expect(decodeResult.raw.day).toBe(6);
    expect(decodeResult.raw.in_time).toBe(86100);
    expect(decodeResult.formatted.items.length).toBe(7);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('38.563 N, 121.298 W');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KMHR');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KPDX');
    expect(decodeResult.formatted.items[3].label).toBe('Month of Year');
    expect(decodeResult.formatted.items[3].value).toBe('8');
    expect(decodeResult.formatted.items[4].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[4].value).toBe('6');
    expect(decodeResult.formatted.items[5].label).toBe('In Gate Time');
    expect(decodeResult.formatted.items[5].value).toBe('23:55:00');
    expect(decodeResult.formatted.items[6].label).toBe('Fuel Remaining');
    expect(decodeResult.formatted.items[6].value).toBe('5.1');
  });

  test('does not decode invalid', () => {

    message.text = '00OFF01 Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.message).toBe(message);
  });
});
