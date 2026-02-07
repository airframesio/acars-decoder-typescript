import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_WRN } from './Label_H1_WRN';

describe('Label H1 WRN', () => {
  let plugin: Label_H1_WRN;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_WRN(decoder);
  });

  test('matches Label H1 Preamble WRN qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-wrn');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1'],
      preambles: ['WRN', '#CFBWRN'],
    });
  });

  test('decodes Label H1 Preamble WRN FUEL', () => {
    // https://app.airframes.io/messages/2435520576
    message.text = 'WRN/WN24030400580028000006FUEL L TK PUMP 1 2 LO PR ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-h1-wrn');
    expect(decodeResult.formatted.description).toBe('Warning Message');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.message_timestamp).toBe(1712105880);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.formatted.items[0].type).toBe('warning');
    expect(decodeResult.formatted.items[0].code).toBe('WRN');
    expect(decodeResult.formatted.items[0].label).toBe('Warning Message');
    expect(decodeResult.formatted.items[0].value).toBe(
      'FUEL L TK PUMP 1 2 LO PR ',
    );
    expect(decodeResult.remaining.text).toBe('28000006');
  });

  test('decodes Label H1 Preamble WRN NAV', () => {
    // https://app.airframes.io/messages/2435409810
    message.text =
      'WRN/PNRC12860AA07/WN24030316250034000006NAV ADS-B RPTG 1 FAULT ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-h1-wrn');
    expect(decodeResult.formatted.description).toBe('Warning Message');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.message_timestamp).toBe(1709483100);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.formatted.items[0].type).toBe('warning');
    expect(decodeResult.formatted.items[0].code).toBe('WRN');
    expect(decodeResult.formatted.items[0].label).toBe('Warning Message');
    expect(decodeResult.formatted.items[0].value).toBe(
      'NAV ADS-B RPTG 1 FAULT ',
    );
    expect(decodeResult.remaining.text).toBe('PNRC12860AA07/34000006');
  });

  test('decodes Label H1 Preamble WRN F/CTL', () => {
    // https://app.airframes.io/messages/2435339713
    message.text =
      'WRN/PNRC12860AA07/WN24030322050027000002F/CTL ELAC 1 FAULT ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-h1-wrn');
    expect(decodeResult.formatted.description).toBe('Warning Message');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.message_timestamp).toBe(1709503500);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.formatted.items[0].type).toBe('warning');
    expect(decodeResult.formatted.items[0].code).toBe('WRN');
    expect(decodeResult.formatted.items[0].label).toBe('Warning Message');
    expect(decodeResult.formatted.items[0].value).toBe('F/CTL ELAC 1 FAULT ');
    expect(decodeResult.remaining.text).toBe('PNRC12860AA07/27000002');
  });

  test('decodes Label H1 Preamble WRN ENG', () => {
    // https://app.airframes.io/messages/2434945276
    message.text = 'WRN/PNRC12860AA07/WN24030316580030210006ENG 1 A.ICE ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-h1-wrn');
    expect(decodeResult.formatted.description).toBe('Warning Message');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.message_timestamp).toBe(1709485080);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.formatted.items[0].type).toBe('warning');
    expect(decodeResult.formatted.items[0].code).toBe('WRN');
    expect(decodeResult.formatted.items[0].label).toBe('Warning Message');
    expect(decodeResult.formatted.items[0].value).toBe('ENG 1 A.ICE ');
    expect(decodeResult.remaining.text).toBe('PNRC12860AA07/30210006');
  });

  test('decodes Label H1 Preamble #CFBWRN', () => {
    // https://app.airframes.io/messages/2434735527
    message.text = '#CFBWRN/WN24030312040034580006NAV GPS1 FAULT ';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-h1-wrn');
    expect(decodeResult.formatted.description).toBe('Warning Message');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.message_timestamp).toBe(1709467440);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.formatted.items[0].type).toBe('warning');
    expect(decodeResult.formatted.items[0].code).toBe('WRN');
    expect(decodeResult.formatted.items[0].label).toBe('Warning Message');
    expect(decodeResult.formatted.items[0].value).toBe('NAV GPS1 FAULT ');
    expect(decodeResult.remaining.text).toBe('34580006');
  });

  test('decodes Label H1 Preamble WRN invalid', () => {
    message.text = 'WRN <Invalid text>';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-h1-wrn');
    expect(decodeResult.formatted.description).toBe('Warning Message');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.remaining.text).toBe(message.text);
  });
});
