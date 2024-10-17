import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label_H1 INI', () => {

  let plugin: Label_H1;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });

  test('decodes valid', () => {
    // https://app.airframes.io/messages/3401344857
    const text = 'INI/ID70045B,RCH2050,AJM363201271/MR2,000/AFKDOV,KBHM/TD271115,131545EE'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.flight_number).toBe('RCH2050');
    expect(decodeResult.raw.mission_number).toBe('AJM363201271');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Tail');
    expect(decodeResult.formatted.items[0].value).toBe('70045B');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KDOV');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KBHM');
    expect(decodeResult.formatted.items[3].label).toBe('Planned Departure Time');
    expect(decodeResult.formatted.items[3].value).toBe('YYYY-MM-27T11:15:00Z');
    expect(decodeResult.formatted.items[4].label).toBe('Estimated Departure Time');
    expect(decodeResult.formatted.items[4].value).toBe('13:15');
    expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[5].value).toBe('0x45ee');
    expect(decodeResult.remaining.text).toBe('/MR2,000');
  });

  test('#MD valid', () => {
    // https://app.airframes.io/messages/3400583424
    const text = '- #MDINI/ID99206A,RCH206,AAM7029H1275/MR0,0/AFKSUU,KBUR/TD011535,1535EE66'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.flight_number).toBe('RCH206');
    expect(decodeResult.raw.mission_number).toBe('AAM7029H1275');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Tail');
    expect(decodeResult.formatted.items[0].value).toBe('99206A');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KSUU');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KBUR');
    expect(decodeResult.formatted.items[3].label).toBe('Planned Departure Time');
    expect(decodeResult.formatted.items[3].value).toBe('YYYY-MM-01T15:35:00Z');
    expect(decodeResult.formatted.items[4].label).toBe('Estimated Departure Time');
    expect(decodeResult.formatted.items[4].value).toBe('15:35');
    expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[5].value).toBe('0xee66');
    expect(decodeResult.remaining.text).toBe('- #MD/MR0,0'); // FIXME - should start with-#MD, (no I)
  });

  test('INI <invalid>', () => {

    const text = 'INI Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Flight Plan Initial Report');
    expect(decodeResult.message.text).toBe(text);
  });
});