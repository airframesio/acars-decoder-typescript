import { MIAMCoreUtils, MIAMCoreV1Compression, MIAMCoreV2Compression } from "./miam";

test('v1, compressed, acars', () => {
  const msg = 'T32!<<,W/jVEJ5u(@\\!\'s.16q/)<:-JXX|Q&a)r_CuOS?R65eRb:E8<DV/R(\'OXUd&Vsp5njIZhc3K&["hCafn>bHPILl$J-V*::RL,d]?So_4M_VS;Ln"U,;8u?`,7j=ACsP@,t.rGoaFFQm1S7*\'>kRs>,:u>X?oe2->Z-5`_Ztu,Fr.R(jR7>J^s-94:^OqFYrF][5q?tMocL[p%^T#7).P:W;.$4Ym1#&8iu%ac;%S_9i<e!Lp`bDFhu;eR!R&T>qkLZ_rC^NA6gllCR_sE-?$k^?N:\'+';
  const decodeResult = MIAMCoreUtils.parse(msg);

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.message.data.version).toBe(1);
  expect(decodeResult.message.data.complete).toBe(true);
  expect(decodeResult.message.data.crcOk).toBe(true);
  expect(decodeResult.message.data.crc).toBe(0x1a764e3e);
  expect(decodeResult.message.data.compression).toBe(MIAMCoreV1Compression.Deflate);
  expect(decodeResult.message.data.msgNum).toBe(86);
  expect(decodeResult.message.data.ackOptions).toBe(1);
  expect(decodeResult.message.data.acars.tail).toBe('.A7-ANS');
  expect(decodeResult.message.data.acars.label).toBe('H1');
  expect(decodeResult.message.data.acars.sublabel).toBe('DF');
  expect(decodeResult.message.data.acars.mfi).toBe(undefined);
  expect(decodeResult.message.data.acars.text).toBe(
    'A350,000163,1,1,TB000000/REP054,03,01;H01,054,03,01,4210,00836,.A7-ANS,5,0,11,07,22,03,21,00,080/H02,' +
    'KDFW OTHH,QTR22G  ,S0285,S0485,T9400T0301/H03,Traffic Policing Failure/A10,XXXXXXXXXXXXXXXXXXXX,' +
    'XXXXXXXXXXXXXXXXXXXX,0000000001/A11,03,20,10,03,21,00/B10,XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/' +
    'B11,0000000001,XXXXXXXXXX/C10,XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/C11,0000000000,XXXXXXXXXX/D10,' +
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/D11,0000012401,XXXXXXXXXX/E10,XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/' +
    'E11,0000000000,XXXXXXXXXX/F10,XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/F11,0000000000,XXXXXXXXXX/:'
  )
})

test('v2, uncompressed, non-acars', () => {
  const msg = 'T-3!YPJ?0L8c"VuQet|KJFK,KBOS,CYHZ,KPHL';
  const decodeResult = MIAMCoreUtils.parse(msg);

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.message.data.version).toBe(2);
  expect(decodeResult.message.data.msgNum).toBe(9);
  expect(decodeResult.message.data.ackOptions).toBe(0);
  expect(decodeResult.message.data.compression).toBe(MIAMCoreV2Compression.None);
  expect(decodeResult.message.data.crcOk).toBe(true);
  expect(decodeResult.message.data.crc).toBe(0x38a8);
  expect(decodeResult.message.data.non_acars.appId).toBe('0AW');
  expect(decodeResult.message.data.non_acars.text).toBe('KJFK,KBOS,CYHZ,KPHL');

  expect(decodeResult.message.data.acars).toBe(undefined);
})

test('v1, compressed, acars, incomplete', () => {
  const msg = 'T12!<<B[67joO3AE3:!\'s.16q2Tb:9FQs|X]eG[j2M]0.rudB<$2(Xj>:Whn0\'KEp#_@kN+<G\'I.G-DIX^RW,uJ,M,&9<XO?406A(Bnse^_UPF+su$OC:KOI/*p=F8Gh5:Or%)B`e/.%tN-jYGidD%+[OhHG_Wc9K^E3Skpit$/,N);FlMj%g)Orhs^"es8)BPa6C51Im?a^0@S64/';
  const decodeResult = MIAMCoreUtils.parse(msg);

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.message.data.version).toBe(1);
  expect(decodeResult.message.data.complete).toBe(false);
  expect(decodeResult.message.data.crcOk).toBe(false);
  expect(decodeResult.message.data.crc).toBe(0x7d8e4eae);
  expect(decodeResult.message.data.compression).toBe(MIAMCoreV1Compression.Deflate);
  expect(decodeResult.message.data.msgNum).toBe(20);
  expect(decodeResult.message.data.ackOptions).toBe(1);
  expect(decodeResult.message.data.acars.tail).toBe('B-18910');
  expect(decodeResult.message.data.acars.label).toBe('H1');
  expect(decodeResult.message.data.acars.sublabel).toBe('DF');
  expect(decodeResult.message.data.acars.mfi).toBe(undefined);
  expect(decodeResult.message.data.acars.text).toBe(undefined);
})
