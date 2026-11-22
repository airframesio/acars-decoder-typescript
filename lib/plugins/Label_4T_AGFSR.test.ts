import { beforeEach, describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_4T_AGFSR } from './Label_4T_AGFSR';

describe('Label 4T ETA', () => {
  let plugin: Label_4T_AGFSR;
  const message = { label: '4T', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_4T_AGFSR(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-4t-agfsr');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['4T'],
      preambles: ['AGFSR'],
    });
  });

  test('decodes msg 1', () => {
    // https://app.airframes.io/messages/3576265474
    // https://www.flightaware.com/live/flight/ACA620/history/20241108/0245Z/CYYZ/CYHZ
    // https://globe.airplanes.live/?icao=c05bd2
    message.text =
      'AGFSR AC0620/07/08/YYZYHZ/0340Z/453/4435.1N07143.4W/350/ /0063/0035/ /281065/----/ /512/0240/0253/----/----';

    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(10);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('AC0620');
    expect(decodeResult.formatted.items[1].label).toBe('Departure Day');
    expect(decodeResult.formatted.items[1].value).toBe('7');
    expect(decodeResult.formatted.items[2].label).toBe('Arrival Day');
    expect(decodeResult.formatted.items[2].value).toBe('8');
    expect(decodeResult.formatted.items[3].label).toBe('Origin');
    expect(decodeResult.formatted.items[3].value).toBe('YYZ');
    expect(decodeResult.formatted.items[4].label).toBe('Destination');
    expect(decodeResult.formatted.items[4].value).toBe('YHZ');
    expect(decodeResult.formatted.items[5].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[5].value).toBe('03:40:00');
    expect(decodeResult.formatted.items[6].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[6].value).toBe('44.585 N, 70.277 W');
    expect(decodeResult.formatted.items[7].label).toBe('Altitude');
    expect(decodeResult.formatted.items[7].value).toBe('35000 feet');
    expect(decodeResult.formatted.items[8].label).toBe('Out of Gate Time');
    expect(decodeResult.formatted.items[8].value).toBe('02:40:00');
    expect(decodeResult.formatted.items[9].label).toBe('Takeoff Time');
    expect(decodeResult.formatted.items[9].value).toBe('02:53:00');
    expect(decodeResult.raw.out_time).toBe(9600);
    expect(decodeResult.raw.off_time).toBe(10380);
    expect(decodeResult.raw.on_time).toBeUndefined();
    expect(decodeResult.remaining.text).toBe(
      '453/ /0063/0035/ /281065/----/ /512',
    );
  });

  test('decodes msg 2', () => {
    // https://app.airframes.io/messages/3576317322
    // https://www.flightaware.com/live/flight/CFNOH/history/20241108/0335Z/CYUL/SBGR
    // https://globe.airplanes.live/?icao=c023c8
    message.text =
      'AGFSR AC0096/07/08/YULGRU/0354Z/833/4417.8N07232.6W/254/CLIMB /0565/0033/-33/275049/0289/144/453/0319/0339/****/****';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(10);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('AC0096');
    expect(decodeResult.formatted.items[1].label).toBe('Departure Day');
    expect(decodeResult.formatted.items[1].value).toBe('7');
    expect(decodeResult.formatted.items[2].label).toBe('Arrival Day');
    expect(decodeResult.formatted.items[2].value).toBe('8');
    expect(decodeResult.formatted.items[3].label).toBe('Origin');
    expect(decodeResult.formatted.items[3].value).toBe('YUL');
    expect(decodeResult.formatted.items[4].label).toBe('Destination');
    expect(decodeResult.formatted.items[4].value).toBe('GRU');
    expect(decodeResult.formatted.items[5].label).toBe('Message Timestamp');
    expect(decodeResult.formatted.items[5].value).toBe('03:54:00');
    expect(decodeResult.formatted.items[6].label).toBe('Aircraft Position');
    expect(decodeResult.formatted.items[6].value).toBe('44.297 N, 71.457 W');
    expect(decodeResult.formatted.items[7].label).toBe('Altitude');
    expect(decodeResult.formatted.items[7].value).toBe('25400 feet');
    expect(decodeResult.formatted.items[8].value).toBe('03:19:00');
    expect(decodeResult.formatted.items[9].value).toBe('03:39:00');
    expect(decodeResult.remaining.text).toBe(
      '833/CLIMB /0565/0033/-33/275049/0289/144/453',
    );
  });

  test('decodes the ON time after landing', () => {
    // Real message (2026-11-22), sent at rollout; ARV AC0856 LHR 0823Z came 40 s earlier.
    message.text =
      'AGFSR AC0856/21/22/YYZLHR/0823Z/733/5128.7N00028.0W/000/RL OUT/0118/0527/P08/085005/0111/090/106/0127/0150/0823/----';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.out_time).toBe(5220);
    expect(decodeResult.raw.off_time).toBe(6600);
    expect(decodeResult.raw.on_time).toBe(30180);
    expect(decodeResult.raw.in_time).toBeUndefined();
    expect(decodeResult.remaining.text).toBe(
      '733/RL OUT/0118/0527/P08/085005/0111/090/106',
    );
  });

  test('decodes a phase with a slash', () => {
    message.text =
      'AGFSR AC2359/21/22/LAXYVR/0447Z/103/4912.1N12310.8W/262/TAXI/I/0033/0051/P4 /100004/0054/100/49 /0206/0223/0447/    ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.out_time).toBe(7560);
    expect(decodeResult.raw.off_time).toBe(8580);
    expect(decodeResult.raw.on_time).toBe(17220);
    expect(decodeResult.remaining.text).toBe(
      '103/TAXI/I/0033/0051/P4 /100004/0054/100/49 ',
    );
  });

  test('does not decode a report with another extra slash', () => {
    for (const text of [
      'AGFSR AC0842/21/22/YYZFRA/0853Z/839/5146.5N00231.5W/389/CRUISE/0137/0342/M54/277016/0261/112/500/0242/0257/****/****/',
      'AGFSR AC0842/21/22/YYZFRA/0853Z/839/5146.5N00231.5W/389/CRUISE/0137/0342/M54/277016/0261/112/5/00/0242/0257/****/****',
    ]) {
      message.text = text;
      expect(plugin.decode(message).decoded).toBe(false);
    }
  });

  test('decodes from MessageDecoder', () => {
    const decoder = new MessageDecoder();
    const decodeResult = decoder.decode({
      label: '4T',
      text: 'AGFSR AC0842/21/22/YYZFRA/0853Z/839/5146.5N00231.5W/389/CRUISE/0137/0342/M54/277016/0261/112/500/0242/0257/****/****',
    });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.name).toBe('label-4t-agfsr');
    expect(decodeResult.raw.out_time).toBe(9720);
    expect(decodeResult.raw.off_time).toBe(10620);
  });

  test('decodes <invalid>', () => {
    message.text = 'POS/ Bogus message';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Position Report');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
