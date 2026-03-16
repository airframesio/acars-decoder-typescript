import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_OFP } from './Label_H1_OFP';

describe('Label H1 OFP (ICAO Flight Plan)', () => {
  let plugin: Label_H1_OFP;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_OFP(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-ofp');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1', '1M'],
    });
  });

  test('decodes multi-line FPL message', () => {
    const message = {
      label: 'H1',
      text: `(FPL-CCA769-IS
-B77W/H-SDE3FGHIJ1J2J3J4J5M1P2RWXYZ/LB1D1
-VESPA2354
-N0482F350 DCT ENI DCT OAK DCT BURGL IRNMN2
-KLAX0117 KSFO
-PBN/A1B1C1D1L1O2S2T1 NAV/ABAS RNP2 DAT/1FANSE SUR/RSP180
 DOF/260310 REG/B2036
 EET/KZLA0051
 SEL/BRCE CODE/780970
 RMK/ACAS II)`,
    };

    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.decoder.name).toBe('label-h1-ofp');
    expect(decodeResult.formatted.description).toBe('Operational Flight Plan');
    expect(decodeResult.message).toBe(message);

    expect(decodeResult.raw.callsign).toBe('CCA769');
    expect(decodeResult.raw.departure_icao).toBe('VESPA');
    expect(decodeResult.raw.arrival_icao).toBe('KLAX');
    expect(decodeResult.raw.alternate_icao).toBe('KSFO');
    expect(decodeResult.raw.tail).toBe('B2036');
    expect(decodeResult.raw.route.waypoints).toStrictEqual([
      { name: 'DCT' },
      { name: 'ENI' },
      { name: 'DCT' },
      { name: 'OAK' },
      { name: 'DCT' },
      { name: 'BURGL' },
      { name: 'IRNMN2' },
    ]);

    // Check formatted items
    const items = decodeResult.formatted.items;
    expect(items.find((i) => i.code === 'CALLSIGN')!.value).toBe('CCA769');
    expect(items.find((i) => i.code === 'ACFT')!.value).toBe('B77W');
    expect(items.find((i) => i.code === 'ORG')!.value).toBe('VESPA');
    expect(items.find((i) => i.code === 'DST')!.value).toBe('KLAX');
    expect(items.find((i) => i.code === 'ALT_DST')!.value).toBe('KSFO');
    expect(items.find((i) => i.code === 'ROUTE')!.value).toBe(
      'DCT > ENI > DCT > OAK > DCT > BURGL > IRNMN2',
    );
    expect(items.find((i) => i.code === 'TAIL')!.value).toBe('B2036');
    expect(items.find((i) => i.code === 'RULES')!.value).toBe('IFR');
    expect(items.find((i) => i.code === 'CRUISE')!.value).toBe('N0482 F350');
  });

  test('decodes single-line FPL message', () => {
    const message = {
      label: 'H1',
      text: '(FPL-UAL123-IS-B789/H-SDE2E3FGHIJ1J5M1RWXYZ/LB1D1-KSFO0100-N0487F370 DCT PORTE J584 ENI DCT-KLAX0055 KONT-PBN/A1B1C1D1L1 DOF/260311 REG/N22992)',
    };

    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.callsign).toBe('UAL123');
    expect(decodeResult.raw.departure_icao).toBe('KSFO');
    expect(decodeResult.raw.arrival_icao).toBe('KLAX');
    expect(decodeResult.raw.alternate_icao).toBe('KONT');
    expect(decodeResult.raw.tail).toBe('N22992');
    expect(decodeResult.raw.route.waypoints).toStrictEqual([
      { name: 'DCT' },
      { name: 'PORTE' },
      { name: 'J584' },
      { name: 'ENI' },
      { name: 'DCT' },
    ]);
  });

  test('does not decode message without FPL block', () => {
    const message = {
      label: 'H1',
      text: 'FPN/RI:DA:KSFO:AA:KLAX:F:KSFO..KLAX',
    };

    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.remaining.text).toBe(message.text);
  });

  test('decodes with label 1M', () => {
    const message = {
      label: '1M',
      text: '(FPL-UAL123-IS-B789/H-SDE2E3FGHIJ1J5M1RWXYZ/LB1D1-KSFO0100-N0487F370 DCT PORTE J584 ENI DCT-KLAX0055 KONT-PBN/A1B1C1D1L1 DOF/260311 REG/N22992)',
    };

    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.callsign).toBe('UAL123');
  });
});
