import { MessageDecoder } from '../MessageDecoder';
import { Label_10_LRW } from './Label_10_LRW';

describe('Label 10 LRW landing runways request', () => {
  let plugin: Label_10_LRW;
  const message = { label: '10', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_10_LRW(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-10-lrw');
    expect(plugin.qualifiers()).toEqual({
      labels: ['10'],
      preambles: ['LRW01,'],
    });
  });

  test('decodes a request', () => {
    // https://app.airframes.io/messages/6177652203
    message.text = 'LRW01,189,D,SWA-2600-019,0,1,KLGA,KATL,';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Landing Runways Request');
    expect(decodeResult.formatted.items.map((i) => [i.label, i.value])).toEqual(
      [
        ['Software Version', 'SWA-2600-019'],
        ['Origin', 'KLGA'],
        ['Destination', 'KATL'],
      ],
    );
    // airline ID 189, layout D, a field that is always 0, and one not yet understood
    expect(decodeResult.remaining.text).toBe('189,D,0,1');
  });

  test('is chosen by the message decoder', () => {
    const decoder = new MessageDecoder();
    const decodeResult = decoder.decode({
      label: '10',
      // https://app.airframes.io/messages/6832579592
      text: 'LRW01,189,D,SWA-2600-019,0,1,KBWI,KMIA,',
    });
    expect(decodeResult.decoder.name).toBe('label-10-lrw');
    expect(decodeResult.raw.arrival_icao).toBe('KMIA');
  });

  test('does not decode a short message', () => {
    message.text = 'LRW01,189,D';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });
});
