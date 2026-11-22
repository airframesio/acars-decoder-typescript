import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label 1J/2J FTX', () => {
  let plugin: Arinc702;
  let message = { label: '1J', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes Label 1J', () => {
    // https://app.airframes.io/messages/4178692503
    message.text =
      'FTX/ID50007B,RCH4086,ABB02R70E037/MR6,/FX4 QTR PHILLY UP 37-6307A';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.tail).toBe('50007B');
    expect(decodeResult.raw.flight_number).toBe('RCH4086');
    expect(decodeResult.raw.mission_number).toBe('ABB02R70E037');
    expect(decodeResult.raw.sequence_number).toBe(6);
    expect(decodeResult.raw.text).toBe('4 QTR PHILLY UP 37-6');
    expect(decodeResult.raw.checksum).toBe(0x307a);
    expect(decodeResult.formatted.description).toBe('Free Text');
    expect(decodeResult.formatted.items.length).toBe(6);
  });

  // Disabled due to checksum mismatch. Possibly copy-paste issue due to non-ascii characters in message?
  test('decodes Label 2J', () => {
    // https://app.airframes.io/messages/4178362466
    message.text =
      'M74AMC4086FTX/ID50007B,RCH4086,ABB02R70E037/DC10022025,011728/MR049,/FXGOOD EVENING PLEASE PASS US THE SUPER BOWL SCORE WHEN ABLE. THANK YOU/FB1791/VR0328D70';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.tail).toBe('50007B');
    expect(decodeResult.raw.flight_number).toBe('RCH4086');
    expect(decodeResult.raw.mission_number).toBe('ABB02R70E037');
    expect(decodeResult.raw.message_timestamp).toBe(1739150248);
    expect(decodeResult.raw.sequence_number).toBe(49);
    expect(decodeResult.raw.fuel_on_board).toBe(1791);
    expect(decodeResult.raw.text).toBe(
      'GOOD EVENING PLEASE PASS US THE SUPER BOWL SCORE WHEN ABLE. THANK YOU',
    );
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.raw.checksum).toBe(0x8d70);
    expect(decodeResult.formatted.items.length).toBe(8);
    expect(decodeResult.remaining.text).toBe('M74/');
  });

  test('decodes <invalid>', () => {
    message.text = 'FTX Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message).toBe(message);
  });
});

// AMC free text never contains '/' or ','; the sender replaces them with '(' and the
// decoder keeps the text as sent, since '(' can stand for either.
// https://app.airframes.io/messages/7755431084
describe('Label 1J military FTX with ( substitutions', () => {
  test('keeps T(O as sent', () => {
    const result = new MessageDecoder().decode({
      label: '1J',
      text: 'FTX/ID543615,CANNY52,202609300515/MR7,/FXTO ESP AND GIBAJF502 FLT FOR TOMORROW WILL BE ACTIVATED.ETD WILL BE 0100Z SO FAR.SO ASC HQ IS NOW REQUESTING TO CANX 4TH PERIOD TODAY.BTW CONFIRM T(O FUEL OF JF502 FROM RJOH IS 115K.0D88',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('Free Text');
    expect(result.raw.tail).toBe('543615');
    expect(result.raw.flight_number).toBe('CANNY52');
    expect(result.raw.text).toBe(
      'TO ESP AND GIBAJF502 FLT FOR TOMORROW WILL BE ACTIVATED.ETD WILL BE 0100Z SO FAR.SO ASC HQ IS NOW REQUESTING TO CANX 4TH PERIOD TODAY.BTW CONFIRM T(O FUEL OF JF502 FROM RJOH IS 115K.',
    );
    // 202609300515 is not a mission number (day 515), so none is decoded
    expect(result.raw.mission).toBeUndefined();
  });
});
