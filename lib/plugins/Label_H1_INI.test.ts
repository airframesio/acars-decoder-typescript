import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label_H1 INI', () => {
  let plugin: Arinc702;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes valid', () => {
    // https://app.airframes.io/messages/3401344857
    message.text =
      'INI/ID70045B,RCH2050,AJM363201271/MR2,000/AFKDOV,KBHM/TD271115,131545EE';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.tail).toBe('70045B');
    expect(decodeResult.raw.flight_number).toBe('RCH2050');
    expect(decodeResult.raw.mission_number).toBe('AJM363201271');
    expect(decodeResult.raw.sequence_number).toBe(2);
    expect(decodeResult.raw.sequence_response).toBe(0);
    expect(decodeResult.raw.departure_icao).toBe('KDOV');
    expect(decodeResult.raw.arrival_icao).toBe('KBHM');
    expect(decodeResult.raw.planned_departure_time).toBe('271115');
    expect(decodeResult.raw.estimated_departure_time).toBe('1315');
    expect(decodeResult.raw.checksum).toBe(0x45ee);
    expect(decodeResult.remaining.text).toBe('');
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.description).toBe('Initial Report');
  });

  test('#MD valid', () => {
    // https://app.airframes.io/messages/3400583424
    message.text =
      '- #MDINI/ID99206A,RCH206,AAM7029H1275/MR0,0/AFKSUU,KBUR/TD011535,1535EE66';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.tail).toBe('99206A');
    expect(decodeResult.raw.flight_number).toBe('RCH206');
    expect(decodeResult.raw.mission_number).toBe('AAM7029H1275');
    expect(decodeResult.raw.sequence_number).toBe(0);
    expect(decodeResult.raw.sequence_response).toBe(0);
    expect(decodeResult.raw.departure_icao).toBe('KSUU');
    expect(decodeResult.raw.arrival_icao).toBe('KBUR');
    expect(decodeResult.raw.planned_departure_time).toBe('011535');
    expect(decodeResult.raw.estimated_departure_time).toBe('1535');
    expect(decodeResult.raw.checksum).toBe(0xee66);
    expect(decodeResult.remaining.text).toBe('- #MD/');
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.description).toBe('Initial Report');
  });

  test('INI <invalid>', () => {
    message.text = 'INI Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message).toBe(message);
  });
});
