import { MessageDecoder } from '../MessageDecoder';
import { Label_4J_POS } from './Label_4J_POS';

describe('Label 4J POS', () => {
  let plugin: Label_4J_POS;
  const message = { label: '4J', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4J_POS(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-4j-pos');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['4J'],
      preambles: ['POS/'],
    });
  });

  test('decodes inmarsat', () => {
    // https://app.airframes.io/messages/2434848463
    message.text =
      'POS/ID91459S,BANKR31,/DC03032024,142813/MR64,0/ET31539/PSN39277W077359,142800,240,N39300W077110,031430,N38560W077150,M28,27619,MT370/CG311,160,350/FB732/VR329071';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.raw.message_timestamp).toBe(1709476093);
    expect(decodeResult.raw.tail).toBe('91459S');
    expect(decodeResult.raw.flight_number).toBe('BANKR31');
    expect(decodeResult.raw.mission_number).toBe('');
    expect(decodeResult.raw.message_date).toBe('03032024');
    expect(decodeResult.raw.day).toBe(3);
    expect(decodeResult.raw.eta_time).toBe(56340);
    expect(decodeResult.raw.position.latitude).toBeCloseTo(39.462, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-77.598, 3);
    expect(decodeResult.raw.altitude).toBe(24000);
    expect(decodeResult.raw.route.waypoints.length).toBe(3);
    expect(decodeResult.raw.outside_air_temperature).toBe(-28);
    expect(decodeResult.raw.center_of_gravity).toBe(31.1);
    expect(decodeResult.raw.cg_lower_limit).toBe(16);
    expect(decodeResult.raw.cg_upper_limit).toBe(35);
    expect(decodeResult.raw.fuel_on_board).toBe(732);
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.formatted.items.length).toBe(14);
    expect(decodeResult.remaining.text).toBe('MR64,0,27619,MT370');
  });

  test('decodes <invalid>', () => {
    message.text = 'POS/ Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
