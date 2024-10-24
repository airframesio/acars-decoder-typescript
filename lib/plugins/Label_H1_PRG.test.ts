import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label_H1 POS', () => {

  let plugin: Label_H1;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });


  test('decodes Label H1 Preamble PRG message', () => {
    // https://app.airframes.io/messages/2400672008
    const text = 'PRG/FNEXS67TP/DTEGPF,23O,67,214405,298262';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.flight_number).toBe('EXS67TP');
    expect(decodeResult.formatted.description).toBe('Progress Report');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Destination');
    expect(decodeResult.formatted.items[0].value).toBe('EGPF');
    expect(decodeResult.formatted.items[1].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[1].value).toBe('23O');
    expect(decodeResult.formatted.items[2].label).toBe('Fuel On Board');
    expect(decodeResult.formatted.items[2].value).toBe('67');
    expect(decodeResult.formatted.items[3].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[3].value).toBe('21:44:05');
    expect(decodeResult.formatted.items[4].label).toBe('Fuel Remaining');
    expect(decodeResult.formatted.items[4].value).toBe('29');
    expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[5].value).toBe('0x8262');
  });

  test('decodes Label H1 Preamble PRG/LR', () => {
    // https://app.airframes.io/messages/2400672684
    const text = 'PRG/LR,000855,SWA786,KBWI,KBOS,04R,25,1285,1192,93,1284,P4,001004,8,141K,D713,000950,2,291483';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.flight_number).toBe('SWA786');
    expect(decodeResult.formatted.description).toBe('Progress Report');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Flight Number');
    expect(decodeResult.formatted.items[0].value).toBe('SWA786');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KBWI');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KBOS');
    expect(decodeResult.formatted.items[3].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[3].value).toBe('04R');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x1483');
    expect(decodeResult.remaining.text).toBe(',000855,25,1285,1192,93,1284,P4,001004,8,141K,D713,000950,2,29');
  });

  test('decodes Label H1 Preamble #M1BPRG', () => {
    // https://app.airframes.io/messages/2403492320
    const text = '#M1BPRG/DTEKCH,22L,69,141204,042/FNSAS87W/TS132645,2402246784';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.flight_number).toBe('SAS87W');
    expect(decodeResult.raw.message_timestamp).toBe(1708781205);
    expect(decodeResult.formatted.description).toBe('Progress Report');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Destination');
    expect(decodeResult.formatted.items[0].value).toBe('EKCH');
    expect(decodeResult.formatted.items[1].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[1].value).toBe('22L');
    expect(decodeResult.formatted.items[2].label).toBe('Fuel On Board');
    expect(decodeResult.formatted.items[2].value).toBe('69');
    expect(decodeResult.formatted.items[3].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[3].value).toBe('14:12:04');
    expect(decodeResult.formatted.items[4].label).toBe('Fuel Remaining');
    expect(decodeResult.formatted.items[4].value).toBe('42');
    expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[5].value).toBe('0x6784');
  });

  test('decodes Label H1 PRG with flightplan', () => {
    // https://app.airframes.io/messages/2403398879
    const text = 'PRG/DTGCRR,03O,62,163055/PR1544,286,350,239,,0,66,,,50,,,P19,P0,27440,,1305,303/RP:DA:EDDB:AA:GCRR..N50059E004552..N49588E004338..N49241E002528..N49122E002199..PON.UN872..ERIGA..FUJTI:WS:FUJTI,360..BAKUP..BATAX..TAKAV..VEDOD:A:TERT1P:AP:ILSZ03.BAPAL(03O)226D';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Progress Report');
    expect(decodeResult.formatted.items.length).toBe(10);
    expect(decodeResult.formatted.items[0].label).toBe('Destination');
    expect(decodeResult.formatted.items[0].value).toBe('GCRR');
    expect(decodeResult.formatted.items[1].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[1].value).toBe('03O');
    expect(decodeResult.formatted.items[2].label).toBe('Fuel On Board');
    expect(decodeResult.formatted.items[2].value).toBe('62');
    expect(decodeResult.formatted.items[3].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[3].value).toBe('16:30:55');
    expect(decodeResult.formatted.items[4].label).toBe('Route Status');
    expect(decodeResult.formatted.items[4].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[5].label).toBe('Origin');
    expect(decodeResult.formatted.items[5].value).toBe('EDDB');
    expect(decodeResult.formatted.items[6].label).toBe('Destination');
    expect(decodeResult.formatted.items[6].value).toBe('GCRR..N50059E004552..N49588E004338..N49241E002528..N49122E002199..PON.UN872..ERIGA..FUJTI'); // TODO - pull out route
    expect(decodeResult.formatted.items[7].label).toBe('Arrival Procedure');
    expect(decodeResult.formatted.items[7].value).toBe('TERT1P');
    expect(decodeResult.formatted.items[8].label).toBe('Approach Procedure');
    expect(decodeResult.formatted.items[8].value).toBe('ILSZ03 starting at BAPAL(03O)');
    expect(decodeResult.formatted.items[9].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[9].value).toBe('0x226d');
    expect(decodeResult.remaining.text).toBe(':WS:FUJTI,360..BAKUP..BATAX..TAKAV..VEDOD');
  });

  test('decodes Label H1 Preamble PRG <invalid>', () => {
    const text = 'PRG Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Progress Report');
    expect(decodeResult.formatted.items.length).toBe(0);
  });
});
