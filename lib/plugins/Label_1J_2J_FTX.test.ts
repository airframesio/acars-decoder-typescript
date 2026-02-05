import { MessageDecoder } from '../MessageDecoder';
import { Label_1J_2J_FTX } from './Label_1J_2J_FTX';

describe('Label 1J/2J FTX', () => {

  let plugin: Label_1J_2J_FTX;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_1J_2J_FTX(decoder);
  });


  test('decodes Label 1J', () => {
    // https://app.airframes.io/messages/4178692503
    const text = 'FTX/ID50007B,RCH4086,ABB02R70E037/MR6,/FX4 QTR PHILLY UP 37-6307A'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.mission_number).toBe('ABB02R70E037');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Tail');
    expect(decodeResult.formatted.items[0].value).toBe('50007B');
    expect(decodeResult.formatted.items[1].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[1].value).toBe('RCH4086');
    expect(decodeResult.formatted.items[2].label).toBe('Free Text');
    expect(decodeResult.formatted.items[2].value).toBe('4 QTR PHILLY UP 37-6');
    expect(decodeResult.formatted.items[3].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[3].value).toBe('0x307a');
    expect(decodeResult.remaining.text).toBe('MR6,');
  });

  // Disabled due to checksum mismatch. Possibly copy-paste issue due to non-ascii characters in message?
  test('decodes Label 2J', () => {
    // https://app.airframes.io/messages/4178362466
    const text = 'M74AMC4086FTX/ID50007B,RCH4086,ABB02R70E037/DC10022025,011728/MR049,/FXGOOD EVENING PLEASE PASS US THE SUPER BOWL SCORE WHEN ABLE. THANK YOU/FB1791/VR0328D70'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.tail).toBe('50007B');
    expect(decodeResult.raw.flight_number).toBe('RCH4086');
    expect(decodeResult.raw.mission_number).toBe('ABB02R70E037');
    expect(decodeResult.raw.message_timestamp).toBe(1759367848);
    expect(decodeResult.raw.fuel_on_board).toBe(1791);
    expect(decodeResult.raw.freetext).toBe('GOOD EVENING PLEASE PASS US THE SUPER BOWL SCORE WHEN ABLE. THANK YOU');
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.raw.checksum).toBe(0x8D70);
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.remaining.text).toBe('M74/MR049,');
  });

  test('decodes <invalid>', () => {

    const text = 'FTX Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message.text).toBe(text);
  });
});
