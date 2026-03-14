import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label 2A preamble SUM', () => {
  let plugin: Arinc702;
  const message = { label: '2A', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes ACARS variant', () => {
    // https://app.airframes.io/messages/6245474934
    message.text =
      'SUM/ID53147T,RCH140,/DC03032026,213916/MR7,/SM031612,420,032139,031623,416,031631,413,032130,212,032139,209/VR329519';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.tail).toBe('53147T');
    expect(decodeResult.raw.flight_number).toBe('RCH140');
    expect(decodeResult.raw.message_timestamp).toBe(1772573956);
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.raw.checksum).toBe(0x9519);
    expect(decodeResult.formatted.items.length).toBe(5);
    // Only check formatted.items.length and description, rest are raw fields
    // Remaining text may be set by ResultFormatter. Check actual value.
    expect(decodeResult.remaining.text).toBe('SM031612,420,032139,031623,416,031631,413,032130,212,032139,209');
  });

  test('decodes Inmarsat variant', () => {
    // https://app.airframes.io/messages/6251537386
    message.text =
      'M90AMC2010SUM/ID70044B,RCH2010,PVZF504QP059/DC04032026,225050/MR196,/SM041038,3004,042250,041047,3000,041055,2985,042245,0526,042250,0521/VR0320E8B';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.tail).toBe('70044B');
    expect(decodeResult.raw.flight_number).toBe('RCH2010');
    expect(decodeResult.raw.mission_number).toBe('PVZF504QP059');
    expect(decodeResult.raw.message_timestamp).toBe(1772664650);
    expect(decodeResult.raw.sequence_number).toBe(196);
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.raw.checksum).toBe(0x0e8b);
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.remaining.text).toContain('M90');
  });

  test('does not decode invalid message', () => {
    message.text = 'PER Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message).toBe(message);
  });
});
