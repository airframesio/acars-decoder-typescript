import { parseIcaoFpl } from './icao_fpl_utils';

describe('ICAO FPL Parser', () => {
  test('parses multi-line FPL block', () => {
    const text = `(FPL-CCA769-IS
-B77W/H-SDE3FGHIJ1J2J3J4J5M1P2RWXYZ/LB1D1
-VESPA2354
-N0482F350 DCT ENI DCT OAK DCT BURGL IRNMN2
-KLAX0117 KSFO
-PBN/A1B1C1D1L1O2S2T1 NAV/ABAS RNP2 DAT/1FANSE SUR/RSP180
 DOF/260310 REG/B2036
 EET/KZLA0051
 SEL/BRCE CODE/780970
 RMK/ACAS II)`;

    const result = parseIcaoFpl(text);

    expect(result).not.toBeNull();
    expect(result!.callsign).toBe('CCA769');
    expect(result!.flightRules).toBe('I');
    expect(result!.flightType).toBe('S');
    expect(result!.aircraftType).toBe('B77W');
    expect(result!.wakeTurbulence).toBe('H');
    expect(result!.equipment).toBe('SDE3FGHIJ1J2J3J4J5M1P2RWXYZ');
    expect(result!.surveillance).toBe('LB1D1');
    expect(result!.departure).toBe('VESPA');
    expect(result!.departureTime).toBe('2354');
    expect(result!.cruiseSpeed).toBe('N0482');
    expect(result!.cruiseLevel).toBe('F350');
    expect(result!.route).toBe('DCT ENI DCT OAK DCT BURGL IRNMN2');
    expect(result!.destination).toBe('KLAX');
    expect(result!.eet).toBe('0117');
    expect(result!.alternates).toEqual(['KSFO']);
    expect(result!.otherInfo.PBN).toBe('A1B1C1D1L1O2S2T1');
    expect(result!.otherInfo.NAV).toBe('ABAS RNP2');
    expect(result!.otherInfo.DAT).toBe('1FANSE');
    expect(result!.otherInfo.SUR).toBe('RSP180');
    expect(result!.otherInfo.DOF).toBe('260310');
    expect(result!.otherInfo.REG).toBe('B2036');
    expect(result!.otherInfo.EET).toBe('KZLA0051');
    expect(result!.otherInfo.SEL).toBe('BRCE');
    expect(result!.otherInfo.CODE).toBe('780970');
    expect(result!.otherInfo.RMK).toBe('ACAS II');
  });

  test('parses single-line FPL block', () => {
    const text =
      '(FPL-UAL123-IS-B789/H-SDE2E3FGHIJ1J5M1RWXYZ/LB1D1-KSFO0100-N0487F370 DCT PORTE J584 ENI DCT-KLAX0055 KONT-PBN/A1B1C1D1L1 DOF/260311 REG/N22992)';

    const result = parseIcaoFpl(text);

    expect(result).not.toBeNull();
    expect(result!.callsign).toBe('UAL123');
    expect(result!.flightRules).toBe('I');
    expect(result!.flightType).toBe('S');
    expect(result!.aircraftType).toBe('B789');
    expect(result!.wakeTurbulence).toBe('H');
    expect(result!.equipment).toBe('SDE2E3FGHIJ1J5M1RWXYZ');
    expect(result!.surveillance).toBe('LB1D1');
    expect(result!.departure).toBe('KSFO');
    expect(result!.departureTime).toBe('0100');
    expect(result!.cruiseSpeed).toBe('N0487');
    expect(result!.cruiseLevel).toBe('F370');
    expect(result!.route).toBe('DCT PORTE J584 ENI DCT');
    expect(result!.destination).toBe('KLAX');
    expect(result!.eet).toBe('0055');
    expect(result!.alternates).toEqual(['KONT']);
    expect(result!.otherInfo.PBN).toBe('A1B1C1D1L1');
    expect(result!.otherInfo.DOF).toBe('260311');
    expect(result!.otherInfo.REG).toBe('N22992');
  });

  test('returns null for text without FPL block', () => {
    const result = parseIcaoFpl('some random acars message text');
    expect(result).toBeNull();
  });

  test('returns null for malformed FPL block', () => {
    const result = parseIcaoFpl('(FPL-ABC)');
    expect(result).toBeNull();
  });

  test('returns null for missing closing paren', () => {
    const result = parseIcaoFpl(
      '(FPL-CCA769-IS-B77W/H-EQUIP/SURV-KSFO0100-N0482F350 DCT',
    );
    expect(result).toBeNull();
  });
});
