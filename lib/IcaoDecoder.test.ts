import { IcaoDecoder } from './IcaoDecoder';

describe('IcaoDecoder', () => {
  it('should set name and icao properties', () => {
    const decoder = new IcaoDecoder('adf7c8');
    expect(decoder.name).toBe('icao-decoder-typescript');
    expect(decoder.icao).toBe('adf7c8');
  });

  describe('isMilitary', () => {
    // US military
    it('should match adf7c8-adf7cf', () => {
      expect(!!new IcaoDecoder('adf7c8').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('adf7cf').isMilitary()).toBe(true);
    });
    it('should match adf7d0-adf7df', () => {
      expect(!!new IcaoDecoder('adf7d0').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('adf7df').isMilitary()).toBe(true);
    });
    it('should match adf7e0-adf7ff', () => {
      expect(!!new IcaoDecoder('adf7e0').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('adf7ff').isMilitary()).toBe(true);
    });
    it('should match adf800-adffff', () => {
      expect(!!new IcaoDecoder('adf800').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('adffff').isMilitary()).toBe(true);
    });
    it('should match ae0000-afffff', () => {
      expect(!!new IcaoDecoder('ae0000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('afffff').isMilitary()).toBe(true);
    });

    // Egypt
    it('should match 010070-01008f', () => {
      expect(!!new IcaoDecoder('010070').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('01008f').isMilitary()).toBe(true);
    });

    // Algeria
    it('should match 0a4000-0a4fff', () => {
      expect(!!new IcaoDecoder('0a4000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('0a4fff').isMilitary()).toBe(true);
    });

    // Italy
    it('should match 33ff00-33ffff', () => {
      expect(!!new IcaoDecoder('33ff00').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('33ffff').isMilitary()).toBe(true);
    });

    // Spain
    it('should match 350000-37ffff', () => {
      expect(!!new IcaoDecoder('350000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('37ffff').isMilitary()).toBe(true);
    });
    it('should not match 349fff', () => {
      expect(!!new IcaoDecoder('349fff').isMilitary()).toBe(false);
    });
    it('should not match 380000', () => {
      expect(!!new IcaoDecoder('380000').isMilitary()).toBe(false);
    });

    // France
    it('should match 3a8000-3affff', () => {
      expect(!!new IcaoDecoder('3a8000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('3affff').isMilitary()).toBe(true);
    });
    it('should match 3b0000-3bffff', () => {
      expect(!!new IcaoDecoder('3b0000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('3bffff').isMilitary()).toBe(true);
    });

    // Germany
    it('should match 3e8000-3ebfff', () => {
      expect(!!new IcaoDecoder('3ea000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('3ebfff').isMilitary()).toBe(true);
    });
    it('should match 3f4000-3f7fff', () => {
      expect(!!new IcaoDecoder('3f4000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('3f7fff').isMilitary()).toBe(true);
    });
    it('should match 3f8000-3fbfff', () => {
      expect(!!new IcaoDecoder('3f8000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('3fbfff').isMilitary()).toBe(true);
    });

    // United Kingdom
    it('should match 400000-40003f', () => {
      expect(!!new IcaoDecoder('400000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('40003f').isMilitary()).toBe(true);
    });
    it('should match 43c000-43cfff', () => {
      expect(!!new IcaoDecoder('43c000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('43cfff').isMilitary()).toBe(true);
    });

    // Austria
    it('should match 444000-447fff except 447ac7', () => {
      expect(!!new IcaoDecoder('444000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('447fff').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('447ac7').isMilitary()).toBe(false);
    });

    // Belgium
    it('should match 44f000-44ffff', () => {
      expect(!!new IcaoDecoder('44f000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('44ffff').isMilitary()).toBe(true);
    });

    // Bulgaria
    it('should match 457000-457fff', () => {
      expect(!!new IcaoDecoder('457000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('457fff').isMilitary()).toBe(true);
    });

    // Denmark
    it('should match 45f400-45f4ff', () => {
      expect(!!new IcaoDecoder('45f400').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('45f4ff').isMilitary()).toBe(true);
    });

    // Greece
    it('should match 468000-4683ff', () => {
      expect(!!new IcaoDecoder('468000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('4683ff').isMilitary()).toBe(true);
    });

    // Hungary
    it('should match 473c00-473c0f', () => {
      expect(!!new IcaoDecoder('473c00').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('473c0f').isMilitary()).toBe(true);
    });

    // Norway
    it('should match 478100-4781ff', () => {
      expect(!!new IcaoDecoder('478100').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('4781ff').isMilitary()).toBe(true);
    });

    // Netherlands
    it('should match 480000-480fff', () => {
      expect(!!new IcaoDecoder('480000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('480fff').isMilitary()).toBe(true);
    });

    // Poland
    it('should match 48d800-48d87f', () => {
      expect(!!new IcaoDecoder('48d800').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('48d87f').isMilitary()).toBe(true);
    });

    // Portugal
    it('should match 497c00-497cff', () => {
      expect(!!new IcaoDecoder('497c00').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('497cff').isMilitary()).toBe(true);
    });

    // Czech Republic
    it('should match 498420-49842f', () => {
      expect(!!new IcaoDecoder('498420').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('49842f').isMilitary()).toBe(true);
    });

    // Switzerland
    it('should match 4b7000-4b7fff', () => {
      expect(!!new IcaoDecoder('4b7000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('4b7fff').isMilitary()).toBe(true);
    });

    // Turkey
    it('should match 4b8200-4b82ff', () => {
      expect(!!new IcaoDecoder('4b8200').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('4b82ff').isMilitary()).toBe(true);
    });

    // Slovenia
    it('should match 506f00-506fff', () => {
      expect(!!new IcaoDecoder('506f00').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('506fff').isMilitary()).toBe(true);
    });

    // Oman
    it('should match 70c070-70c07f', () => {
      expect(!!new IcaoDecoder('70c070').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('70c07f').isMilitary()).toBe(true);
    });

    // Saudi Arabia
    it('should match 710258-71025f', () => {
      expect(!!new IcaoDecoder('710258').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('71025f').isMilitary()).toBe(true);
    });
    it('should match 710260-71027f', () => {
      expect(!!new IcaoDecoder('710260').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('71027f').isMilitary()).toBe(true);
    });
    it('should match 710280-71028f', () => {
      expect(!!new IcaoDecoder('710280').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('71028f').isMilitary()).toBe(true);
    });
    it('should match 710380-71039f', () => {
      expect(!!new IcaoDecoder('710380').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('71039f').isMilitary()).toBe(true);
    });

    // Israel
    it('should match 738a00-738aff', () => {
      expect(!!new IcaoDecoder('738a00').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('738aff').isMilitary()).toBe(true);
    });

    // Australia
    it('should match 7c822e-7c822f', () => {
      expect(!!new IcaoDecoder('7c822e').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7c822f').isMilitary()).toBe(true);
    });
    it('should match 7c8230-7c823f', () => {
      expect(!!new IcaoDecoder('7c8230').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7c823f').isMilitary()).toBe(true);
    });
    it('should match 7c8240-7c827f', () => {
      expect(!!new IcaoDecoder('7c8240').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7c827f').isMilitary()).toBe(true);
    });
    it('should match 7c8280-7c82ff', () => {
      expect(!!new IcaoDecoder('7c8280').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7c82ff').isMilitary()).toBe(true);
    });
    it('should match 7c8300-7c83ff', () => {
      expect(!!new IcaoDecoder('7c8300').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7c83ff').isMilitary()).toBe(true);
    });
    it('should match 7c8400 and not 7c87ff', () => {
      expect(!!new IcaoDecoder('7c8400').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7c87ff').isMilitary()).toBe(false);
    });
    it('should match 7c8800 and not 7c8fff', () => {
      expect(!!new IcaoDecoder('7c8800').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7c8fff').isMilitary()).toBe(false);
    });
    it('should match 7c9000-7c9fff', () => {
      expect(!!new IcaoDecoder('7c9000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7c9fff').isMilitary()).toBe(true);
    });
    it('should match 7ca000-7cbfff', () => {
      expect(!!new IcaoDecoder('7ca000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7cbfff').isMilitary()).toBe(true);
    });
    it('should not match 7cc409', () => {
      expect(!!new IcaoDecoder('7cc409').isMilitary()).toBe(false);
    });
    it('should match 7d0000-7dffff', () => {
      expect(!!new IcaoDecoder('7d0000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7dffff').isMilitary()).toBe(true);
    });
    it('should match 7e0000-7fffff', () => {
      expect(!!new IcaoDecoder('7e0000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('7fffff').isMilitary()).toBe(true);
    });

    // India
    it('should match 800200-8002ff', () => {
      expect(!!new IcaoDecoder('800200').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('8002ff').isMilitary()).toBe(true);
    });

    // Canada
    it('should match c20000-c3ffff', () => {
      expect(!!new IcaoDecoder('c20000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('c3ffff').isMilitary()).toBe(true);
    });

    // Brazil
    it('should match e40000-e41fff', () => {
      expect(!!new IcaoDecoder('e40000').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('e41fff').isMilitary()).toBe(true);
    });

    // Chile
    it('should match e80600-e806ff', () => {
      expect(!!new IcaoDecoder('e80600').isMilitary()).toBe(true);
      expect(!!new IcaoDecoder('e806ff').isMilitary()).toBe(true);
    });

    // Negative cases
    it('should return false for non-military ICAO', () => {
      expect(!!new IcaoDecoder('a00000').isMilitary()).toBe(false);
      expect(!!new IcaoDecoder('123456').isMilitary()).toBe(false);
      expect(!!new IcaoDecoder('000000').isMilitary()).toBe(false);
      expect(!!new IcaoDecoder('ffffff').isMilitary()).toBe(false);
    });
  });
});
