import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_49 } from './Label_49';

describe('Label 49', () => {
  let plugin: Label_49;
  const message = { label: '49', text: '' };

  beforeEach(() => {
    plugin = new Label_49(new MessageDecoder());
  });

  test('matches qualifiers', () => {
    expect(plugin.name).toBe('label-49');
    expect(plugin.qualifiers()).toEqual({ labels: ['49'] });
  });

  test('decodes a signed body with callsign, route and time', () => {
    message.text = '01ERDCUAL770    /042300LEBLKORD\r\n+31994297.4- 11.1';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.report_code).toBe('ERDC');
    expect(result.raw.previous_segment).toBe('ER');
    expect(result.raw.next_segment).toBe('DC');
    expect(result.raw.segment_code_known).toBe(true);
    expect(result.raw.altitude).toBe(31994);
    expect(result.raw.indicated_airspeed).toBeCloseTo(297.4, 3);
    expect(result.raw.total_air_temperature).toBeCloseTo(-11.1, 3);
    expect(result.raw.callsign).toBe('UAL770');
    expect(result.raw.departure_icao).toBe('LEBL');
    expect(result.raw.arrival_icao).toBe('KORD');
    expect(result.raw.day).toBe(4);
    expect(result.raw.message_timestamp).toBe(82800);
    expect(
      result.formatted.items.find((item) => item.type === 'state_change')
        ?.value,
    ).toBe('En Route -> Descent');
  });

  test('decodes the unsigned Qatar body', () => {
    message.text = '01ICCLQTR62J/222334OTHHVGHS\r\n34946 283.1 -13.6';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.raw.report_code).toBe('ICCL');
    expect(result.raw.altitude).toBe(34946);
    expect(result.raw.indicated_airspeed).toBeCloseTo(283.1, 3);
    expect(result.raw.total_air_temperature).toBeCloseTo(-13.6, 3);
    expect(result.raw.callsign).toBe('QTR62J');
    expect(result.raw.departure_icao).toBe('OTHH');
    expect(result.raw.arrival_icao).toBe('VGHS');
  });

  test('keeps GA unexpanded', () => {
    message.text = '01APGABAW15     /212010WSSSYSSY\r\n+  207148.4+ 23.6';
    const result = plugin.decode(message);

    expect(result.raw.report_code).toBe('APGA');
    expect(result.raw.previous_segment).toBe('AP');
    expect(result.raw.next_segment).toBe('GA');
    expect(result.raw.segment_code_known).toBe(true);
    expect(result.raw.altitude).toBe(207);
    expect(
      result.formatted.items.find((item) => item.type === 'state_change')
        ?.value,
    ).toBe('Approach -> Unknown GA');
  });

  test('decodes an OOOI event and keeps the extended tail', () => {
    message.text =
      '01OFF     APZ136/211728KIADRKSI\r\n+  383182.8+ 21.1215102230851';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('partial');
    expect(result.raw.report_code).toBe('OFF');
    expect(result.raw.event).toBe('OFF');
    expect(result.raw.altitude).toBe(383);
    expect(result.raw.indicated_airspeed).toBeCloseTo(182.8, 3);
    expect(result.raw.total_air_temperature).toBeCloseTo(21.1, 3);
    expect(result.remaining.text).toBe('215102230851');
  });

  test('decodes the M##AJL variant', () => {
    message.text =
      'M18AJL010101DCAP    JAL101/222233RJTTRJOO\n\t+ 1903158.3+ 17.7';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.raw.variant).toBe('ajl');
    expect(result.raw.report_code).toBe('DCAP');
    expect(result.raw.altitude).toBe(1903);
    expect(result.raw.indicated_airspeed).toBeCloseTo(158.3, 3);
    expect(result.raw.callsign).toBe('JAL101');
    expect(result.raw.departure_icao).toBe('RJTT');
    expect(result.raw.arrival_icao).toBe('RJOO');
  });

  test('treats SWAPINITIALIZE as an event, not a pair', () => {
    message.text = '01SWAPINITIALIZE/260307********\r\n*****************';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.raw.report_code).toBe('SWAP');
    expect(result.raw.event).toBe('SWAPINITIALIZE');
    expect(result.raw.event_detail).toBe('INITIALIZE');
    expect(result.raw.previous_segment).toBeUndefined();
    expect(result.raw.callsign).toBeUndefined();
  });

  test('does not invent the meaning of EC', () => {
    message.text = '01ECERBAW171    /222305EGLLKPIT\r\n+32001264.7- 18.4';
    const result = plugin.decode(message);

    expect(result.raw.report_code).toBe('ECER');
    expect(result.raw.previous_segment).toBe('EC');
    expect(result.raw.next_segment).toBe('ER');
    expect(result.raw.segment_code_known).toBe(false);
    expect(
      result.formatted.items.find((item) => item.type === 'state_change')
        ?.value,
    ).toBe('Unknown EC -> En Route');
  });

  test('keeps masked fields empty', () => {
    message.text = '01POESBAW29C    /090618KIADEGLL\r\n+  306*****+ 13.5';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.raw.altitude).toBe(306);
    expect(result.raw.indicated_airspeed).toBeUndefined();
    expect(result.raw.total_air_temperature).toBeCloseTo(13.5, 3);
    expect(result.remaining.text).toBeUndefined();
  });

  test('decodes a fully masked OOOI header', () => {
    message.text =
      '01OUT **********/**************\r\n*****************************';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(true);
    expect(result.raw.report_code).toBe('OUT');
    expect(result.raw.event).toBe('OUT');
    expect(result.raw.altitude).toBeUndefined();
    expect(result.raw.callsign).toBeUndefined();
    expect(result.remaining.text).toContain('*');
  });

  test('does not decode other label 49 text', () => {
    message.text = 'POS Bogus message';
    const result = plugin.decode(message);

    expect(result.decoded).toBe(false);
    expect(result.decoder.decodeLevel).toBe('none');
    expect(result.message).toBe(message);
  });
});
