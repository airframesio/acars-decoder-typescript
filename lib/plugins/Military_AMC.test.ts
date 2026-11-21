import { describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { MissionNumberUtils } from '../utils/mission_number';

// Real military (AMC-format) messages seen on Airframes, 2026-11-19 to 2026-11-21.
describe('Military AMC messages', () => {
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

  test('INI with empty TD', () => {
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

  test('POS with wind, mach and true airspeed', () => {
    const result = decoder.decode({
      label: 'H1',
      text: 'F35AMCFAMC#M2BPOS/ID66162A,RCH3245,PAM7887W2324/DC20112026,161626/MR71,/ET201743/PSN31364E124002,161625,350,SADLI,201621,PONIK,M48,259144,M767T449/CG362,,/FB636/VR320012',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.mission?.basic).toBe('7887');
    expect(result.raw.altitude).toBe(35000);
    expect(result.raw.outside_air_temperature).toBe(-48);
    expect(result.raw.wind_direction).toBe(259);
    expect(result.raw.wind_speed).toBe(144);
    expect(result.raw.mach).toBe(0.767);
    expect(result.raw.airspeed).toBe(449);
  });

  test('POS without callsign or mission (southern hemisphere)', () => {
    const result = decoder.decode({
      label: '4J',
      text: 'POS/IDA97464,TROJ05,/DC19112026,231643/MR14,/ET200003/PSS30525E152131,231643,210,VEG01,192334,VONDO,M15,263020,T223/CG,,/FB308/VR327DD5',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.mission_number).toBe('');
    expect(result.raw.mission).toBeUndefined();
    expect(result.raw.position.latitude).toBeLessThan(0);
    expect(result.raw.wind_direction).toBe(263);
    expect(result.raw.wind_speed).toBe(20);
    expect(result.raw.airspeed).toBe(223);
  });

  test('POS with MT speed and 4 digit wind', () => {
    const result = decoder.decode({
      label: '4J',
      text: 'POS/ID23571S,,/DC19112026,234005/MR56,/ET192342/PSN64458W147121,234000,25,RW14,192342,EIL,P9,1138,MT150/CG271,180,350/FB332/VR323709',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.wind_direction).toBe(113);
    expect(result.raw.wind_speed).toBe(8);
    expect(result.raw.airspeed).toBe(150);
    expect(result.raw.mach).toBeUndefined();
  });

  test('WXR weather response', () => {
    const result = decoder.decode({
      label: 'H1',
      text: '- #MDWXR/ID99207A,RCH3269,AAM7886W2324/MR4,120/MTKADW,1200,KADW 211200Z VRB06KT 9999 (7SM) SCT250 T07C A3027 REQUEST PIREP AS MISSION PERMITSE1E4',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('Weather Report');
    expect(result.raw.weather_report).toEqual({
      station: 'KADW',
      time: '1200',
      type: 'METAR',
      report:
        'KADW 211200Z VRB06KT 9999 (7SM) SCT250 T07C A3027 REQUEST PIREP AS MISSION PERMITS',
    });
  });

  test('WXR TAF response', () => {
    const result = decoder.decode({
      label: 'H1',
      text: '- #MDWXR/ID66162A,RCH3245,PAM7887W2324/MR1,48/MTPAED,0311,TAF PAED 210311Z 03009KT 9999 FEW030 BKN050 BKN100 QNH2979INS T0C-AUTO RESPONSE BASED ON AVAILABLE DATA-CONTACT C2 AGENCY FOR ADDITIONAL INFO2C6B',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.weather_report.type).toBe('TAF');
    expect(result.raw.weather_report.station).toBe('PAED');
  });

  test('OOI takeoff event', () => {
    const result = decoder.decode({
      label: '80',
      text: 'OOI/ID76027S,KECK43,8VZ095L6S324/DC21112026,011458/MR4,/OF210114/CG229,110,360/FB794/VR321B31',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('OOOI Event Report');
    expect(result.raw.flight_number).toBe('KECK43');
    expect(result.raw.mission?.prefix).toBe('8VZ');
    expect(result.raw.day).toBe(21);
    expect(result.raw.off_time).toBe(4440); // 01:14
    expect(result.raw.fuel_on_board).toBe(794);
  });

  test('OOI out event', () => {
    const result = decoder.decode({
      label: 'H1',
      text: 'F82AMCFAMC#M2BOOI/ID80057A,RCH4527,JAM7868P2324/DC20112026,175106/MR1,/OT201751,201735,1539/CG346,,/FB1539/VR32A3EE',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.out_time).toBe(64260); // 17:51
    expect(result.raw.out_fuel).toBe(1539);
  });

  test('DIS with lat/lon', () => {
    const result = decoder.decode({
      label: 'H1',
      text: 'DIS/ID38031S,RCH564,8JZ42NG3S325/DC21112026,174417/MR20,/LLN50525E011102/DR0/FB1147/VR32F6B2',
    });

    expect(result.decoded).toBe(true);
    expect(result.formatted.description).toBe('Position Report (DIS)');
    expect(result.raw.position.latitude).toBeCloseTo(50.875, 3);
    expect(result.raw.position.longitude).toBeCloseTo(11.17, 3);
    expect(result.raw.fuel_on_board).toBe(1147);
  });
});

describe('MissionNumberUtils', () => {
  test('parses a mission number', () => {
    expect(MissionNumberUtils.parse('PMZM107QP021')).toEqual({
      value: 'PMZM107QP021',
      prefix: 'PMZ',
      basic: 'M107',
      suffix: 'QP',
      day_of_year: 21,
    });
  });

  test('rejects values that are not mission numbers', () => {
    expect(MissionNumberUtils.parse('')).toBeNull();
    expect(MissionNumberUtils.parse(undefined)).toBeNull();
    expect(MissionNumberUtils.parse('ZZZ123456789')).toBeNull(); // placeholder
    expect(MissionNumberUtils.parse('COLLINSAM123')).toBeNull(); // placeholder
    expect(MissionNumberUtils.parse('AAM1257013')).toBeNull(); // too short
    expect(MissionNumberUtils.parse('AAM125701400')).toBeNull(); // day 400
  });

  test('resolves the operating date nearest the reference', () => {
    const mission = MissionNumberUtils.parse('AAM125701320')!;
    expect(
      MissionNumberUtils.operatingDate(
        mission,
        new Date('2026-11-21T20:00:00Z'),
      ),
    ).toBe('2026-11-16');
    const january = MissionNumberUtils.parse('AAM125701003')!;
    expect(
      MissionNumberUtils.operatingDate(
        january,
        new Date('2026-12-30T00:00:00Z'),
      ),
    ).toBe('2027-01-03');
    const lateDec = MissionNumberUtils.parse('AAM125701364')!;
    expect(
      MissionNumberUtils.operatingDate(
        lateDec,
        new Date('2027-01-02T00:00:00Z'),
      ),
    ).toBe('2026-12-30');
  });
});
