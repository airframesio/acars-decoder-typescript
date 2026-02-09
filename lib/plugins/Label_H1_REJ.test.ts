import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label H1 Preamble REJ', () => {
  let plugin: Label_H1;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });

  test('decodes PWI variant 1', () => {
    message.text = 'REJPWI,141147,A,70,MCRAY,97E16';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x7e16);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.remaining.text).toBe('141147,A,70,MCRAY,9');
  });

  test('decodes PWI variant 2', () => {
    message.text =
      '/HDQDLUA.REJPWI,104916,053,,CB007,CLIMB.053,,CB007,CLIMB.053,,CB007,CLIMB.053,,CB007,CLIMB.053,,CB007,CRUISE/GAHDQDLUA/TS113028,070226FE61';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.ground_address).toBe('HDQDLUA');
    expect(decodeResult.raw.checksum).toBe(0xfe61);
    expect(decodeResult.formatted.items.length).toBe(2);
    expect(decodeResult.remaining.text).toBe(
      '/HDQDLUA.104916,053,,CB007,CLIMB.053,,CB007,CLIMB.053,,CB007,CLIMB.053,,CB007,CLIMB.053,,CB007,CRUISE',
    );
  });

  test('decodes POS variant 1', () => {
    message.text =
      'REJPOS,100719,130,219,RF005,N36089W076173/TS100719,090226E850';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0xe850);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.remaining.text).toBe(
      '100719,130,219,RF005,N36089W076173',
    );
  });

  test('decodes POS variant 2', () => {
    message.text =
      'REJPOS,041509,130,219,RF005,SWANN.130,219,RF005,BROSS.130,219,RF005,MYFOO.130,219,RF005,YAHOO.130,219,RF005,4650N.130,219,RF005,4840N.130,219,RF005,5030N.130,219,RF005,5120NA55A';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0xa55a);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.remaining.text).toBe(
      '041509,130,219,RF005,SWANN.130,219,RF005,BROSS.130,219,RF005,MYFOO.130,219,RF005,YAHOO.130,219,RF005,4650N.130,219,RF005,4840N.130,219,RF005,5030N.130,219,RF005,5120N',
    );
  });
});
