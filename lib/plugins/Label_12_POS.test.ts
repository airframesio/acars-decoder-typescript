import { MessageDecoder } from '../MessageDecoder';
import { Label_12_POS } from './Label_12_POS';

describe('Label 12 POS', () => {

  let plugin: Label_12_POS;
  const message = {label: '12', text: ''};

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_12_POS(decoder);
  });

  
  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-12-pos');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['12'],
      preambles: ['POS'],
    });
  });

  
  test('decodes msg 1', () => {
    message.text = 'POSN 390104W 754601,-------,1244,1446,,-  4,23249  12,FOB   73,ETA 1303,KATL,KPHL,';

    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(7);
    expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[0].value).toBe('39.018 N, 75.767 W');
    expect(decodeResult.formatted.items[1].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[1].value).toBe('12:44:00');
    expect(decodeResult.formatted.items[2].label).toBe('Altitude');
    expect(decodeResult.formatted.items[2].value).toBe('14460 feet');
    expect(decodeResult.formatted.items[3].label).toBe('Fuel On Board');
    expect(decodeResult.formatted.items[3].value).toBe('73');
    expect(decodeResult.formatted.items[4].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[4].value).toBe('13:03:00');
    expect(decodeResult.formatted.items[5].label).toBe('Origin');
    expect(decodeResult.formatted.items[5].value).toBe('KATL');
    expect(decodeResult.formatted.items[6].label).toBe('Destination');
    expect(decodeResult.formatted.items[6].value).toBe('KPHL');
    expect(decodeResult.remaining.text).toBe('-------,,-  4,23249  12,');
  });

  test('decodes <invalid>', () => {

    message.text = 'POS Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
