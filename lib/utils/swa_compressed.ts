/**
 * Southwest Airlines (SWA) compressed ACARS bodies, labels 37 (downlink) and 40 (uplink).
 *
 * Each body is written in one of nine substitution tables, picked by a two-digit code 01-09:
 *   label 37: <code><5-char type, in that table>\n<body in that table>
 *   label 40: <TYPE>,<code><body in that table>   (the type name is in clear)
 *
 * All 18 tables are permutations of one 44-character set. Each label 40 table is the label 37
 * table with the same code read backwards. A few characters outside the set pass through as
 * themselves; anything else is printed as UNREAD.
 */

/** The raw characters, in the order the table strings below are written. */
export const SWA_ALPHABET = ' (),-./0123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Printed for a raw character no table or passthrough covers (usually a reception error). */
export const SWA_UNREAD = '¤';

/** Table code -> decoded character for each SWA_ALPHABET position. */
export const SWA_LABEL_37_TABLES: Record<string, string> = {
  '01': 'VIK86MRN5-0PZS4UYXACEHLOTW BGD.123Q(7J9:F)/,',
  '02': 'HG.KZL97QY15WRVTN4JA06(D ,:3MPBICU/8EOFSX)2-',
  '03': '4GXE/QU5FT)20P8RSJ-169AWHLB.,37MNVCYODIKZ (:',
  '04': '1BEHMPSUY,048DG269JLOQTWZ (-/37:ACFIKNRVX).5',
  '05': '3579BDFHJLNPRTVXZ(,.02468:ACEGIKMOQSUWY )-/1',
  '06': 'AGFEDCBRQPONMLKJIH:9876543210/.-,)( ZYXWVUTS',
  '07': ':.02468ACEGIKMOQSUWY )-/13579BDFHJLNPRTVXZ(,',
  '08': '1MDS/JQ.OWZ79LNR532-6(: ,APEFTVIKYB08H)U4CXG',
  '09': '6LQMSR UZYVX(7:3-5KPTACB)021,894NODGJEFIHW./',
};

export const SWA_LABEL_40_TABLES: Record<string, string> = {
  '01': 'IRXZ2MY3NOP71-S,UVAJBLCWKD(T)E.0F4Q/6G8 H:95',
  '02': 'GEXHZ)QC3YJ:4D0R/IBMOFSU( NA,.K9TL16V8P75W2-',
  '03': 'XY3KAJ-5B4L 0CM7DZEIQT,1(GU:VHNOS6.892/PF)RW',
  '04': 'HIX2JYK3 8L4Z9M5:NO(P6)Q7,RASB-TC.DU/E0VFW1G',
  '05': 'V:WAXBYCZD E(F)G,HI-J.K/L0M1N2O3P4Q5R6S7T8U9',
  '06': 'RQPONMLKJIHGFEDCBA /.-,)(:9876543210ZYXWVUTS',
  '07': 'CYDZE(F)G,H-I.J/K 0L1M2N3O4P5Q6R7S8T9U:VAWBX',
  '08': 'FDUGB0-R A:W9C4S5EHQX)JKZTN.O6(71I/8,LVM2YP3',
  '09': '/5GK9YZHJI8N: 6LM7DFEQTURWVSA(,OPB).-C03X421',
};

// Raw characters outside the tables that are literal. Label 37 raw '>' reads as '+'.
const PASS_37: Record<string, string> = { '*': '*', '>': '+' };
const PASS_40: Record<string, string> = {
  '*': '*',
  '?': '?',
  "'": "'",
  '#': '#',
  _: '_',
};

/** A decoded body: the type name and the text, with line breaks as '|'. */
export interface SwaDecoded {
  type: string;
  text: string;
}

function lookup(table: string, c: string): string | undefined {
  const i = SWA_ALPHABET.indexOf(c);
  return i < 0 ? undefined : table[i];
}

function plain(table: string, body: string, pass: Record<string, string>) {
  let out = '';
  for (const c of body) {
    if (c === '\n') out += '|';
    else out += lookup(table, c) ?? pass[c] ?? SWA_UNREAD;
  }
  return out;
}

/** Decode a label 37 body, or return undefined if it is not in the SWA layout. */
export function decodeSwaLabel37(body: string): SwaDecoded | undefined {
  const b = body.replace(/\r/g, '');
  const table = SWA_LABEL_37_TABLES[b.substring(0, 2)];
  if (!table) return undefined;
  let nl = b.indexOf('\n');
  // TAR02 ends its header with the field separator instead of a line break.
  if (nl !== 7 && b.length > 7 && lookup(table, b[7]) === ',') nl = 7;
  if (nl < 0) return undefined;
  let type = '';
  for (const c of b.substring(2, Math.min(nl, 7))) {
    type += lookup(table, c) ?? SWA_UNREAD;
  }
  return { type, text: plain(table, b.substring(nl + 1), PASS_37) };
}

/** Decode a label 40 body, or return undefined if it is not in the SWA layout. */
export function decodeSwaLabel40(body: string): SwaDecoded | undefined {
  const b = body.replace(/\r/g, '');
  if (b.startsWith('POS01,')) {
    // Not compressed: `POS01,Y,05` turns position reporting on, every 05 minutes.
    return { type: 'POS01', text: b.trim() };
  }
  const code = b[5] === ',' ? b.substring(6, 8) : '';
  if (code === '00') {
    // Table code 00 is plain text (seen on GEN01 PDC acknowledgements).
    return {
      type: b.substring(0, 5),
      text: b.substring(8).replace(/\n/g, '|'),
    };
  }
  const table = SWA_LABEL_40_TABLES[code];
  if (!table) return undefined;
  return {
    type: b.substring(0, 5),
    text: plain(table, b.substring(8), PASS_40),
  };
}

/**
 * Type names seen from Southwest aircraft in a year of airframes traffic. Another airline's label
 * 37 text can decode to a name of the same shape (TRF04, YYY41), so only these are decoded.
 */
const SWA_TYPES: Record<'37' | '40', Set<string>> = {
  '37': new Set([
    'ADV01',
    'CLB02',
    'DIV02',
    'DVC01',
    'ETA03',
    'FCM01',
    'FCR03',
    'FFD01',
    'FHD04',
    'FLI01',
    'FTD02',
    'GAM02',
    'GSR02',
    'HGD03',
    'HLD01',
    'INN03',
    'INR04',
    'MXR03',
    'OFF02',
    'OFP01',
    'ONN02',
    'OUT03',
    'PFR03',
    'PFR04',
    'PJS01',
    'PNS01',
    'POS01',
    'POS02',
    'PRM01',
    'RRR01',
    'RTG03',
    'RTG04',
    'RTG05',
    'TAR02',
    'TDM01',
    'TOD03',
    'TRB02',
    'TXI02',
    'VXR02',
  ]),
  '40': new Set([
    'ASR01',
    'DVP01',
    'FTX01',
    'GAR03',
    'GEN01',
    'PIC01',
    'POS01',
    'WFC01',
  ]),
};

/** True for a type name Southwest sends on that label (POS01, FTX01). */
export function isSwaType(type: string, label: '37' | '40'): boolean {
  return SWA_TYPES[label].has(type);
}
