import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Label_H1 INI', () => {
  let plugin: Arinc702;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('decodes valid', () => {
    // https://app.airframes.io/messages/3401344857
    message.text =
      'INI/ID70045B,RCH2050,AJM363201271/MR2,000/AFKDOV,KBHM/TD271115,131545EE';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.tail).toBe('70045B');
    expect(decodeResult.raw.flight_number).toBe('RCH2050');
    expect(decodeResult.raw.mission_number).toBe('AJM363201271');
    expect(decodeResult.raw.sequence_number).toBe(2);
    expect(decodeResult.raw.sequence_response).toBe(0);
    expect(decodeResult.raw.departure_icao).toBe('KDOV');
    expect(decodeResult.raw.arrival_icao).toBe('KBHM');
    expect(decodeResult.raw.planned_departure_time).toBe('271115');
    expect(decodeResult.raw.estimated_departure_time).toBe('1315');
    expect(decodeResult.raw.checksum).toBe(0x45ee);
    expect(decodeResult.remaining.text).toBe('');
    expect(decodeResult.formatted.items.length).toBe(10);
    expect(decodeResult.formatted.description).toBe('Initial Report');
    const sequenceNumberItem = decodeResult.formatted.items.find(
      (item) => item.code === 'SEQ',
    );
    const sequenceResponseItem = decodeResult.formatted.items.find(
      (item) => item.code === 'SEQ_RESP',
    );
    expect(sequenceNumberItem).toBeDefined();
    expect(sequenceNumberItem?.value).toBe('2');
    expect(sequenceResponseItem).toBeDefined();
    expect(sequenceResponseItem?.value).toBe('0');
  });

  test('INI <invalid>', () => {
    message.text = 'INI Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message).toBe(message);
  });
});

// Military (AMC-format) INI reports seen on Airframes, 2026-11-19 to 2026-11-21
describe('INI mission numbers', () => {
  const decoder = new MessageDecoder();

  test('INI with mission number', () => {
    const result = decoder.decode({
      label: 'H1',
      text: '- #MDINI/ID88197A,RCH4913,AVYF913YT321/MR0,0/AFOTBH,ETAD/TD172129,0255E534',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('Initial Report');
    expect(result.raw.tail).toBe('88197A');
    expect(result.raw.flight_number).toBe('RCH4913');
    expect(result.raw.mission_number).toBe('AVYF913YT321');
    expect(result.raw.mission).toEqual({
      value: 'AVYF913YT321',
      prefix: 'AVY',
      basic: 'F913',
      suffix: 'YT',
      day_of_year: 321,
    });
    expect(result.raw.departure_icao).toBe('OTBH');
    expect(result.raw.arrival_icao).toBe('ETAD');
    const msn = result.formatted.items.find((i) => i.code === 'MSN');
    expect(msn?.value).toBe('AVY F913 YT 321');
  });

  test('INI on label 1B with empty TD', () => {
    const result = decoder.decode({
      label: '1B',
      text: 'INI/ID25756T,RCH469,GBB22X10B322/MR0,1/AFCYFB,BGTL/TD,13306BD2',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.mission?.day_of_year).toBe(322);
    expect(result.raw.departure_icao).toBe('CYFB');
    expect(result.raw.arrival_icao).toBe('BGTL');
  });

  test('placeholder mission numbers are not parsed', () => {
    const result = decoder.decode({
      label: 'H1',
      text: '- #MDINI/IDA97450,ASY822,COLLINSAM123/MR1,1/AFKBWI,KJFK/TD210314,03146209',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.mission_number).toBe('COLLINSAM123');
    expect(result.raw.mission).toBeUndefined();
  });
});
