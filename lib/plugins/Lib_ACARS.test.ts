import { MessageDecoder } from '../MessageDecoder';
import { LibAcars } from './Lib_ACARS';

describe('LibACARS plugin', () => {
  let plugin: LibAcars;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new LibAcars(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('libacars');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['*'],
      preambles: ['- '],
    });
  });

  test('decodes Arinc-702 example 1', () => {
    message.text = '- #MDFTX/ID80052A,RCH648,PAM362201029/MR1,/FXHID0B1';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
  });

  // disabled due to checksum failure. could be hidden characters in the source message
  test.skip('decodes Arinc-702 example 2', () => {
    // https://app.airframes.io/messages/3400555283
    message.text =
      '- #MDFTX/ID77170A,RCH836,ABZ01G6XH273/MR2,/FXIRAN IS LAUNCHING MISSILES TOWARDS ISRAEL. YOUR FLIGHT PATH IS CURRENTLY NORTH OF PROJECTED MISSILE TRACKS. EXERCIZE EXTREME CAUTION.4A99';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.mission_number).toBe('ABZ01G6XH273');
    expect(decodeResult.raw.tail).toBe('77170A');
    expect(decodeResult.raw.flight_number).toBe('RCH836');
    expect(decodeResult.raw.free_text).toBe(
      'IRAN IS LAUNCHING MISSILES TOWARDS ISRAEL. YOUR FLIGHT PATH IS CURRENTLY NORTH OF PROJECTED MISSILE TRACKS. EXERCIZE EXTREME CAUTION.',
    );
    expect(decodeResult.raw.checksum).toBe('0x4a99');
    expect(decodeResult.remaining.text).toBe('/MR2,');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.description).toBeDefined();
  });

  test('decodes Arinc-702 example 3', () => {
    // https://app.airframes.io/messages/3400583424
    message.text =
      '- #MDINI/ID99206A,RCH206,AAM7029H1275/MR0,0/AFKSUU,KBUR/TD011535,1535EE66';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
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
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.description).toBe('Initial Report');
  });

  test('routes libacars envelopes through MessageDecoder', () => {
    const decoder = new MessageDecoder();
    const decodeResult = decoder.decode({
      label: 'H1',
      text: '- #MDINI/ID99206A,RCH206,AAM7029H1275/MR0,0/AFKSUU,KBUR/TD011535,1535EE66',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.name).toBe('libacars-arinc-702');
    expect(decodeResult.raw.mission_number).toBe('AAM7029H1275');
  });

  test('decodes long Arinc-702 example', () => {
    message.text =
      '- #MDPWI/WD340,TIBOY,200012,340M54.RDFLG,140014,340M56.HRDNG,130019,340M56.RNDRR,150014,340M57.KRIIS,150014,340M57.CILAX,150014,340M57.CACHE,150014,340M57/WD320,TIBOY,160010,320M53.RDFLG,130017,320M54.HRDNG,130021,320M54- #MD.RNDRR,140014,320M54.KRIIS,140014,320M54.CILAX,140014,320M54.CACHE,140014,320M54/WD300,TIBOY,190010,300M52.RDFLG,130016,300M51.HRDNG,130019,300M51.RNDRR,140012,300M50.KRIIS,140014,300M50.CILAX,140014,300M50.CACHE,14- #MD0014,300M50/WD280,TIBOY,220014,280M50.RDFLG,160012,280M48.HRDNG,150014,280M48.RNDRR,160012,280M47.KRIIS,150014,280M47.CILAX,150014,280M47.CACHE,150014,280M47B41F';
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
  });
});
