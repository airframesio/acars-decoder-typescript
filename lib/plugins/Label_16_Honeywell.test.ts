import { MessageDecoder } from '../MessageDecoder';
import { Label_16_Honeywell } from './Label_16_Honeywell';

describe('Label_16_Honeywell', () => {
  let plugin: Label_16_Honeywell;
  const message = { label: '16', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_16_Honeywell(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-16-honeywell');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['16'],
      preambles: ['(2'],
    });
  });

  test('decodes variant 1', () => {
    message.text = '(2AAABN39211W 77144KTEBMMTO-/A(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.position.latitude).toBeCloseTo(39.352, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-77.24, 3);
    expect(decodeResult.raw.departure_icao).toBe('KTEB');
    expect(decodeResult.raw.arrival_icao).toBe('MMTO');
    expect(decodeResult.formatted.items.length).toBe(3);
    expect(decodeResult.remaining.text).toBe('AAAB/A');
  });

  test('decodes variant 2', () => {
    message.text = '(2AAAAN37265W 78334-SSI  /O(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.position.latitude).toBeCloseTo(37.442, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-78.557, 3);
    expect(decodeResult.raw.route.waypoints[0].name).toBe('SSI');
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.remaining.text).toBe('AAAA/O');
  });

  test('decodes variant 3', () => {
    message.text = '(2AAABN37197W 78404-SLOJOGRONK/O(Z';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.position.latitude).toBeCloseTo(37.328, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-78.673, 3);
    expect(decodeResult.raw.route.waypoints[0].name).toBe('SLOJO');
    expect(decodeResult.raw.route.waypoints[1].name).toBe('GRONK');
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.remaining.text).toBe('AAAB/O');
  });

  test('does not decode <invalid>', () => {
    message.text = '(2 Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.message).toBe(message);
  });
});
