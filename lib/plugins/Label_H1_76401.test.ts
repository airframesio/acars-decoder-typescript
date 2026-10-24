import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_76401 } from './Label_H1_76401';

describe('Label H1 Preamble 76401', () => {
  let plugin: Label_H1_76401;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_76401(decoder);
  });
  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-76401');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1'],
      preambles: ['76401\r\n'],
    });
  });

  test('decodes variant 1', () => {
    // https://app.airframes.io/messages/7903362642
    message.text =
      '76401\r\n02E23KDJTKBWI\r\nN35551W07767100084099M050276030G1801230030YY,\r\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('KDJT');
    expect(decodeResult.raw.arrival_icao).toBe('KBWI');
    expect(decodeResult.raw.position?.latitude).toBe(35.551);
    expect(decodeResult.raw.position?.longitude).toBe(-77.671);
    expect(decodeResult.raw.message_timestamp).toBe(520); // 00:08:40
    expect(decodeResult.remaining.text).toBe(
      '76401\r\n02E23\r\n99M050276030G1801230030YY,\r\n',
    );
  });

  test('decodes variant 2', () => {
    // https://app.airframes.io/messages/7903363689
    message.text =
      '76401\r\n02E23KBWIKBDL\r\nN39831W07515900082500M032334018B000025003005Z\r\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('KBWI');
    expect(decodeResult.raw.arrival_icao).toBe('KBDL');
    expect(decodeResult.raw.route?.waypoints?.length).toBe(1);
    expect(decodeResult.raw.position?.latitude).toBe(39.831);
    expect(decodeResult.raw.position?.longitude).toBe(-75.159);
    expect(decodeResult.raw.message_timestamp).toBe(505); // 00:08:25
    expect(decodeResult.remaining.text).toBe(
      '76401\r\n02E23\r\n00M032334018B000025003005Z\r\n',
    );
  });

  test('decodes multiple positions', () => {
    // https://app.airframes.io/messages/7903359093
    message.text =
      '76401\r\n02E23KPHXKBUR\r\nN34550W11842100030787M001223021G000025::Q030;\r\nN34499W11847100040641P003227022G000025::2HGMY\r\nN34443W11851500050596P004225020G000025::B0YY,\r\nN34386W11855900060596P004227017G000025::B0G';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('KPHX');
    expect(decodeResult.raw.arrival_icao).toBe('KBUR');
    expect(decodeResult.raw.route?.waypoints?.length).toBe(4);
    expect(decodeResult.raw.position?.latitude).toBe(34.386);
    expect(decodeResult.raw.position?.longitude).toBe(-118.559);
    expect(decodeResult.raw.message_timestamp).toBe(365); // 00:06:05
    expect(decodeResult.remaining.text).toBe(
      '76401\r\n02E23\r\n87M001223021G000025::Q030;\r\n41P003227022G000025::2HGMY\r\n96P004225020G000025::B0YY,\r\n96P004227017G000025::B0G',
    );
  });
  test('does not decode invalid', () => {
    message.text = '76401\r\n<Invalid text>';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Position Report');
  });
});
