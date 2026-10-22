import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label H1 PRF', () => {
  let plugin: Arinc702;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes successfully', () => {
    // https://app.airframes.io/messages/7898108422
    message.text = 'PRF/TR,246,1,0,P10,102936,P8,P44,130131137,0,169,KDCA,KMCO,01O,1311,1142,SWA1500,328005,1086,1086,44136B';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.checksum).toBe(0x136b);
    expect(decodeResult.raw.off_time).toBe(37776); //10:29:36
    expect(decodeResult.raw.departure_icao).toBe('KDCA');
    expect(decodeResult.raw.arrival_icao).toBe('KMCO');
    expect(decodeResult.raw.departure_runway).toBe('01O');
    expect(decodeResult.raw.flight_number).toBe('SWA1500');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.remaining.text).toBe(',246,1,0,P10,P8,P44,130131137,0,169,1311,1142,328005,1086,1086,44');
  });


  test('does not decode invalid message', () => {
    message.text = 'PRF Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message).toBe(message);
  });
});
