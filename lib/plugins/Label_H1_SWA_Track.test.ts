import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_SWA_Track } from './Label_H1_SWA_Track';

describe('Label H1 Southwest track report', () => {
  let plugin: Label_H1_SWA_Track;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_SWA_Track(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-swa-track');
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1'],
      preambles: ['++76502,', '++86501,', '#DFB++76502,', '#DFB++86501,'],
    });
  });

  test('decodes a 737-700 report with six points', () => {
    // https://app.airframes.io/messages/7745679345
    message.text =
      '++76502,204,B737-700,261004,WN1193,KSAN,KSFO,2541,SW2501\r\n6\r\n' +
      'N3621.7,W12135.7,042328,23951,-22.5,187,045,DC,00000,1,\r\n' +
      'N3627.6,W12140.2,042329,22146,-17.3,192,047,DC,00000,1,\r\n' +
      'N3633.2,W12144.7,042330,20332,-13.0,181,039,DC,00000,1,\r\n' +
      'N3638.6,W12149.0,042331,18537,-10.2,172,029,DC,00000,1,\r\n' +
      'N3643.8,W12153.0,042332,16905,-06.0,166,027,DC,00000,1,\r\n' +
      'N3649.3,W12155.0,042333,15212,-02.0,172,020,DC,00000,1,\r\n:\r\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Track Report');
    expect(decodeResult.raw.ship_number).toBe('204');
    expect(decodeResult.raw.leg_counter).toBe(2541);
    expect(decodeResult.raw.software_version).toBe('SW2501');
    expect(decodeResult.raw.aircraft_type).toBe('B737-700');
    expect(decodeResult.raw.report_date).toBe('2026-10-04');
    expect(decodeResult.raw.flight_number).toBe('WN1193');
    expect(decodeResult.raw.departure_icao).toBe('KSAN');
    expect(decodeResult.raw.arrival_icao).toBe('KSFO');

    const points = decodeResult.raw.track_points!;
    expect(points.length).toBe(6);
    expect(points[0].latitude).toBeCloseTo(36.36167, 5);
    expect(points[0].longitude).toBeCloseTo(-121.595, 5);
    expect(points[0]).toMatchObject({
      day: 4,
      time: 84480, // 23:28
      altitude: 23951,
      temperature: -22.5,
      windDirection: 187,
      windSpeed: 45,
      phase: 'Descent',
      humiditySensor: true,
    });
    // a sensor is fitted, but 00000 is no reading
    expect(points[0].waterVapor).toBeUndefined();
    expect(points[5].temperature).toBe(-2);

    // the latest point is the aircraft's position
    expect(decodeResult.raw.position?.latitude).toBeCloseTo(36.82167, 5);
    expect(decodeResult.raw.position?.longitude).toBeCloseTo(-121.91667, 5);
    expect(decodeResult.raw.altitude).toBe(15212);
    expect(decodeResult.raw.message_timestamp).toBe(84780); // 23:33

    expect(decodeResult.formatted.items.map((i) => i.label)).toEqual([
      'Ship Number',
      'Aircraft Type',
      'Report Date',
      'Flight Number',
      'Origin',
      'Destination',
      'Leg Counter',
      'Software Version',
      ...Array(6).fill('Track Point'),
      'Aircraft Position',
      'Altitude',
      'Message Timestamp',
    ]);
    expect(decodeResult.formatted.items[8].value).toBe(
      '36.362 N, 121.595 W on day 4 at 23:28:00, 23951 feet, -22.5 C, wind 187 degrees at 45 knots, Descent',
    );
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('decodes a MAX report, which sends the tail', () => {
    // https://app.airframes.io/messages/7589546633
    message.text =
      '++86501,N8744B,B7378MAX,260916,WN1059,KSAT,KBWI,1255,SMX34-2502-F320\r\n6\r\n' +
      'N3841.1,W07713.3,161419,15284,-00.0,334,011,DC,00000,0,\r\n' +
      'N3841.5,W07705.9,161420,13394, 01.8,017,001,DC,00000,0,\r\n' +
      'N3841.8,W07658.6,161421,11500, 04.8,325,015,DC,00000,0,\r\n' +
      'N3842.2,W07651.6,161422,10177, 07.8,324,013,DC,00000,0,\r\n' +
      'N3842.6,W07645.2,161423,09040, 10.5,338,015,DC,00000,0,\r\n' +
      'N3843.2,W07643.0,161424,08988, 10.8,334,013,ER,00000,0,\r\n:\r\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.tail).toBe('N8744B');
    expect(decodeResult.raw.ship_number).toBeUndefined();
    expect(decodeResult.raw.software_version).toBe('SMX34-2502-F320');
    expect(decodeResult.raw.aircraft_type).toBe('B7378MAX');
    const points = decodeResult.raw.track_points!;
    expect(points.length).toBe(6);
    expect(points[0].temperature).toBe(0);
    expect(points[1].temperature).toBe(1.8);
    expect(points[4].altitude).toBe(9040);
    // the MAX sends ER where the 737-700 and -800 send CR
    expect(points[5].phase).toBe('En Route');
    // no humidity sensor
    expect(points[0].humiditySensor).toBe(false);
    expect(decodeResult.raw.altitude).toBe(8988);
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('decodes a #DFB report and drops the block headers inside it', () => {
    // https://app.airframes.io/messages/7879772485
    message.text =
      '#DFB++76502,XXX,B737-800,261020,WN0786,KBOS,KBWI,2465,SW2501\n3\n' +
      'N4210.0,W07148.0,200954,18954,-13.5,338,015,CL,00000,0,\n' +
      'N4209.2,W07150.9,200955,19781,-16.3,339,016,CL,00000,0,\n' +
      'N4208.5,W07153.9,200955,20590,-#DFB18.5,336,015,CL,00000,0,\n:\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.flight_number).toBe('WN0786');
    const points = decodeResult.raw.track_points!;
    expect(points.length).toBe(3);
    expect(points[2].temperature).toBe(-18.5);
    expect(points[2].phase).toBe('Climb');
    // XXX: the report has no ship number
    expect(decodeResult.raw.ship_number).toBeUndefined();
    expect(decodeResult.raw.leg_counter).toBe(2465);
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('decodes the complete points of a cut-off report and keeps the rest', () => {
    // https://app.airframes.io/messages/7745679154 (the first block only)
    message.text =
      '++76502,204,B737-700,261004,WN1193,KSAN,KSFO,2541,SW2501\r\n6\r\n' +
      'N3621.7,W12135.7,042328,23951,-22.5,187,045,DC,00000,1,\r\n' +
      'N3627.6,W12140.2,042329,22146,-17.3,192,047,DC,00000,1,\r\n' +
      'N3633.2,W12144.7,042330,20332,-';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.track_points?.length).toBe(2);
    expect(decodeResult.raw.altitude).toBe(22146);
    expect(decodeResult.remaining.text).toBe('N3633.2,W12144.7,042330,20332,-');
  });

  test('is chosen by the message decoder', () => {
    const decoder = new MessageDecoder();
    const decodeResult = decoder.decode({
      label: 'H1',
      text:
        '++76502,204,B737-700,261004,WN1193,KSAN,KSFO,2541,SW2501\r\n1\r\n' +
        'N3621.7,W12135.7,042328,23951,-22.5,187,045,DC,00000,1,\r\n:\r\n',
    });
    expect(decodeResult.decoder.name).toBe('label-h1-swa-track');
    expect(decodeResult.raw.track_points?.length).toBe(1);
  });

  test('keeps a point with an impossible time as remaining', () => {
    // https://app.airframes.io/messages/7745679345, the second point's time changed to 24:60
    message.text =
      '++76502,204,B737-700,261004,WN1193,KSAN,KSFO,2541,SW2501\r\n2\r\n' +
      'N3621.7,W12135.7,042328,23951,-22.5,187,045,DC,00000,1,\r\n' +
      'N3627.6,W12140.2,042460,22146,-17.3,192,047,DC,00000,1,\r\n:\r\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.track_points?.length).toBe(1);
    expect(decodeResult.raw.message_timestamp).toBe(84480); // 23:28, the valid point
    expect(decodeResult.remaining.text).toBe(
      'N3627.6,W12140.2,042460,22146,-17.3,192,047,DC,00000,1,',
    );
  });

  test('decodes water vapor from the humidity sensor', () => {
    // https://app.airframes.io/messages/7177601900
    message.text =
      '++76502,269,B737-700,260719,WN2802,KSAN,KSJC,2169,SW2501\n3\n' +
      'N3307.1,W11747.1,191921,19509,-06.0,150,011,CL,02722,1,\n' +
      'N3308.8,W11748.8,191921,20269,-07.5,138,013,CL,02424,1,\n' +
      'N3310.5,W11750.6,191922,21019,-08.0,175,009,CL,01821,1,\n:\n';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoder.decodeLevel).toBe('full');
    const points = decodeResult.raw.track_points!;
    expect(points.map((p) => p.waterVapor)).toEqual([2722, 2424, 1821]);
    expect(
      decodeResult.formatted.items.find((i) => i.label === 'Track Point')
        ?.value,
    ).toBe(
      '33.118 N, 117.785 W on day 19 at 19:21:00, 19509 feet, -6 C, wind 150 degrees at 11 knots, Climb, water vapor 2722 ppmv',
    );
  });

  test('does not decode a bad header', () => {
    message.text = '++76502,Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.remaining.text).toBe('++76502,Bogus message');
  });
});
