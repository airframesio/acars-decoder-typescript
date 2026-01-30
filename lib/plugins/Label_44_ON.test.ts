=import { MessageDecoder } from '../MessageDecoder';
import { Label_44_ON } from './Label_44_ON';

describe('Label 44 ON', () => {
  let plugin: Label_44_ON;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_44_ON(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-44-on');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['44'],
      preambles: ['00ON01', '00ON02', '00ON03', 'ON01', 'ON02', 'ON03'],
    });
  });

  test('decodes variant 1', () => {
    // https://app.airframes.io/messages/3563679058
    const text = 'ON01,N33522W084181,KCLT,KPDK,1106,004023,---.-,'
    const decodeResult = plugin.decode({ text: text });
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.position.latitude).toBe(33.87);
    expect(decodeResult.raw.position.longitude).toBe(-84.30166666666666);
    expect(decodeResult.raw.departure_icao).toBe('KCLT');
    expect(decodeResult.raw.arrival_icao).toBe('KPDK');
    expect(decodeResult.raw.month).toBe(11);
    expect(decodeResult.raw.day).toBe(6);
    expect(decodeResult.raw.on_time).toBe(2423);
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('33.870 N, 84.302 W');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KCLT');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KPDK');
    expect(decodeResult.formatted.items[3].label).toBe('Month of Year');
    expect(decodeResult.formatted.items[3].value).toBe('11');
    expect(decodeResult.formatted.items[4].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[4].value).toBe('6');
    expect(decodeResult.formatted.items[5].label).toBe('Landing Time');
    expect(decodeResult.formatted.items[5].value).toBe('00:40:23');
  });

  test('decodes variant 2', () => {
    const text = 'ON02,N38333W121178,KRNO,KMHR,0806,2350,005.2'
    const decodeResult = plugin.decode({ text: text });
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.position.latitude).toBe(38.555);
    expect(decodeResult.raw.position.longitude).toBe(-121.29666666666667);
    expect(decodeResult.raw.departure_icao).toBe('KRNO');
    expect(decodeResult.raw.arrival_icao).toBe('KMHR');
    expect(decodeResult.raw.month).toBe(8);
    expect(decodeResult.raw.day).toBe(6);
    expect(decodeResult.raw.on_time).toBe(85800);
    expect(decodeResult.formatted.items.length).toBe(7);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('38.555 N, 121.297 W');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KRNO');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KMHR');
    expect(decodeResult.formatted.items[3].label).toBe('Month of Year');
    expect(decodeResult.formatted.items[3].value).toBe('8');
    expect(decodeResult.formatted.items[4].label).toBe('Day of Month');
    expect(decodeResult.formatted.items[4].value).toBe('6');
    expect(decodeResult.formatted.items[5].label).toBe('Landing Time');
    expect(decodeResult.formatted.items[5].value).toBe('23:50:00');
    expect(decodeResult.formatted.items[6].label).toBe('Fuel Remaining');
    expect(decodeResult.formatted.items[6].value).toBe('5.2');
  });

  test('does not decode invalid', () => {

    const text = '00OFF01 Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.message.text).toBe(text);
  });
});
