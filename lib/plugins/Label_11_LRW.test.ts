import { MessageDecoder } from '../MessageDecoder';
import { Label_11_LRW } from './Label_11_LRW';

describe('Label 11 LRW landing runways', () => {
  let plugin: Label_11_LRW;
  const message = { label: '11', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_11_LRW(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-11-lrw');
    expect(plugin.qualifiers()).toEqual({
      labels: ['11'],
      preambles: ['LRW01,'],
    });
  });

  test('decodes a runway list with runway variants', () => {
    // https://app.airframes.io/messages/7923517323
    message.text =
      'LRW01,KMSY LANDING RUNWAYS,02                  7002\n' +
      '11 /AIB  -E1804F    8300\n' +
      '20                  6948\n' +
      '29 /AIB  -E1804F    8300\n\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Landing Runways');
    expect(decodeResult.formatted.items.map((i) => [i.label, i.value])).toEqual(
      [
        ['Landing Airport', 'KMSY'],
        ['Runway Landing Data', '02: 7002 feet'],
        [
          'Runway Landing Data',
          '11/AIB -E1804F (1804 feet off the east end): 8300 feet',
        ],
        ['Runway Landing Data', '20: 6948 feet'],
        [
          'Runway Landing Data',
          '29/AIB -E1804F (1804 feet off the east end): 8300 feet',
        ],
      ],
    );
    expect(decodeResult.raw.landing_runways?.[1]).toEqual({
      runway: '11/AIB -E1804F',
      variant: '1804 feet off the east end',
      length: 8300,
      stoppingMargins: {},
    });
  });

  test('decodes cables and keeps a runway cut off by the end of the block', () => {
    // https://app.airframes.io/messages/7946369148
    message.text =
      'LRW01,PHNL LANDING RUNWAYS,04L                 6955\n04R                 8950\n' +
      '04R/BBB  -NE2700F   6250\n04R/BGA  -SWCBL     7450\n08L/AIC  -E5360F    7000\n' +
      '08R                12000\n08R/BAD  -ECBL     10500\n22L        ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.items.slice(1).map((i) => i.value)).toEqual([
      '04L: 6955 feet',
      '04R: 8950 feet',
      '04R/BBB -NE2700F (2700 feet off the northeast end): 6250 feet',
      '04R/BGA -SWCBL (arresting cable at the southwest end): 7450 feet',
      '08L/AIC -E5360F (5360 feet off the east end): 7000 feet',
      '08R: 12000 feet',
      '08R/BAD -ECBL (arresting cable at the east end): 10500 feet',
    ]);
    expect(decodeResult.remaining.text).toBe('22L');
  });

  test('decodes land and hold short runways', () => {
    // https://app.airframes.io/messages/7906177418
    message.text =
      'LRW01,KMIA LANDING RUNWAYS,08R                10506\n09                 11397\n' +
      '09 /12   LAHSO      9749\n12                  8579\n12 /BCD  -SE479F    8100\n' +
      '12 /09   LAHSO      8100\n26L                10220\n27                 12755\n' +
      '30                  7913\n\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.landing_runways?.length).toBe(9);
    expect(decodeResult.formatted.items[3].value).toBe(
      '09/12 LAHSO (land and hold short): 9749 feet',
    );
    expect(decodeResult.formatted.items[5].value).toBe(
      '12/BCD -SE479F (479 feet off the southeast end): 8100 feet',
    );
  });

  test('keeps a runway cut off inside its variant as remaining', () => {
    // https://app.airframes.io/messages/7875541204 (the first block only)
    message.text =
      'LRW01,KATL LANDING RUNWAYS,08L                 8800\n08L/AGI  -E310F     8490\n' +
      '08L/B13  LAHSO      8490\n08R                 9999\n09L                11730\n' +
      '09R                 9000\n09R/AHH  -E373F     8627\n09R/J    LA';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.landing_runways?.length).toBe(7);
    expect(decodeResult.formatted.items[2].value).toBe(
      '08L/AGI -E310F (310 feet off the east end): 8490 feet',
    );
    expect(decodeResult.remaining.text).toBe('09R/J    LA');
  });

  test('is chosen by the message decoder', () => {
    const decoder = new MessageDecoder();
    const decodeResult = decoder.decode({
      label: '11',
      text: 'LRW01,KMSY LANDING RUNWAYS,11 /AIB  -E1804F    8300\n29 /AIB  -E1804F    8300\n\n',
    });
    expect(decodeResult.decoder.name).toBe('label-11-lrw');
    expect(decodeResult.raw.landing_runways?.length).toBe(2);
  });

  test('does not decode a bad header', () => {
    message.text = 'LRW01,Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.remaining.text).toBe('LRW01,Bogus message');
  });
});
