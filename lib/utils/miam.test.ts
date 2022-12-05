import { MessageDecoder } from "../MessageDecoder";

test('Simple MIAM Decode', () => {
  const decoder = new MessageDecoder();
  const miamMsgFrame = {
    label: 'MA',
    text: 'T32!<<,W/jVEJ5u(@\\!\'s.16q/)<:-JXX|Q&a)r_CuOS?R65eRb:E8<DV/R(\'OXUd&Vsp5njIZhc3K&["hCafn>bHPILl$J-V*::RL,d]?So_4M_VS;Ln"U,;8u?`,7j=ACsP@,t.rGoaFFQm1S7*\'>kRs>,:u>X?oe2->Z-5`_Ztu,Fr.R(jR7>J^s-94:^OqFYrF][5q?tMocL[p%^T#7).P:W;.$4Ym1#&8iu%ac;%S_9i<e!Lp`bDFhu;eR!R&T>qkLZ_rC^NA6gllCR_sE-?$k^?N:\'+'
  };

  const decodeResult = decoder.decode(miamMsgFrame);
  console.log(decodeResult)
})

test('v2, uncompressed, non-acars', () => {
  const decoder = new MessageDecoder();
  const miamMsgFrame = {
    label: 'MA',
    text: 'T-3!YPJ?0L8c"VuQet|KJFK,KBOS,CYHZ,KPHL'
  };

  const decodeResult = decoder.decode(miamMsgFrame);
  console.log(decodeResult);
})
