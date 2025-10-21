export class IcaoDecoder {
  name : string;
  icao : string;

  // Pre-compiled regex patterns for military ICAO address detection (performance optimization)
  private static readonly MILITARY_PATTERNS = {
    // US military
    US_MIL_1: /^adf[7-9]/,
    US_MIL_2: /^adf[a-f]/,
    US_MIL_3: /^a[ef]/,

    // Egypt military
    EGYPT_MIL: /^0100[78]/,

    // Algeria military
    ALGERIA_MIL: /^0a4/,

    // Italy military
    ITALY_MIL: /^33ff/,

    // France military
    FRANCE_MIL_1: /^3a[89a-f]/,
    FRANCE_MIL_2: /^3b/,

    // Germany military
    GERMANY_MIL_1: /^3e[ab]/,
    GERMANY_MIL_2: /^3f[4-9ab]/,

    // UK military
    UK_MIL_1: /^4000[0-3]/,
    UK_MIL_2: /^43c/,

    // Austria military
    AUSTRIA_MIL: /^44[4-7]/,

    // Belgium military
    BELGIUM_MIL: /^44f/,

    // Bulgaria military
    BULGARIA_MIL: /^457/,

    // Denmark military
    DENMARK_MIL: /^45f4/,

    // Greece military
    GREECE_MIL: /^468[0-3]/,

    // Hungary military
    HUNGARY_MIL: /^473c0/,

    // Norway military
    NORWAY_MIL: /^4781/,

    // Netherlands military
    NETHERLANDS_MIL: /^480/,

    // Poland military
    POLAND_MIL: /^48d8[0-7]/,

    // Portugal military
    PORTUGAL_MIL: /^497c/,

    // Czech Republic military
    CZECH_MIL: /^49842/,

    // Switzerland military
    SWITZERLAND_MIL: /^4b7/,

    // Turkey military
    TURKEY_MIL: /^4b82/,

    // Slovenia military
    SLOVENIA_MIL: /^506f/,

    // Oman military
    OMAN_MIL: /^70c07/,

    // Saudi Arabia military
    SAUDI_MIL_1: /^7102[5-8]/,
    SAUDI_MIL_2: /^7103[89]/,

    // Israel military
    ISRAEL_MIL: /^738a/,

    // Australia military
    AUSTRALIA_MIL_1: /^7c8[2-48]/,
    AUSTRALIA_MIL_2: /^7[def]/,

    // India military
    INDIA_MIL: /^8002/,

    // Canada military
    CANADA_MIL: /^c[23]/,

    // Brazil military
    BRAZIL_MIL: /^e4[01]/,

    // Chile military
    CHILE_MIL: /^e806/,
  };

  constructor(icao: string) {
    this.name = 'icao-decoder-typescript';
    this.icao = icao;
  }

  isMilitary() {
    const i = this.icao;
    const p = IcaoDecoder.MILITARY_PATTERNS;

    return (
      false
      // us military
      //adf7c8-adf7cf = united states mil_5(uf)
      //adf7d0-adf7df = united states mil_4(uf)
      //adf7e0-adf7ff = united states mil_3(uf)
      //adf800-adffff = united states mil_2(uf)
      || p.US_MIL_1.test(i)
      || p.US_MIL_2.test(i)
      //ae0000-afffff = united states mil_1(uf)
      || p.US_MIL_3.test(i)

      //010070-01008f = egypt_mil
      || p.EGYPT_MIL.test(i)

      //0a4000-0a4fff = algeria mil(ap)
      || p.ALGERIA_MIL.test(i)

      //33ff00-33ffff = italy mil(iy)
      || p.ITALY_MIL.test(i)

      //350000-37ffff = spain mil(sp)
      || (i >= '350000' && i <= '37ffff')

      //3a8000-3affff = france mil_1(fs)
      || p.FRANCE_MIL_1.test(i)
      //3b0000-3bffff = france mil_2(fs)
      || p.FRANCE_MIL_2.test(i)

      //3e8000-3ebfff = germany mil_1(df)
      // remove 8 and 9 from mil arnge
      || p.GERMANY_MIL_1.test(i)
      //3f4000-3f7fff = germany mil_2(df)
      //3f8000-3fbfff = germany mil_3(df)
      || p.GERMANY_MIL_2.test(i)

      //400000-40003f = united kingdom mil_1(ra)
      || p.UK_MIL_1.test(i)
      //43c000-43cfff = united kingdom mil(ra)
      || p.UK_MIL_2.test(i)

      //444000-447fff = austria mil(aq)
      || (p.AUSTRIA_MIL.test(i) && i != '447ac7')

      //44f000-44ffff = belgium mil(bc)
      || p.BELGIUM_MIL.test(i)

      //457000-457fff = bulgaria mil(bu)
      || p.BULGARIA_MIL.test(i)

      //45f400-45f4ff = denmark mil(dg)
      || p.DENMARK_MIL.test(i)

      //468000-4683ff = greece mil(gc)
      || p.GREECE_MIL.test(i)

      //473c00-473c0f = hungary mil(hm)
      || p.HUNGARY_MIL.test(i)

      //478100-4781ff = norway mil(nn)
      || p.NORWAY_MIL.test(i)
      //480000-480fff = netherlands mil(nm)
      || p.NETHERLANDS_MIL.test(i)
      //48d800-48d87f = poland mil(po)
      || p.POLAND_MIL.test(i)
      //497c00-497cff = portugal mil(pu)
      || p.PORTUGAL_MIL.test(i)
      //498420-49842f = czech republic mil(ct)
      || p.CZECH_MIL.test(i)

      //4b7000-4b7fff = switzerland mil(su)
      || p.SWITZERLAND_MIL.test(i)
      //4b8200-4b82ff = turkey mil(tq)
      || p.TURKEY_MIL.test(i)

      //506f00-506fff = slovenia mil(sj)
      || p.SLOVENIA_MIL.test(i)

      //70c070-70c07f = oman mil(on)
      || p.OMAN_MIL.test(i)

      //710258-71025f = saudi arabia mil_1(sx)
      //710260-71027f = saudi arabia mil_2(sx)
      //710280-71028f = saudi arabia mil_3(sx)
      //710380-71039f = saudi arabia mil_4(sx)
      || p.SAUDI_MIL_1.test(i)
      || p.SAUDI_MIL_2.test(i)

      //738a00-738aff = israel mil(iz)
      || p.ISRAEL_MIL.test(i)

      //7c822e-7c822f = australia mil_1(av)
      //7c8230-7c823f = australia mil_2(av)
      //7c8240-7c827f = australia mil_3(av)
      //7c8280-7c82ff = australia mil_4(av)
      //7c8300-7c83ff = australia mil_5(av)
      //7c8400-7c87ff = australia mil_6(av)
      //7c8800-7c8fff = australia mil_7(av)
      || p.AUSTRALIA_MIL_1.test(i)
      //7c9000-7c9fff = australia mil_8(av)
      //7ca000-7cbfff = australia mil_9(av)
      || (i >= '7c9000' && i <= '7cbfff')
      //7cc000-7cffff = australia mil_10(av) 7cc409 not mil, remove this range
      //7d0000-7dffff = australia mil_11(av)
      //7e0000-7fffff = australia mil_12(av)
      || p.AUSTRALIA_MIL_2.test(i)

      //800200-8002ff = india mil(im)
      || p.INDIA_MIL.test(i)

      //c20000-c3ffff = canada mil(cb)
      || p.CANADA_MIL.test(i)

      //e40000-e41fff = brazil mil(bq)
      || p.BRAZIL_MIL.test(i)

      //e80600-e806ff = chile mil(cq)
      || p.CHILE_MIL.test(i)
    );
  }

}

export default {
};
