export class IcaoDecoder {
  name : string;
  icao : string;

  // Pre-compiled regex patterns for military ICAO address detection (performance optimization)
  private static readonly MILITARY_PATTERNS: RegExp[] = [
    /^adf[7-9]/,    // adf7c8-adf7cf = united states mil_5(uf)
    /^adf[a-f]/,    // adf7d0-adf7df = united states mil_4(uf)
    /^a[ef]/,       // adf7e0-adf7ff = united states mil_3(uf), adf800-adffff = united states mil_2(uf), ae0000-afffff = united states mil_1(uf)
    /^0100[78]/,    // 010070-01008f = egypt_mil
    /^0a4/,         // 0a4000-0a4fff = algeria mil(ap)
    /^33ff/,        // 33ff00-33ffff = italy mil(iy)
    /^3a[89a-f]/,   // 3a8000-3affff = france mil_1(fs)
    /^3b/,          // 3b0000-3bffff = france mil_2(fs)
    /^3e[ab]/,      // 3e8000-3ebfff = germany mil_1(df)
    /^3f[4-9ab]/,   // 3f4000-3f7fff = germany mil_2(df), 3f8000-3fbfff = germany mil_3(df)
    /^4000[0-3]/,   // 400000-40003f = united kingdom mil_1(ra)
    /^43c/,         // 43c000-43cfff = united kingdom mil(ra)
    /^44[4-7]/,     // 444000-447fff = austria mil(aq)
    /^44f/,         // 44f000-44ffff = belgium mil(bc)
    /^457/,         // 457000-457fff = bulgaria mil(bu)
    /^45f4/,        // 45f400-45f4ff = denmark mil(dg)
    /^468[0-3]/,    // 468000-4683ff = greece mil(gc)
    /^473c0/,       // 473c00-473c0f = hungary mil(hm)
    /^4781/,        // 478100-4781ff = norway mil(nn)
    /^480/,         // 480000-480fff = netherlands mil(nm)
    /^48d8[0-7]/,   // 48d800-48d87f = poland mil(po)
    /^497c/,        // 497c00-497cff = portugal mil(pu)
    /^49842/,       // 498420-49842f = czech republic mil(ct)
    /^4b7/,         // 4b7000-4b7fff = switzerland mil(su)
    /^4b82/,        // 4b8200-4b82ff = turkey mil(tq)
    /^506f/,        // 506f00-506fff = slovenia mil(sj)
    /^70c07/,       // 70c070-70c07f = oman mil(on)
    /^7102[5-8]/,   // 710258-71025f = saudi arabia mil_1(sx), 710260-71027f = saudi arabia mil_2(sx), 710280-71028f = saudi arabia mil_3(sx)
    /^7103[89]/,    // 710380-71039f = saudi arabia mil_4(sx)
    /^738a/,        // 738a00-738aff = israel mil(iz)
    /^7c8[2-48]/,   // 7c822e-7c822f = australia mil_1(av), 7c8230-7c823f = australia mil_2(av), 7c8240-7c827f = australia mil_3(av), 7c8280-7c82ff = australia mil_4(av), 7c8300-7c83ff = australia mil_5(av), 7c8400-7c87ff = australia mil_6(av), 7c8800-7c8fff = australia mil_7(av)
    /^7[def]/,      // 7d0000-7dffff = australia mil_11(av), 7e0000-7fffff = australia mil_12(av)
    /^8002/,        // 800200-8002ff = india mil(im)
    /^c[23]/,       // c20000-c3ffff = canada mil(cb)
    /^e4[01]/,      // e40000-e41fff = brazil mil(bq)
    /^e806/         // e80600-e806ff = chile mil(cq)
  ];

  constructor(icao: string) {
    this.name = 'icao-decoder-typescript';
    this.icao = icao;
  }

  isMilitary() {
    const i = this.icao;
    // Range checks that cannot be expressed as regex
    if ((i >= '350000' && i <= '37ffff') ||
        (i >= '7c9000' && i <= '7cbfff')) {
      return true;
    }
    // Austria exception
    if (/^44[4-7]/.test(i) && i === '447ac7') {
      return false;
    }
    // Australia exception
    if (i === '7cc409') {
      return false;
    }
    return IcaoDecoder.MILITARY_PATTERNS.some((p) => p.test(i));
  }
}

export default {
};
