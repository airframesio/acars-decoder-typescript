import { decode } from 'node:punycode';
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
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.tail).toBe('53147T');
    expect(decodeResult.raw.flight_number).toBe('RCH140');
    expect(decodeResult.raw.message_timestamp).toBe(1772573956);
    expect(decodeResult.raw.sequence_number).toBe(7);
    expect(decodeResult.raw.engine_start_time).toBe(317520); //16:12 on day 3
    expect(decodeResult.raw.start_fuel).toBe(42000);
    expect(decodeResult.raw.engine_stop_time).toBe(337140); //21:39 on day 3
    expect(decodeResult.raw.out_time).toBe(318180); //16:23 on day 3
    expect(decodeResult.raw.out_fuel).toBe(41600);
    expect(decodeResult.raw.off_time).toBe(318660); // 16:31 on day 3
    expect(decodeResult.raw.off_fuel).toBe(41300);
    expect(decodeResult.raw.on_time).toBe(336600); // 21:30 on day 3
    expect(decodeResult.raw.on_fuel).toBe(21200);
    expect(decodeResult.raw.in_time).toBe(337140); // 21:39 on day 3
    expect(decodeResult.raw.in_fuel).toBe(20900);
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.raw.checksum).toBe(0x9519);
    expect(decodeResult.formatted.items.length).toBe(16);
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
    expect(decodeResult.raw.engine_start_time).toBe(383880); //10:38 on day 4
    expect(decodeResult.raw.start_fuel).toBe(300400);
    expect(decodeResult.raw.engine_stop_time).toBe(427800); //22:50 on day 4
    expect(decodeResult.raw.out_time).toBe(384420); //10:47 on day 4
    expect(decodeResult.raw.out_fuel).toBe(300000);
    expect(decodeResult.raw.off_time).toBe(384900); // 10:55 on day 4
    expect(decodeResult.raw.off_fuel).toBe(298500);
    expect(decodeResult.raw.on_time).toBe(427500); // 22:45 on day 4
    expect(decodeResult.raw.on_fuel).toBe(52600);
    expect(decodeResult.raw.in_time).toBe(427800); // 22:50 on day 4
    expect(decodeResult.raw.in_fuel).toBe(52100);
    expect(decodeResult.raw.version).toBe(3.2);
    expect(decodeResult.raw.checksum).toBe(0x0e8b);
    expect(decodeResult.formatted.items.length).toBe(16);
    expect(decodeResult.remaining.text).toBe('M90/');
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
