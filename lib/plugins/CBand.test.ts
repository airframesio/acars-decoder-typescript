import { MessageDecoder } from '../MessageDecoder';
import { CBand } from './CBand';

describe('CBand', () => {
  let plugin: CBand;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new CBand(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('c-band');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['*'],
    });
  });

  test('decodes Label 4A', () => {
    // https://app.airframes.io/messages/3461407615
    const text =
      'M60ALH0752N22456E077014OSE35 ,192027370VEX36 ,192316,M46,275043309,85220111';
    const decodeResult = plugin.decode({ label: '4A', text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('c-band-label-4a');
    expect(decodeResult.formatted.description).toBe('Latest New Format');
    expect(decodeResult.raw.flight_number).toBe('LH752');
    expect(decodeResult.raw.position.latitude).toBe(22.456);
    expect(decodeResult.raw.position.longitude).toBe(77.014);
    expect(decodeResult.raw.route.waypoints.length).toBe(2);
    expect(decodeResult.raw.route.waypoints[0].name).toBe('OSE35');
    expect(decodeResult.raw.route.waypoints[1].name).toBe('VEX36');
    expect(decodeResult.raw.outside_air_temperature).toBe(-46);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.remaining.text).toBe('275043309,85220111');
  });

  test('decodes Label 4N variant 2C (C-band)', () => {
    // https://app.airframes.io/messages/3422221702
    const text =
      'M85AUP0109285,C,,10/12,,,,,NRT,ANC,ANC,07R/,33/,0,0,,,,,,0,0,0,0,1,0,,0,0,709.8,048.7,758.5,75F3';
    const decodeResult = plugin.decode({ label: '4N', text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('c-band-label-4n');
    expect(decodeResult.formatted.description).toBe('Airline Defined');
    expect(decodeResult.raw.flight_number).toBe('UP109');
    expect(decodeResult.raw.date).toBe('10/12');
    expect(decodeResult.raw.departure_icao).toBe('NRT');
    expect(decodeResult.raw.arrival_icao).toBe('ANC');
    expect(decodeResult.raw.alternate_icao).toBe('ANC');
    expect(decodeResult.raw.arrival_runway).toBe('07R');
    expect(decodeResult.raw.alternate_runway).toBe('33');
    expect(decodeResult.raw.checksum).toBe(30195);
    expect(decodeResult.remaining.text).toBe(
      'C,0,0,0,0,0,0,1,0,0,0,709.8,048.7,758.5',
    );
    expect(decodeResult.formatted.items.length).toBe(7);
  });

  test('decodes Label 83 variant 1 (C-band)', () => {
    // https://app.airframes.io/messages/3413113024
    const text =
      'M05AUA0007KIAH,RJAA,110012, 39.12,-175.10,39001,265,-107.6, 64900';
    const decodeResult = plugin.decode({ label: '83', text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('c-band-label-83');
    expect(decodeResult.formatted.description).toBe('Airline Defined');
    expect(decodeResult.raw.flight_number).toBe('UA7');
    expect(decodeResult.raw.departure_icao).toBe('KIAH');
    expect(decodeResult.raw.arrival_icao).toBe('RJAA');
    expect(decodeResult.raw.day).toBe('11');
    expect(decodeResult.raw.position.latitude).toBe(39.12);
    expect(decodeResult.raw.position.longitude).toBe(-175.1);
    expect(decodeResult.raw.altitude).toBe(39001);
    expect(decodeResult.raw.groundspeed).toBe(265);
    expect(decodeResult.raw.heading).toBe(-107.6);
    expect(decodeResult.remaining.text).toBe('64900');
    expect(decodeResult.formatted.items.length).toBe(7);
  });

  test('decodes Label 83 variant 3 (C-band)', () => {
    // https://app.airframes.io/messages/3413346742
    const text = 'M09AXA0001001PR11013423N0556.6E11603.0000000----';
    const decodeResult = plugin.decode({ label: '83', text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('c-band-label-83');
    expect(decodeResult.formatted.description).toBe('Airline Defined');
    expect(decodeResult.raw.flight_number).toBe('XA1');
    expect(decodeResult.raw.day).toBe('11');
    expect(decodeResult.raw.position.latitude).toBe(5.943333333333333);
    expect(decodeResult.raw.position.longitude).toBe(116.05);
    expect(decodeResult.raw.altitude).toBe(0);
    expect(decodeResult.remaining.text).toBe('0----');
    expect(decodeResult.formatted.items.length).toBe(3);
  });
});
