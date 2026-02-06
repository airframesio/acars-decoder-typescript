import { MessageDecoder } from '../MessageDecoder';
import { Label_1L_3Line } from './Label_1L_3-line';

describe('Label_1L 3-line', () => {
  let plugin: Label_1L_3Line;
  const message = { label: '1L', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_1L_3Line(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-1l-3-line');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['1L'],
    });
  });

  test('decodes variant 1', () => {
    message.text = '00018213200/GS 411500/DEP MDPC/DES CYYZ/ETA 0120/GW 479/ALT 39002' + '\r\n' +
      'CAS 229/SAT - 59.0/FN SWG9040/TFQ 48/DAY 22OCT24/UTC 002714' + '\r\n' +
      'LON W 78.289/LAT N 39.556/WD  20/WS  13'
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('MDPC');
    expect(decodeResult.raw.arrival_icao).toBe('CYYZ');
    expect(decodeResult.raw.eta_time).toBe(4800);
    expect(decodeResult.raw.altitude).toBe(39002);
    expect(decodeResult.raw.flight_number).toBe('SWG9040');
    expect(decodeResult.raw.message_timestamp).toBe(1729556834);
    expect(decodeResult.raw.position.latitude).toBe(39.556);
    expect(decodeResult.raw.position.longitude).toBe(-78.289);
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('MDPC');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('CYYZ');
    expect(decodeResult.formatted.items[2].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[2].value).toBe('01:20:00');
    expect(decodeResult.formatted.items[3].label).toBe('Altitude');
    expect(decodeResult.formatted.items[3].value).toBe('39002 feet');
    expect(decodeResult.formatted.items[4].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[4].value).toBe('SWG9040');
    expect(decodeResult.formatted.items[5].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[5].value).toBe('39.556 N, 78.289 W');
    expect(decodeResult.remaining.text).toBe('00018213200/GS 411500/GW 479/CAS 229/SAT - 59.0/TFQ 48/WD  20/WS  13');
  });

  test('decodes no position', () => {
    message.text = '00086213200/GS 497000/DEP CYUL/DES MDPC/ETA 1705/GW 700/ALT 37002' + '\r\n' +
      'CAS/SAT   15.0/FN SWG4426/TFQ 111/DAY 26SEP24/UTC 135139' + '\r\n' +
      'LON MMMM.MMM/LAT MMMM.MMM/WD ---/WS ---'
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.departure_icao).toBe('CYUL');
    expect(decodeResult.raw.arrival_icao).toBe('MDPC');
    expect(decodeResult.raw.eta_time).toBe(61500);
    expect(decodeResult.raw.altitude).toBe(37002);
    expect(decodeResult.raw.flight_number).toBe('SWG4426');
    expect(decodeResult.raw.message_timestamp).toBe(1727358699);
    expect(decodeResult.raw.position).toBeUndefined();
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Origin');
    expect(decodeResult.formatted.items[0].value).toBe('CYUL');
    expect(decodeResult.formatted.items[1].label).toBe('Destination');
    expect(decodeResult.formatted.items[1].value).toBe('MDPC');
    expect(decodeResult.formatted.items[2].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[2].value).toBe('17:05:00');
    expect(decodeResult.formatted.items[3].label).toBe('Altitude');
    expect(decodeResult.formatted.items[3].value).toBe('37002 feet');
    expect(decodeResult.formatted.items[4].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[4].value).toBe('SWG4426');
    expect(decodeResult.remaining.text).toBe('00086213200/GS 497000/GW 700/CAS /SAT   15.0/TFQ 111/WD ---/WS ---');
  });

  test('does not decode <invalid>', () => {

    message.text = 'POS Bogus Message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-1l-3-line');
    expect(decodeResult.formatted.description).toBe('Position Report');
  });
});