import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label H1 preamble REQ', () => {
  let plugin: Label_H1;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });

  test('decodes PWI', () => {
    message.text =
      'REQPWI/WQ320:GEQUE.HACKS.XUB.VHP.KK60K.KIVDE.KK60E.KOVJY.KD54Y.ACZES.KD48S.DVC.KITTN.KATTS.RUMPS.OAL.INYOE.DYAMD/DQ320/SPGEQUE77CE';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.requested_alts).toStrictEqual([32000]);
    expect(decodeResult.raw.desired_alt).toBe(32000);
    expect(decodeResult.raw.start_point).toBe('GEQUE');
    expect(decodeResult.raw.route.waypoints).toStrictEqual([
      { name: 'GEQUE' },
      { name: 'HACKS' },
      { name: 'XUB' },
      { name: 'VHP' },
      { name: 'KK60K' },
      { name: 'KIVDE' },
      { name: 'KK60E' },
      { name: 'KOVJY' },
      { name: 'KD54Y' },
      { name: 'ACZES' },
      { name: 'KD48S' },
      { name: 'DVC' },
      { name: 'KITTN' },
      { name: 'KATTS' },
      { name: 'RUMPS' },
      { name: 'OAL' },
      { name: 'INYOE' },
      { name: 'DYAMD' },
    ]);
    expect(decodeResult.raw.checksum).toBe(0x77ce);
    expect(decodeResult.formatted.items.length).toBe(5);
  });

  test('decodes POS', () => {
    message.text = 'REQPOS037B';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.checksum).toBe(0x037b);
    expect(decodeResult.formatted.items.length).toBe(1);
    expect(decodeResult.remaining.text).toBeUndefined();
  });

  test('decodes FPN', () => {
    message.text = 'REQFPN/RN10001/RS:FP:Z5585     9736';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.route_number).toBe('10001');
    expect(decodeResult.raw.route_status).toBe('RS');
    expect(decodeResult.raw.flight_plan).toBe('Z5585');
    expect(decodeResult.raw.checksum).toBe(0x9736);
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.remaining.text).toBeUndefined();
  });
});
