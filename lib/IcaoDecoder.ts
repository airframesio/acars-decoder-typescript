export class IcaoDecoder {
  name : string;
  icao : string;

  // Military ICAO address ranges (as [start, end] tuples, inclusive)
  private static readonly MILITARY_RANGES: Array<[number, number]> = [
    [0x010070, 0x01008f], // Egypt
    [0x0a4000, 0x0a4fff], // Algeria
    [0x33ff00, 0x33ffff], // Italy
    [0x350000, 0x37ffff], // Spain
    [0x3aa000, 0x3affff], // France 1
    [0x3b7000, 0x3bffff], // France 2
    [0x3ea000, 0x3ebfff], // Germany 1
    [0x3f4000, 0x3fbfff], // Germany 2
    [0x400000, 0x40003f], // UK 1
    [0x43c000, 0x43cfff], // UK 2
    [0x444000, 0x446fff], // Austria
    [0x44f000, 0x44ffff], // Belgium
    [0x457000, 0x457fff], // Bulgaria
    [0x45f400, 0x45f4ff], // Denmark
    [0x468000, 0x4683ff], // Greece
    [0x473c00, 0x473c0f], // Hungary
    [0x478100, 0x4781ff], // Norway
    [0x480000, 0x480fff], // Netherlands
    [0x48d800, 0x48d87f], // Poland
    [0x497c00, 0x497cff], // Portugal
    [0x498420, 0x49842f], // Czech
    [0x4b7000, 0x4b7fff], // Switzerland
    [0x4b8200, 0x4b82ff], // Turkey
    [0x70c070, 0x70c07f], // Oman
    [0x710258, 0x71028f], // Saudi 1
    [0x710380, 0x71039f], // Saudi 2
    [0x738a00, 0x738aff], // Israel
    [0x7cf800, 0x7cfaff], // Australia
    [0x800200, 0x8002ff], // India
    [0xadf7c8, 0xafffff], // USA
    [0xc20000, 0xc3ffff], // Canada
    [0xe40000, 0xe41fff], // Brazil
  ];

  constructor(icao: string) {
    this.name = 'icao-decoder-typescript';
    this.icao = icao;
  }

  isMilitary(): boolean {
    const i = this.icao;
    const n = parseInt(i, 16);
    for (const [start, end] of IcaoDecoder.MILITARY_RANGES) {
      if (start <= n && n <= end) {
        return true;
      }
    }
    return false;
  }
}
