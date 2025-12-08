export class IcaoDecoder {
  name : string;
  icao : string;

  // Military ICAO address ranges (as [start, end] tuples, inclusive)
  private static readonly MILITARY_RANGES: Array<[number, number]> = [
    [0x010070, 0x01008f], // Egypt
    [0x0a4000, 0x0a4fff], // Algeria
    [0x33ff00, 0x33ffff], // Italy
    [0x350000, 0x37ffff], // Spain
    [0x3a8000, 0x3affff], // France 1
    [0x3b0000, 0x3bffff], // France 2
    [0x3ea000, 0x3ebfff], // Germany 4
    [0x3f4000, 0x3f7fff], // Germany 2
    [0x3f8000, 0x3fbfff], // Germany 3
    [0x400000, 0x40003f], // UK 1
    [0x43c000, 0x43cfff], // UK 2
    [0x444000, 0x447ac6], // Austria (before exception)
    [0x447ac8, 0x447fff], // Austria (after exception)
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
    [0x506f00, 0x506fff], // Slovenia
    [0x70c070, 0x70c07f], // Oman
    [0x710258, 0x71025f], // Saudi 1
    [0x710260, 0x71027f], // Saudi 2
    [0x710280, 0x71028f], // Saudi 3
    [0x710380, 0x71039f], // Saudi 4
    [0x738a00, 0x738aff], // Israel
    [0x7c822e, 0x7c822f], // Australia 1
    [0x7c8230, 0x7c823f], // Australia 2
    [0x7c8240, 0x7c827f], // Australia 3
    [0x7c8280, 0x7c82ff], // Australia 4
    [0x7c8300, 0x7c83ff], // Australia 5
    [0x7c8400, 0x7c87fe], // Australia 6 (before exception)
    [0x7c8800, 0x7c8ffe], // Australia 7 (before exception)
    [0x7c9000, 0x7c9fff], // Australia 8
    [0x7ca000, 0x7cbfff], // Australia 9
    [0x7d0000, 0x7dffff], // Australia 11
    [0x7e0000, 0x7fffff], // Australia 12
    [0x800200, 0x8002ff], // India
    [0xadf7c8, 0xadf7cf], // US mil_5
    [0xadf7d0, 0xadf7df], // US mil_4
    [0xadf7e0, 0xadf7ff], // US mil_3
    [0xadf800, 0xadffff], // US mil_2
    [0xae0000, 0xafffff], // US mil_1
    [0xc20000, 0xc3ffff], // Canada
    [0xe40000, 0xe41fff], // Brazil
    [0xe80600, 0xe806ff], // Chile
  ];

  constructor(icao: string) {
    this.name = 'icao-decoder-typescript';
    this.icao = icao;
  }

  isMilitary(): boolean {
    const i = this.icao;
    const n = parseInt(i, 16);
    // Range checks only
    for (const [start, end] of IcaoDecoder.MILITARY_RANGES) {
      if (n >= start && n <= end) {
        return true;
      }
    }
    return false;
  }
}

export default {
};
