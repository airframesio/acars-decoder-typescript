import { IcaoDecoder } from './IcaoDecoder';

describe('IcaoDecoder', () => {
  it('should set name and icao properties', () => {
    const decoder = new IcaoDecoder('abc123');
    expect(decoder.name).toBe('icao-decoder-typescript');
    expect(decoder.icao).toBe('abc123');
  });

  describe('isMilitary', () => {
    it('should match Egypt', () => {
      expect(new IcaoDecoder('010070').isMilitary()).toBe(true);
      expect(new IcaoDecoder('01008f').isMilitary()).toBe(true);
    });

    it('should match Algeria', () => {
      expect(new IcaoDecoder('0a4000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('0a4fff').isMilitary()).toBe(true);
    });

    it('should match Italy', () => {
      expect(new IcaoDecoder('33ff00').isMilitary()).toBe(true);
      expect(new IcaoDecoder('33ffff').isMilitary()).toBe(true);
    });

    it('should match Spain', () => {
      expect(new IcaoDecoder('350000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('37ffff').isMilitary()).toBe(true);
    });

    it('should match France', () => {
      // 1
      expect(new IcaoDecoder('3aa000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('3affff').isMilitary()).toBe(true);
      // 2
      expect(new IcaoDecoder('3b7000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('3bffff').isMilitary()).toBe(true);
    });

    it('should match Germany', () => {
      // 1
      expect(new IcaoDecoder('3ea000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('3ebfff').isMilitary()).toBe(true);
      // 2
      expect(new IcaoDecoder('3f4000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('3fbfff').isMilitary()).toBe(true);
    });

    it('should match UK', () => {
      // 1
      expect(new IcaoDecoder('400000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('40003f').isMilitary()).toBe(true);
      // 2
      expect(new IcaoDecoder('43c000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('43cfff').isMilitary()).toBe(true);
    });

    it('should match Austria', () => {
      expect(new IcaoDecoder('444000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('446fff').isMilitary()).toBe(true);
    });

    it('should match Belgium', () => {
      expect(new IcaoDecoder('44f000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('44ffff').isMilitary()).toBe(true);
    });

    it('should match Bulgaria', () => {
      expect(new IcaoDecoder('457000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('457fff').isMilitary()).toBe(true);
    });

    it('should match Denmark', () => {
      expect(new IcaoDecoder('45f400').isMilitary()).toBe(true);
      expect(new IcaoDecoder('45f4ff').isMilitary()).toBe(true);
    });

    it('should match Greece', () => {
      expect(new IcaoDecoder('468000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('4683ff').isMilitary()).toBe(true);
    });

    it('should match Hungary', () => {
      expect(new IcaoDecoder('473c00').isMilitary()).toBe(true);
      expect(new IcaoDecoder('473c0f').isMilitary()).toBe(true);
    });

    it('should match Norway', () => {
      expect(new IcaoDecoder('478100').isMilitary()).toBe(true);
      expect(new IcaoDecoder('4781ff').isMilitary()).toBe(true);
    });

    it('should match Netherlands', () => {
      expect(new IcaoDecoder('480000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('480fff').isMilitary()).toBe(true);
    });

    it('should match Poland', () => {
      expect(new IcaoDecoder('48d800').isMilitary()).toBe(true);
      expect(new IcaoDecoder('48d87f').isMilitary()).toBe(true);
    });

    it('should match Portugal', () => {
      expect(new IcaoDecoder('497c00').isMilitary()).toBe(true);
      expect(new IcaoDecoder('497cff').isMilitary()).toBe(true);
    });

    it('should match Czech', () => {
      expect(new IcaoDecoder('498420').isMilitary()).toBe(true);
      expect(new IcaoDecoder('49842f').isMilitary()).toBe(true);
    });

    it('should match Switzerland', () => {
      expect(new IcaoDecoder('4b7000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('4b7fff').isMilitary()).toBe(true);
    });

    it('should match Turkey', () => {
      expect(new IcaoDecoder('4b8200').isMilitary()).toBe(true);
      expect(new IcaoDecoder('4b82ff').isMilitary()).toBe(true);
    });

    it('should match Oman', () => {
      expect(new IcaoDecoder('70c070').isMilitary()).toBe(true);
      expect(new IcaoDecoder('70c07f').isMilitary()).toBe(true);
    });

    it('should match Saudi Arabia', () => {
      // 1
      expect(new IcaoDecoder('710258').isMilitary()).toBe(true);
      expect(new IcaoDecoder('71028f').isMilitary()).toBe(true);
      // 2
      expect(new IcaoDecoder('710380').isMilitary()).toBe(true);
      expect(new IcaoDecoder('71039f').isMilitary()).toBe(true);
    });

    it('should match Israel', () => {
      expect(new IcaoDecoder('738a00').isMilitary()).toBe(true);
      expect(new IcaoDecoder('738aff').isMilitary()).toBe(true);
    });

    it('should match Australia', () => {
      expect(new IcaoDecoder('7cf800').isMilitary()).toBe(true);
      expect(new IcaoDecoder('7cfaff').isMilitary()).toBe(true);
    });

    it('should match India', () => {
      expect(new IcaoDecoder('800200').isMilitary()).toBe(true);
      expect(new IcaoDecoder('8002ff').isMilitary()).toBe(true);
    });

    it('should match USA', () => {
      expect(new IcaoDecoder('adf7c8').isMilitary()).toBe(true);
      expect(new IcaoDecoder('afffff').isMilitary()).toBe(true);
    });

    it('should match Canada', () => {
      expect(new IcaoDecoder('c20000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('c3ffff').isMilitary()).toBe(true);
    });

    it('should match Brazil', () => {
      expect(new IcaoDecoder('e40000').isMilitary()).toBe(true);
      expect(new IcaoDecoder('e41fff').isMilitary()).toBe(true);
    });

    it('should return false for non-military ICAO', () => {
      expect(new IcaoDecoder('a00000').isMilitary()).toBe(false);
      expect(new IcaoDecoder('123456').isMilitary()).toBe(false);
      expect(new IcaoDecoder('000000').isMilitary()).toBe(false);
      expect(new IcaoDecoder('ffffff').isMilitary()).toBe(false);
    });
  });
});
