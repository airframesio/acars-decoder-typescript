import { MessageDecoder } from '../MessageDecoder';
import { Label_13Through18_Slash } from './Label_13Through18_Slash';

describe('Label_13Through18_Slash', () => {
  let plugin: Label_13Through18_Slash;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_13Through18_Slash(decoder);
  });

  test('matches Label 13-18 Preamble slash qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-13-18-slash');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['13', '14', '15', '16', '17', '18'],
      preambles: ['/'],
    });
  });

  describe('Label 13', () => {
    const message = { label: '13', text: '' };
    test('decodes 1-line', () => {
      // https://app.airframes.io/messages/3423349335
      message.text = '/13 OUT EVENT      / KSFO KEWR 12 231445/TIME 2314';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);

      expect(decodeResult.decoder.decodeLevel).toBe('full');
      expect(decodeResult.raw.day).toBe(12);
      expect(decodeResult.formatted.description).toBe('Out of Gate Report');
      expect(decodeResult.formatted.items.length).toBe(3);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KSFO');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KEWR');
      expect(decodeResult.formatted.items[2].label).toBe('Out of Gate Time');
      expect(decodeResult.formatted.items[2].value).toBe('23:14:45');
    });
    test('decodes 2-line', () => {
      // https://app.airframes.io/messages/3424584522
      message.text =
        '/13 OUT EVENT      / KSFO KMSP 12 024518/TIME 0245' +
        '\r\n' +
        '/LOC N373703,W1222251';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('full');
      expect(decodeResult.raw.day).toBe(12);
      expect(decodeResult.formatted.description).toBe('Out of Gate Report');
      expect(decodeResult.formatted.items.length).toBe(4);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KSFO');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KMSP');
      expect(decodeResult.formatted.items[2].label).toBe('Out of Gate Time');
      expect(decodeResult.formatted.items[2].value).toBe('02:45:18');
      expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
      expect(decodeResult.formatted.items[3].value).toBe('37.617 N, 122.381 W');
    });
  });

  describe('Label 14', () => {
    const message = { label: '14', text: '' };
    test('decodes 1-line', () => {
      message.text = '/14 OFF EVENT      / KIAD KDEN 08 124438/TIME 1244';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('full');
      expect(decodeResult.raw.day).toBe(8);
      expect(decodeResult.formatted.description).toBe('Takeoff Report');
      expect(decodeResult.formatted.items.length).toBe(3);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KIAD');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KDEN');
      expect(decodeResult.formatted.items[2].label).toBe('Takeoff Time');
      expect(decodeResult.formatted.items[2].value).toBe('12:44:38');
    });

    test('decodes 2-line', () => {
      message.text =
        '/14 OFF EVENT      / KIAD EDDF 09 025055/TIME 0250' +
        '\r\n' +
        '/LOC +38.9603,-077.4595';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('full');
      expect(decodeResult.raw.day).toBe(9);
      expect(decodeResult.formatted.items.length).toBe(4);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KIAD');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('EDDF');
      expect(decodeResult.formatted.items[2].label).toBe('Takeoff Time');
      expect(decodeResult.formatted.items[2].value).toBe('02:50:55');
      expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
      expect(decodeResult.formatted.items[3].value).toBe('38.960 N, 77.460 W');
    });

    test('decodes 3-line', () => {
      message.text =
        '/14 OFF EVENT      / KIAD KATL 09 123630/TIME 1236' +
        '\r\n' +
        '/AU 08752167/AON 08716165/AIN 08717165/AOT 08744166' +
        '\r\n' +
        '/LOC N385618,W0772823';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.raw.day).toBe(9);
      expect(decodeResult.formatted.items.length).toBe(4);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KIAD');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KATL');
      expect(decodeResult.formatted.items[2].label).toBe('Takeoff Time');
      expect(decodeResult.formatted.items[2].value).toBe('12:36:30');
      expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
      expect(decodeResult.formatted.items[3].value).toBe('38.938 N, 77.473 W');
      expect(decodeResult.remaining.text).toBe(
        '/AU 08752167/AON 08716165/AIN 08717165/AOT 08744166',
      );
    });

    // Ignoring this test because the position is definteley invalid
    // The position is in the middle of the pacific ocean for a domestic flight
    // ADS-B confirms it took off from IAD at the correct time
    // Despite all this, it shows that positions may be in decimal minutes instead of DMS when using NSEW instead of +/-
    // so i'm putting it here for reference
    test.skip('decodes position invalid', () => {
      message.text =
        '/14 OFF EVENT      / KIAD KSAT 10 122555/TIME 1225' +
        '\r\n' +
        '/AU 55808910/AON 55729908/AIN 55731908/AOT 55804909' +
        '\r\n' +
        '/LOC N169380,E1334348';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.raw.day).toBe(10);
      expect(decodeResult.formatted.items.length).toBe(4);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KIAD');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KSAT');
      expect(decodeResult.formatted.items[2].label).toBe('Takeoff Time');
      expect(decodeResult.formatted.items[2].value).toBe('12:25:55');
      expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
      expect(decodeResult.formatted.items[3].value).toBe('17.572 N, 133.730 W');
      expect(decodeResult.remaining.text).toBe(
        '/AU 55808910/AON 55729908/AIN 55731908/AOT 55804909',
      );
    });
  });

  describe('Label 15', () => {
    const message = { label: '15', text: '' };
    test('decodes 1-line', () => {
      // https://app.airframes.io/messages/3424704396
      message.text = '/15 ON EVENT       / PHOG KSFO 12 064852/TIME 0648';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);

      expect(decodeResult.decoder.decodeLevel).toBe('full');
      expect(decodeResult.raw.day).toBe(12);
      expect(decodeResult.formatted.description).toBe('On Ground Report');
      expect(decodeResult.formatted.items.length).toBe(3);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('PHOG');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KSFO');
      expect(decodeResult.formatted.items[2].label).toBe('Landing Time');
      expect(decodeResult.formatted.items[2].value).toBe('06:48:52');
    });
    test('decodes 2-line', () => {
      // https://app.airframes.io/messages/3425113893
      message.text =
        '/15 ON EVENT       / KCMH KSFO 12 044401/TIME 0444' +
        '\r\n' +
        '/LOC N373705,W1222208';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('full');
      expect(decodeResult.raw.day).toBe(12);
      expect(decodeResult.formatted.description).toBe('On Ground Report');
      expect(decodeResult.formatted.items.length).toBe(4);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KCMH');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KSFO');
      expect(decodeResult.formatted.items[2].label).toBe('Landing Time');
      expect(decodeResult.formatted.items[2].value).toBe('04:44:01');
      expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
      expect(decodeResult.formatted.items[3].value).toBe('37.618 N, 122.369 W');
    });
  });

  describe('Label 16', () => {
    const message = { label: '16', text: '' };
    test('decodes 3-line', () => {
      // https://app.airframes.io/messages/3424584522
      message.text =
        '/16 1ST PDOOR OPEN / KLAX KSEA 12 053340/TIME 0533' +
        '\r\n' +
        '/BR SET 0529' +
        '\r\n' +
        '/LOC S101043,W1530624';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.raw.day).toBe(12);
      expect(decodeResult.formatted.description).toBe('In Gate Report');
      expect(decodeResult.formatted.items.length).toBe(4);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KLAX');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KSEA');
      expect(decodeResult.formatted.items[2].label).toBe('In Gate Time');
      expect(decodeResult.formatted.items[2].value).toBe('05:33:40');
      expect(decodeResult.formatted.items[3].label).toBe('Aircraft Position');
      expect(decodeResult.formatted.items[3].value).toBe('10.179 S, 153.107 W');
      expect(decodeResult.remaining.text).toBe('/BR SET 0529');
    });
  });

  describe('Label 17', () => {
    const message = { label: '17', text: '' };
    test('decodes 3-line', () => {
      // https://app.airframes.io/messages/3423349335
      message.text =
        '/17 POST RPT       / KIAD KSFO 12 034537/TIME 0343' +
        '\r\n' +
        '/FOB 0215/LP U246680/OP        /CAT NR' +
        '\r\n' +
        '/AL NN/SUC  /SAV  /BR ACT NO REPORT/RWY 28R /PDOOR 0343 -----/CDOOR 0343/BR SET 0341';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);

      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.raw.day).toBe(12);
      expect(decodeResult.formatted.description).toBe('Post Report');
      expect(decodeResult.formatted.items.length).toBe(2);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KIAD');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KSFO');
      expect(decodeResult.remaining.text).toBe(
        '/FOB 0215/LP U246680/OP        /CAT NR\r\n/AL NN/SUC  /SAV  /BR ACT NO REPORT/RWY 28R /PDOOR 0343 -----/CDOOR 0343/BR SET 0341',
      );
    });
    test('decodes 5-line', () => {
      // https://app.airframes.io/messages/3424453568
      message.text =
        '/17 POST RPT       / KLAX KSEA 12 053340/TIME 0530' +
        '\r\n' +
        '/FOB 0074/LP U423108/MP U332185/CAT NR' +
        '\r\n' +
        '/AL N-/SUC -/SAV -/BR ACT NO REPORT/RWY ---' +
        '\r\n' +
        '/PDOOR 0533 MCD1 /CDOOR 0530/BR SET 0529' +
        '\r\n' +
        '/LOC S101043,W1530624';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.raw.day).toBe(12);
      expect(decodeResult.formatted.description).toBe('Post Report');
      expect(decodeResult.formatted.items.length).toBe(3);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KLAX');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KSEA');
      //expect(decodeResult.formatted.items[2].label).toBe('Takeoff Time');
      //expect(decodeResult.formatted.items[2].value).toBe('02:45:18');
      expect(decodeResult.formatted.items[2].label).toBe('Aircraft Position');
      expect(decodeResult.formatted.items[2].value).toBe('10.179 S, 153.107 W');
      expect(decodeResult.remaining.text).toBe(
        '/FOB 0074/LP U423108/MP U332185/CAT NR\r\n/AL N-/SUC -/SAV -/BR ACT NO REPORT/RWY ---\r\n/PDOOR 0533 MCD1 /CDOOR 0530/BR SET 0529',
      );
    });
  });

  describe('Label 18', () => {
    const message = { label: '18', text: '' };
    test('decodes location', () => {
      // https://app.airframes.io/messages/3424453669
      message.text =
        '/18 POST TIMES SECS/ KLAX KSEA 12 053340/IN TIME 0530/PDOOR 053340/CDOOR 053024/BR SET 052942' +
        '\r\n' +
        '/LOC S101043,W1530624';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.raw.day).toBe(12);
      expect(decodeResult.formatted.description).toBe('Post Times Report');
      expect(decodeResult.formatted.items.length).toBe(3);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KLAX');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('KSEA');
      expect(decodeResult.formatted.items[2].label).toBe('Aircraft Position');
      expect(decodeResult.formatted.items[2].value).toBe('10.179 S, 153.107 W');
      expect(decodeResult.remaining.text).toBe(
        'PDOOR 053340/CDOOR 053024/BR SET 052942',
      );
    });
    test('decodes no location', () => {
      // https://app.airframes.io/messages/3424453669
      message.text =
        '/18 POST TIMES SECS/ KSFO CYVR 12 040416/IN TIME0353/PDOOR 035414/CDOOR 035315/BR SET 035223' +
        '\r\n' +
        '/LOC        ,        ';
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.raw.day).toBe(12);
      expect(decodeResult.formatted.description).toBe('Post Times Report');
      expect(decodeResult.formatted.items.length).toBe(2);
      expect(decodeResult.formatted.items[0].label).toBe('Origin');
      expect(decodeResult.formatted.items[0].value).toBe('KSFO');
      expect(decodeResult.formatted.items[1].label).toBe('Destination');
      expect(decodeResult.formatted.items[1].value).toBe('CYVR');
      expect(decodeResult.remaining.text).toBe(
        'PDOOR 035414/CDOOR 035315/BR SET 035223',
      );
    });
  });

  test('does not decode <invalid>', () => {
    const message = { label: '14', text: '/14 Bogus Message' };
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-13-18-slash');
    expect(decodeResult.message).toBe(message);
  });
});
