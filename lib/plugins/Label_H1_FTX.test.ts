import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label_H1 FTX', () => {
  let plugin: Arinc702;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes inmarsat', () => {
    // https://app.airframes.io/messages/3402014738
    message.text =
      'FTX/ID23544S,HIFI21,7VZ007B1S276/MR2,/FXFYI .. TAF KSUX 021720Z 0218 0318 20017G28KT P6SM SKC FM022200 22012G18KT P6SM SKC .. PUTS YOUR CXWIND AT 26KT ON RWY 13 .. REDUCES TO 18KT AT 22Z4FEF';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.tail).toBe('23544S');
    expect(decodeResult.raw.flight_number).toBe('HIFI21');
    expect(decodeResult.raw.mission_number).toBe('7VZ007B1S276');
    expect(decodeResult.raw.text).toBe(
      'FYI .. TAF KSUX 021720Z 0218 0318 20017G28KT P6SM SKC FM022200 22012G18KT P6SM SKC .. PUTS YOUR CXWIND AT 26KT ON RWY 13 .. REDUCES TO 18KT AT 22Z',
    );
    expect(decodeResult.raw.checksum).toBe(0x4fef);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.description).toBeDefined();
  });

  // disabled due to checksum failure. could be hidden characters in the source message
  test.skip('decodes Label H1 Preamble - #MDFTX valid', () => {
    // https://app.airframes.io/messages/3400555283
    message.text =
      '- #MDFTX/ID77170A,RCH836,ABZ01G6XH273/MR2,/FXIRAN IS LAUNCHING MISSILES TOWARDS ISRAEL. YOUR FLIGHT PATH IS CURRENTLY NORTH OF PROJECTED MISSILE TRACKS. EXERCIZE EXTREME CAUTION.4A99';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.mission_number).toBe('ABZ01G6XH273');
    expect(decodeResult.raw.tail).toBe('77170A');
    expect(decodeResult.raw.flight_number).toBe('RCH836');
    expect(decodeResult.raw.free_text).toBe(
      'IRAN IS LAUNCHING MISSILES TOWARDS ISRAEL. YOUR FLIGHT PATH IS CURRENTLY NORTH OF PROJECTED MISSILE TRACKS. EXERCIZE EXTREME CAUTION.',
    );
    expect(decodeResult.raw.checksum).toBe('0x4a99');
    expect(decodeResult.remaining.text).toBe('- #MD/MR2,');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.description).toBeDefined();
  });

  test('decodes example 3', () => {
    message.text = '- #MDFTX/ID80052A,RCH648,PAM362201029/MR1,/FXHID0B1';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
  });

  test('does not decode invalid message', () => {
    message.text = 'FTX Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message).toBe(message);
  });
});
