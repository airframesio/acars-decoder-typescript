import { MessageDecoder } from '../MessageDecoder';
import { Label_SQ } from './Label_SQ';

describe('Label_SQ', () => {
  let plugin: Label_SQ;
  const message = { label: 'SQ', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_SQ(decoder);
  });

  test('matches Label SQ qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-sq');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['SQ'],
    });
  it('decodes version 2 ARINC ground station squitter with coordinates and frequency', () => {
    message.text = 'V2AA' + '0' + '1X' + 'A' + 'JFK' + 'KJFK' + '3' + '4075' + 'N' + '7398' + 'W' + 'V136975' + '/extra';
    const res = plugin.decode(message);

    expect(res.decoded).toBe(true);
    expect(res.decoder.name).toBe('label-sq');
    expect(res.decoder.decodeLevel).toBe('full');

    expect(res.raw.preamble).toBe(message.text.substring(0, 4));
    expect(res.raw.version).toBe('2');
    expect(res.raw.network).toBe('A');

    expect(res.raw.groundStation).toBeDefined();
    expect(res.raw.groundStation.number).toBe('3');
    expect(res.raw.groundStation.iataCode).toBe('JFK');
    expect(res.raw.groundStation.icaoCode).toBe('KJFK');

    expect(res.raw.groundStation.coordinates.latitude).toBeCloseTo(40.75, 5);
    expect(res.raw.groundStation.coordinates.longitude).toBeCloseTo(-73.98, 5);

    expect(res.raw.vdlFrequency).toBeCloseTo(136.975, 6);

    const items = res.formatted.items;
    expect(items.find(i => i.code === 'NETT')?.value).toBe('ARINC');
    expect(items.find(i => i.code === 'VER')?.value).toBe('2');
    expect(items.find(i => i.code === 'GNDSTN')?.value).toBe('KJFK3');
    expect(items.find(i => i.code === 'IATA')?.value).toBe('JFK');
    expect(items.find(i => i.code === 'ICAO')?.value).toBe('KJFK');
    expect(items.find(i => i.code === 'VDLFRQ')?.value).toContain('136.975');
  });

  it('maps SITA network and handles absence of regex match gracefully', () => {
    message.text = 'V2AS' + '0' + 'XXXXNOTMATCHING';
    const res = plugin.decode(message);

    expect(res.decoded).toBe(true);
    expect(res.raw.version).toBe('2');
    expect(res.raw.network).toBe('S');

    const items = res.formatted.items;
    expect(items.find(i => i.code === 'NETT')?.value).toBe('SITA');
    expect(items.find(i => i.code === 'VER')?.value).toBe('2');

    expect(res.raw.groundStation).toBeUndefined();
    expect(res.raw.vdlFrequency).toBeUndefined();
  });

  it('handles non-version-2 payloads (no regex path)', () => {
    message.text = 'V1AA' + 'WHATEVER';
    const res = plugin.decode(message);

    expect(res.decoded).toBe(true);
    expect(res.raw.version).toBe('1');
    expect(res.raw.network).toBe('A');

    const items = res.formatted.items;
    expect(items.find(i => i.code === 'NETT')?.value).toBe('ARINC');
    expect(items.find(i => i.code === 'VER')?.value).toBe('1');
  });
});
  });