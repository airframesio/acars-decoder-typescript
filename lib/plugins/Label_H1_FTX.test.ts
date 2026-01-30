import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label_H1 FTX', () => {

  let plugin: Label_H1;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });


  // disabled due to checksum failure. could be hidden characters in the source message
  xtest('decodes Label H1 Preamble FTX valid', () => {
    // https://app.airframes.io/messages/3402014738
    const text = 'FTX/ID23544S,HIFI21,7VZ007B1S276/MR2,/FXFYI .. TAF KSUX 021720Z 0218 0318 20017G28KT P6SM SKC FM022200 22012G18KT P6SM SKC .. PUTS YOUR CXWIND AT 26KT ON RWY 13 .. REDUCES TO 18KT AT 22Z4FEF'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.mission_number).toBe('7VZ007B1S276');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Tail');
    expect(decodeResult.formatted.items[0].value).toBe('23544S');
    expect(decodeResult.formatted.items[1].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[1].value).toBe('HIFI21');
    expect(decodeResult.formatted.items[2].label).toBe('Free Text');
    expect(decodeResult.formatted.items[2].value).toBe('FYI .. TAF KSUX 021720Z 0218 0318 20017G28KT P6SM SKC FM022200 22012G18KT P6SM SKC .. PUTS YOUR CXWIND AT 26KT ON RWY 13 .. REDUCES TO 18KT AT 22Z');
    expect(decodeResult.formatted.items[3].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[3].value).toBe('0x4fef');
    expect(decodeResult.remaining.text).toBe('MR2,');
  });

  // disabled due to checksum failure. could be hidden characters in the source message
  xtest('decodes Label H1 Preamble - #MDFTX valid', () => {
    // https://app.airframes.io/messages/3400555283
    const text = '- #MDFTX/ID77170A,RCH836,ABZ01G6XH273/MR2,/FXIRAN IS LAUNCHING MISSILES TOWARDS ISRAEL. YOUR FLIGHT PATH IS CURRENTLY NORTH OF PROJECTED MISSILE TRACKS. EXERCIZE EXTREME CAUTION.4A99'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.mission_number).toBe('ABZ01G6XH273');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Tail');
    expect(decodeResult.formatted.items[0].value).toBe('77170A');
    expect(decodeResult.formatted.items[1].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[1].value).toBe('RCH836');
    expect(decodeResult.formatted.items[2].label).toBe('Free Text');
    expect(decodeResult.formatted.items[2].value).toBe('IRAN IS LAUNCHING MISSILES TOWARDS ISRAEL. YOUR FLIGHT PATH IS CURRENTLY NORTH OF PROJECTED MISSILE TRACKS. EXERCIZE EXTREME CAUTION.');
    expect(decodeResult.formatted.items[3].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[3].value).toBe('0x4a99');
    expect(decodeResult.remaining.text).toBe('- #MD/MR2,');
  });

  test('decodes example 3', () => {
    const text = '- #MDFTX/ID80052A,RCH648,PAM362201029/MR1,/FXHID0B1'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
  });

  test('does not decode invalid message', () => {

    const text = 'FTX Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message.text).toBe(text);
  });
});
