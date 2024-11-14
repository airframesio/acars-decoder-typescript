import { MessageDecoder } from '../MessageDecoder';
import { Label_4T_AGFSR } from './Label_4T_AGFSR';

describe('Label 4T ETA', () => {

  let plugin: Label_4T_AGFSR;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4T_AGFSR(decoder);
  });

  
  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-4t-agfsr');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['4T'],
      preambles: ['AGFSR'],
    });
  });

  
  test('decodes msg 1', () => {
    // https://app.airframes.io/messages/3576265474
    // https://www.flightaware.com/live/flight/ACA620/history/20241108/0245Z/CYYZ/CYHZ
    // https://globe.airplanes.live/?icao=c05bd2
    const text = 'AGFSR AC0620/07/08/YYZYHZ/0340Z/453/4435.1N07143.4W/350/ /0063/0035/ /281065/----/ /512/0240/0253/----/----';

    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(8);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('AC0620');
    expect(decodeResult.formatted.items[1].label).toBe('Departure Day');
    expect(decodeResult.formatted.items[1].value).toBe('7');
    expect(decodeResult.formatted.items[2].label).toBe('Arrival Day');
    expect(decodeResult.formatted.items[2].value).toBe('8');
    expect(decodeResult.formatted.items[3].label).toBe('Origin');
    expect(decodeResult.formatted.items[3].value).toBe('YYZ');
    expect(decodeResult.formatted.items[4].label).toBe('Destination');
    expect(decodeResult.formatted.items[4].value).toBe('YHZ');
    expect(decodeResult.formatted.items[5].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[5].value).toBe('03:40:00');
    expect(decodeResult.formatted.items[6].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[6].value).toBe('44.585 N, 70.277 W');
    expect(decodeResult.formatted.items[7].label).toBe('Altitude');
    expect(decodeResult.formatted.items[7].value).toBe('35000 feet');
    expect(decodeResult.remaining.text).toBe('453/ /0063/0035/ /281065/----/ /512/0240/0253/----/----');
  });

  test('decodes msg 2', () => {
    // https://app.airframes.io/messages/3576317322
    // https://www.flightaware.com/live/flight/CFNOH/history/20241108/0335Z/CYUL/SBGR
    // https://globe.airplanes.live/?icao=c023c8
    const text = 'AGFSR AC0096/07/08/YULGRU/0354Z/833/4417.8N07232.6W/254/CLIMB /0565/0033/-33/275049/0289/144/453/0319/0339/****/****';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial')
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(8);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('AC0096');
    expect(decodeResult.formatted.items[1].label).toBe('Departure Day');
    expect(decodeResult.formatted.items[1].value).toBe('7');
    expect(decodeResult.formatted.items[2].label).toBe('Arrival Day');
    expect(decodeResult.formatted.items[2].value).toBe('8');
    expect(decodeResult.formatted.items[3].label).toBe('Origin');
    expect(decodeResult.formatted.items[3].value).toBe('YUL');
    expect(decodeResult.formatted.items[4].label).toBe('Destination');
    expect(decodeResult.formatted.items[4].value).toBe('GRU');
    expect(decodeResult.formatted.items[5].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[5].value).toBe('03:54:00');
    expect(decodeResult.formatted.items[6].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[6].value).toBe('44.297 N, 71.457 W');
    expect(decodeResult.formatted.items[7].label).toBe('Altitude');
    expect(decodeResult.formatted.items[7].value).toBe('25400 feet');
    expect(decodeResult.remaining.text).toBe('833/CLIMB /0565/0033/-33/275049/0289/144/453/0319/0339/****/****');
  });

  test('decodes <invalid>', () => {

    const text = 'POS/ Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
