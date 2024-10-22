import { MessageDecoder } from '../MessageDecoder';
import { Label_5Z_Slash } from './Label_5Z_Slash';

describe('Label 5Z', () => {
  let plugin: Label_5Z_Slash;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_5Z_Slash(decoder);
  });

  test('/ matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-5z-slash');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['5Z'],
      preambles: ['/'],
    });
  });


  test('/TXT', () => {
    const text = '/TXT\r\nDID U GET THE TIMES';
    const decodeResult = plugin.decode({ text: text });
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.airline).toBeUndefined()
    expect(decodeResult.raw.text).toBe('DID U GET THE TIMES');
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.formatted.items[0].label).toBe('Text Message');
    expect(decodeResult.formatted.items[0].value).toBe('DID U GET THE TIMES');
  });

  test('/B3 variant 1', () => {
    const text = '/B3 ATLIAD 14 R1C G1273';
    const decodeResult = plugin.decode({ text: text });
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.airline).toBe('United Airlines');
    expect(decodeResult.raw.message_type).toBe('B3');
    expect(decodeResult.raw.day_of_month).toBe(14);
    expect(decodeResult.raw.departure_iata).toBe('ATL');
    expect(decodeResult.raw.arrival_iata).toBe('IAD');
    expect(decodeResult.raw.arrival_runway).toBe('1C');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Airline');
    expect(decodeResult.formatted.items[0].value).toBe('United Airlines');
    expect(decodeResult.formatted.items[1].label).toBe('Message Type');
    expect(decodeResult.formatted.items[1].value).toBe('Request Departure Clearance (B3)');
    expect(decodeResult.formatted.items[2].label).toBe('Origin');
    expect(decodeResult.formatted.items[2].value).toBe('ATL');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('IAD');
    expect(decodeResult.formatted.items[4].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[4].value).toBe('1C');
    expect(decodeResult.remaining.text).toBe('G1273');
  });

  test('/B3 variant 2', () => {
    const text = '/B3 DCAORD 14 R27C';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.airline).toBe('United Airlines');
    expect(decodeResult.raw.message_type).toBe('B3');
    expect(decodeResult.raw.day_of_month).toBe(14);
    expect(decodeResult.raw.departure_iata).toBe('DCA');
    expect(decodeResult.raw.arrival_iata).toBe('ORD');
    expect(decodeResult.raw.arrival_runway).toBe('27C');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Airline');
    expect(decodeResult.formatted.items[0].value).toBe('United Airlines');
    expect(decodeResult.formatted.items[1].label).toBe('Message Type');
    expect(decodeResult.formatted.items[1].value).toBe('Request Departure Clearance (B3)');
    expect(decodeResult.formatted.items[2].label).toBe('Origin');
    expect(decodeResult.formatted.items[2].value).toBe('DCA');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('ORD');
    expect(decodeResult.formatted.items[4].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[4].value).toBe('27C');
  });

  test('/B3 request', () => {
    const text = '/B3 TO DATA REQ    / KIAH KBOS 14 152532 R4R /---- BOPT/OFF C0.000/1 LNO  G1600';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.airline).toBe('United Airlines');
    expect(decodeResult.raw.message_type).toBe('B3');
    expect(decodeResult.raw.day_of_month).toBe(14);
    expect(decodeResult.raw.time_of_day).toBe(55532);
    expect(decodeResult.raw.departure_icao).toBe('KIAH');
    expect(decodeResult.raw.arrival_icao).toBe('KBOS');
    expect(decodeResult.raw.arrival_runway).toBe('4R');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Airline');
    expect(decodeResult.formatted.items[0].value).toBe('United Airlines');
    expect(decodeResult.formatted.items[1].label).toBe('Message Type');
    expect(decodeResult.formatted.items[1].value).toBe('Request Departure Clearance (B3)');
    expect(decodeResult.formatted.items[2].label).toBe('Origin');
    expect(decodeResult.formatted.items[2].value).toBe('KIAH');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('KBOS');
    expect(decodeResult.formatted.items[4].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[4].value).toBe('15:25:32');
    expect(decodeResult.formatted.items[5].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[5].value).toBe('4R');
    expect(decodeResult.remaining.text).toBe('---- BOPT/OFF C0.000/1 LNO  G1600');
  });

  test('/ET variant 1', () => {
    // https://app.airframes.io/messages/3459203875
    const text = '/ET EXP TIME       / KEWR KBNA 20 122559/EON 1336 AUTO';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.airline).toBe('United Airlines');
    expect(decodeResult.raw.time_of_day).toBe(44759);
    expect(decodeResult.raw.day_of_month).toBe(20);
    expect(decodeResult.raw.departure_icao).toBe('KEWR');
    expect(decodeResult.raw.arrival_icao).toBe('KBNA');
    expect(decodeResult.raw.eta_time).toBe(48960);
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[2].label).toBe('Origin');
    expect(decodeResult.formatted.items[2].value).toBe('KEWR');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('KBNA');
    expect(decodeResult.formatted.items[4].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[4].value).toBe('12:25:59');
    expect(decodeResult.formatted.items[5].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[5].value).toBe('13:36:00');

    expect(decodeResult.remaining.text).toBe('AUTO');
  });

  test('/C3 variant1', () => {
    const text = '/C3 IADDFW';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.airline).toBe('United Airlines');
    expect(decodeResult.raw.departure_iata).toBe('IAD');
    expect(decodeResult.raw.arrival_iata).toBe('DFW');
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe('Airline');
    expect(decodeResult.formatted.items[0].value).toBe('United Airlines');
    expect(decodeResult.formatted.items[1].label).toBe('Message Type');
    expect(decodeResult.formatted.items[1].value).toBe('Off Message (C3)');
    expect(decodeResult.formatted.items[2].label).toBe('Origin');
    expect(decodeResult.formatted.items[2].value).toBe('IAD');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('DFW');
  });

  test('/C3 Request', () => {
    const text = '/C3 GATE REQ       / KBNA KEWR 22 115400 0554 ---- ---- ---- ----';
    const decodeResult = plugin.decode({ text: text });
    console.log(JSON.stringify(decodeResult, null, 2));
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.airline).toBe('United Airlines');
    expect(decodeResult.raw.time_of_day).toBe(42840);
    expect(decodeResult.raw.day_of_month).toBe(22);
    expect(decodeResult.raw.departure_icao).toBe('KBNA');
    expect(decodeResult.raw.arrival_icao).toBe('KEWR');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Airline');
    expect(decodeResult.formatted.items[0].value).toBe('United Airlines');
    expect(decodeResult.formatted.items[1].label).toBe('Message Type');
    expect(decodeResult.formatted.items[1].value).toBe('Off Message (C3)');
    expect(decodeResult.formatted.items[2].label).toBe('Origin');
    expect(decodeResult.formatted.items[2].value).toBe('KBNA');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('KEWR');
    expect(decodeResult.formatted.items[4].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[4].value).toBe('11:54:00');

    expect(decodeResult.remaining.text).toBe('0554 ---- ---- ---- ----');
  });

  test('/ does not decode invalid', () => {

    const text = '/ Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.remaining.text).toBe(text);
  });
});