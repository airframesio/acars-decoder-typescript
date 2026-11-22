/**
 * Parser for weight and balance loadsheets sent over ACARS.
 *
 * Most airlines uplink the IATA AHM 517 "LOADSHEET" text, wrapped in their
 * own routing header and on many labels (RA, C1, 2A, 10, 3L, 3T, 22, ...):
 *
 *   LOADSHEET FINAL 1359 EDNO1
 *   AI160/21      21NOV26
 *   LGW AMD VT-ALP   3/15
 *   ZFW 214843 MAX 237682  L
 *   TOF 73700
 *   TOW 288543 MAX 312967
 *   TIF 61677
 *   LAW 226866 MAX 251290
 *   UNDLD 22839
 *   PAX/4/33/302 TTL 342
 *   MACZFW   32.5
 *   MACTOW   35.0
 *   ...
 *
 * Crews also acknowledge loadsheets ("LOADSHEET FINAL,EDNO 01,ACCEPT",
 * "LDSHT ACCEPT ACK") and request them ("LOADSHEET REQ"); those are
 * returned with kind `acceptance` or `request`.
 *
 * Weights are whole numbers in the airline's unit (usually kg; set in
 * `weight_unit` only when the loadsheet says so). Airports are as written
 * (IATA on most loadsheets, ICAO on some).
 */

export type LoadsheetKind = 'loadsheet' | 'acceptance' | 'request';
export type LoadsheetStatus = 'final' | 'prelim';

export interface Loadsheet {
  kind: LoadsheetKind;
  status?: LoadsheetStatus;
  edition?: number;
  /** Issue time as sent, HHMM. */
  time?: string;
  flight_number?: string;
  /** Day of month after the flight number (AI160/21). */
  flight_day?: number;
  /** Flight date, YYYY-MM-DD, from 21NOV26. */
  date?: string;
  departure?: string;
  arrival?: string;
  registration?: string;
  /** Crew as sent, cockpit/cabin (3/15) or cockpit/extra/cabin. */
  crew?: string;
  aircraft_type?: string;
  weight_unit?: 'KG' | 'LB';
  zfw?: number;
  zfw_max?: number;
  tof?: number;
  tow?: number;
  tow_max?: number;
  tif?: number;
  law?: number;
  law_max?: number;
  /** Which maximum limits the load: ZFW, TOW or LAW (the `L` marker). */
  limiting?: 'ZFW' | 'TOW' | 'LAW';
  underload?: number;
  dow?: number;
  doi?: number;
  bw?: number;
  bi?: number;
  dli?: number;
  li_zfw?: number;
  li_tow?: number;
  li_law?: number;
  mac_zfw?: number;
  mac_tow?: number;
  mac_law?: number;
  /** Passengers by class or zone as sent (4/33/302). */
  pax_breakdown?: string;
  pax_total?: number;
  /** Infants (PAX 339 PLUS 3), already counted in pax_total. */
  infants?: number;
  /** Total on board, crew included. */
  tob?: number;
  notoc?: boolean;
}

const LS_HEADER = /\bLS\s+(?:FINAL|PRELIM)/;
const HEADER_WORD =
  /LOADSHEET|LOAD SHEET|L O A D S H E E T|\bLS\s+(?:FINAL|PRELIM)/;
// Lines that mention a loadsheet without starting one.
const NOT_HEADER =
  /END (?:OF )?(?:ACARS )?LOADSHEET|LOADSHEET END|AMENDMENTS|WILL FOLLOW|NO FINAL LOADSHEET|AWAITING|CANCELLED|CHECKS PERFORMED|ACCEPT|\bACK|RCVD|\bREQ\b|REQUEST/;
const STATUS = /\b(FINAL|PRELIM)(?:INARY)?/;
const EDITION = /\bED(?:NO?|N0)?\s*0*(\d{1,2})\b/;
// EDNO H040098-KO/02: a reference, then the edition after the slash.
const EDITION_REF = /\bEDNO\s+[A-Z0-9-]+\/0*(\d{1,2})\b/;
const FLIGHT =
  /^([A-Z0-9]{2}[A-Z]?\d{1,4}[A-Z]?)(?:\/(\d{1,2}))?(?=[\s/]|$)(.*)$/;
const DATE =
  /\b(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})\b/;
const ROUTE =
  /^([A-Z]{3,4})(?:\s+|\/|-)([A-Z]{3,4})(?:\s+([A-Z0-9]{1,2}-?[A-Z0-9]{2,6}))?(?:\s+(\d{1,2}\/\d{1,2}(?:\/\d{1,2})?))?(?=\s|$)/;
const ROUTE_JOINED =
  /^([A-Z]{3})([A-Z]{3})\s+([A-Z0-9]{1,2}-?[A-Z0-9]{2,6})(?:\s+(\d{1,2}\/\d{1,2}(?:\/\d{1,2})?))?(?=\s|$)/;
// Loadsheet keys that look like airport codes on an index or weight line.
const FIELD_KEY =
  /^(?:MAC|ZFW|TOW|LAW|LDW|LGW|DOW|DOI|DLI|TOF|TIF|PAX|TTL|TOB|CREW|ULOAD|UNDLD)$/;
const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];
const ACCEPT_CSV =
  /,([A-Z]{3,4}),([A-Z]{3,4}),(\d{6}),(\d{4}),LOADSHEET (FINAL|PRELIM),EDNO\s*(\d+),ACCEPT/;
type IndexField =
  | 'doi'
  | 'bi'
  | 'dli'
  | 'li_zfw'
  | 'li_tow'
  | 'li_law'
  | 'mac_zfw'
  | 'mac_tow'
  | 'mac_law';
const INDEX_KEYS: [string, IndexField][] = [
  ['DOI', 'doi'],
  ['BI', 'bi'],
  ['DLI', 'dli'],
  ['LIZFW', 'li_zfw'],
  ['LITOW', 'li_tow'],
  ['LILAW', 'li_law'],
  ['MACZFW', 'mac_zfw'],
  ['MACTOW', 'mac_tow'],
  ['MACLAW', 'mac_law'],
];
const INDEX_PATTERNS = INDEX_KEYS.map(
  ([key, field]) =>
    [
      // MACZFW 32.5, MAC ZFW: 30.58, DOI 5,61 (decimal comma)
      new RegExp(
        `(?:^|\\s)${key.replace(/^(MAC|LI)/, '$1 ?')}:?\\s+(-?\\d+(?:[.,]\\d+)?)(?![\\d,])`,
      ),
      field,
    ] as [RegExp, IndexField],
);
type WeightField = 'zfw' | 'tow' | 'law';
const WEIGHT_PATTERNS: [RegExp, WeightField, 'ZFW' | 'TOW' | 'LAW'][] = [
  [/^ZFW(?: ACTUAL)?:?\s+(\d+)(?![\d.])/, 'zfw', 'ZFW'],
  [/^TOW(?: ACTUAL)?:?\s+(\d+)(?![\d.])/, 'tow', 'TOW'],
  // LGW and LW are landing weight here only because the line starts with
  // them and a number follows; the route line (LGW AMD VT-ALP) has no number.
  [/^(?:LAW|LDW|LGW|LW)(?: ACTUAL)?:?\s+(\d+)(?![\d.])/, 'law', 'LAW'],
];
// A bare weight on the last line, possibly cut at a message split.
const CUT_WEIGHT =
  /^(ZFW|TOW|LAW|LDW|LGW|LW|TOF|TIF|TF|BO|DOW|UNDLD|ULOAD|UNDERLOAD)(?: ACTUAL)?:?\s+(\d+)$/;
// Weight and index in columns, maximum after them (freighter layout):
//   DOW   184097   5,61
//   ZFW   272172  17,42 286600 Max
//   TOW   297997  36,27 312425 Op. Max
//   ZFW MAC 21,8
const COLUMN_INDEX: [RegExp, IndexField][] = [
  [/^DOW\s+\d+\s+(-?\d+[.,]\d+)(?:\s|$)/, 'doi'],
  [/^ZFW\s+\d+\s+(-?\d+[.,]\d+)(?:\s|$)/, 'li_zfw'],
  [/^TOW\s+\d+\s+(-?\d+[.,]\d+)(?:\s|$)/, 'li_tow'],
  [/^(?:LAW|LDW|LW)\s+\d+\s+(-?\d+[.,]\d+)(?:\s|$)/, 'li_law'],
  [/^ZFW MAC:?\s+(\d+[.,]\d+)(?:\s|$)/, 'mac_zfw'],
  [/^TOW MAC:?\s+(\d+[.,]\d+)(?:\s|$)/, 'mac_tow'],
  [/^(?:LAW|LDW|LDG|LW) MAC:?\s+(\d+[.,]\d+)(?:\s|$)/, 'mac_law'],
];
const MAX_BEFORE = /\bM(?:AX)?\s*(\d+)/;
// Not the fraction of an index (17,42 Max closes the index, no maximum).
const MAX_AFTER = /(?<![.,\d])(\d+)\s+(?:Op\.\s+)?Max\b/i;

/**
 * Cheap check: could this text hold a loadsheet? Substring scans (plus the LS
 * header regex, run only when "LS" occurs, so "LS  PRELIM" with any spacing
 * passes) that cover every HEADER_WORD alternative, so the parser never misses
 * a header this check rejected, plus LDSHT, which only acceptances use.
 */
export function mayBeLoadsheet(text: string): boolean {
  return (
    text.includes('LOADSHEET') ||
    text.includes('LOAD SHEET') ||
    text.includes('L O A D S H E E T') ||
    (text.includes('LS') && LS_HEADER.test(text)) ||
    text.includes('LDSHT')
  );
}

function cleanLines(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) =>
      l
        .replace(/\t/g, ' ')
        .replace(/^[\s\-.*/]+/, '')
        .trimEnd(),
    );
}

function flightDate(dd: string, mon: string, yy: string): string | undefined {
  const m = MONTHS.indexOf(mon);
  const d = Number(dd);
  if (m < 0 || d < 1 || d > 31) return undefined;
  return `20${yy}-${String(m + 1).padStart(2, '0')}-${dd}`;
}

function parseHeader(ls: Loadsheet, header: string, next: string[]) {
  const status = STATUS.exec(header) || STATUS.exec(next[0] ?? '');
  if (status) ls.status = status[1] === 'FINAL' ? 'final' : 'prelim';
  const rest = header.slice(header.search(HEADER_WORD));
  const edition = EDITION.exec(rest);
  if (edition) ls.edition = Number(edition[1]);
  for (const t of rest
    .replace(EDITION, ' ')
    .replace(DATE, ' ')
    .trim()
    .split(/\s+/)
    .slice(1)) {
    if (/^\d{4}Z?$/.test(t) && ls.time === undefined) ls.time = t.slice(0, 4);
    else if (/^\d{3}$/.test(t) && ls.edition === undefined)
      ls.edition = Number(t);
  }
  // LOADSHEET  QY6731   REF 2NM0H
  const named =
    /^(?:LOADSHEET|LOAD SHEET)\s+([A-Z0-9]{2}[A-Z]?\d{1,4}[A-Z]?)\s+REF\b/.exec(
      rest,
    );
  if (named) ls.flight_number = named[1];
  const finalNo = /^(?:FINAL|PRELIM)0*(\d{1,2})\s/.exec(next[0] ?? '');
  if (ls.edition === undefined && finalNo) ls.edition = Number(finalNo[1]);
  if (ls.edition === undefined) {
    // EDNO on one of the next lines (EI132/21 21NOV26 EDNO 001).
    for (const line of next.slice(0, 3)) {
      const m = EDITION.exec(line) || EDITION_REF.exec(line);
      if (m) {
        ls.edition = Number(m[1]);
        break;
      }
    }
  }
}

function parseFlightLine(ls: Loadsheet, raw: string): boolean {
  const line = raw.replace(/^(?:FINAL|PRELIM)\d*\s+/, '');
  const m = FLIGHT.exec(line);
  if (!m || !/^[A-Z0-9]{2}[A-Z]?\d/.test(m[1])) return false;
  // AR1134/EZE-MAD/21NOV26
  const sector =
    /^([A-Z0-9]{2}\d{1,4})\/([A-Z]{3})-([A-Z]{3})\/(\d{2})([A-Z]{3})(\d{2})$/.exec(
      line,
    );
  if (sector) {
    ls.flight_number = sector[1];
    ls.departure = sector[2];
    ls.arrival = sector[3];
    const d = flightDate(sector[4], sector[5], sector[6]);
    if (d) ls.date = d;
    return true;
  }
  const reg = /^([A-Z0-9]{2}\d{1,4})\/([A-Z]{2}[A-Z0-9]{3,4})\/$/.exec(line);
  if (reg) {
    // AR1740/LVFPS/
    ls.flight_number = reg[1];
    ls.registration = reg[2];
    return true;
  }
  const date = DATE.exec(line);
  // Needs a day or a date to tell a flight line from any other line.
  if (m[2] === undefined && !date) return false;
  ls.flight_number = m[1];
  if (m[2] !== undefined) ls.flight_day = Number(m[2]);
  if (date) {
    const d = flightDate(date[1], date[2], date[3]);
    if (d) ls.date = d;
  }
  // Some airlines put the route on the flight line (SQ7394 21NOV26 AMS LHR 9V-SFP).
  const rest = m[3].replace(DATE, ' ').replace(EDITION, ' ').trim();
  if (rest) parseRouteLine(ls, rest.replace(/^\/?\d{2}[A-Z]{3}\d{2}\s*/, ''));
  return true;
}

function parseRouteLine(ls: Loadsheet, line: string): boolean {
  // CDGDZA F-OLRB 3/9: airports written together.
  const m = ROUTE.exec(line) || ROUTE_JOINED.exec(line);
  if (!m) return false;
  // MAC ZFW 32.5 is an index line, not a route.
  if (FIELD_KEY.test(m[1]) && FIELD_KEY.test(m[2])) return false;
  ls.departure = m[1];
  ls.arrival = m[2];
  if (m[3]) ls.registration = m[3];
  if (m[4]) ls.crew = m[4];
  return true;
}

function parseWeights(ls: Loadsheet, line: string) {
  for (const [re, field, limit] of WEIGHT_PATTERNS) {
    if (ls[field] !== undefined) continue;
    const m = re.exec(line);
    if (!m) continue;
    ls[field] = Number(m[1]);
    // MAX after the value only counts with its own number (TOW 105157 MAX
    // sends no maximum).
    const max =
      MAX_BEFORE.exec(line) ||
      MAX_AFTER.exec(line.slice(m.index + m[0].length));
    if (max) ls[`${field}_max`] = Number(max[1]);
    // The first limiting weight wins when several are marked.
    if (ls.limiting === undefined && /[\s\d]L$/.test(line)) ls.limiting = limit;
  }
}

/**
 * Long loadsheets are split over several messages, and the split can fall
 * inside a value ("TOW 2" for "TOW 288113"). A bare weight on the last line
 * is taken as cut when it is two or more digits shorter than a ZFW, TOW or
 * LAW already read (for those three keys), or when it has at most two
 * digits.
 */
function isCutWeight(ls: Loadsheet, line: string): boolean {
  const m = CUT_WEIGHT.exec(line);
  if (!m) return false;
  const digits = m[2].length;
  if (digits <= 2) return true;
  if (!/^(?:ZFW|TOW|LAW|LDW|LGW|LW)$/.test(m[1])) return false;
  const known = [ls.zfw, ls.tow, ls.law].filter((v) => v !== undefined);
  if (known.length === 0) return false;
  const width = Math.max(...known.map((v) => String(v).length));
  return digits < width - 1;
}

function parseBody(ls: Loadsheet, lines: string[]) {
  let flightSeen = false;
  let routeSeen = false;
  let sinceFlight = 0;
  let last = lines.length - 1;
  while (last >= 0 && !lines[last].trim()) last--;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // The line holds only the cut weight, so nothing else is skipped.
    if (i === last && isCutWeight(ls, line)) continue;
    if (flightSeen) sinceFlight++;
    if (!flightSeen && i < 4 && parseFlightLine(ls, line)) {
      flightSeen = true;
      routeSeen = ls.departure !== undefined;
      continue;
    }
    if (
      flightSeen &&
      !routeSeen &&
      sinceFlight <= 2 &&
      parseRouteLine(ls, line)
    ) {
      routeSeen = true;
      continue;
    }
    if (ls.departure === undefined) {
      // FLT  AMS-LHR  A306EAT / DAEAT, DTE  2026-11-21. The DHL freighter
      // loadsheets pad the arrival with a zero (FLT AMS-0LHR), hence 0?.
      const flt = /^FLT\s+([A-Z]{3,4})-0?([A-Z]{3,4})\b/.exec(line);
      if (flt) {
        ls.departure = flt[1];
        ls.arrival = flt[2];
      }
    }
    if (ls.date === undefined) {
      const dte = /^DTE\s+(\d{4}-\d{2}-\d{2})$/.exec(line);
      if (dte) ls.date = dte[1];
    }
    parseWeights(ls, line);
    let m: RegExpExecArray | null;
    if (
      ls.tof === undefined &&
      (m = /^(?:TOF|TAKE ?OFF FUEL):?\s+(\d+)(?![\d.])/.exec(line))
    )
      ls.tof = Number(m[1]);
    if (
      ls.tif === undefined &&
      (m = /^(?:TIF|TF|BO|TRIP(?: FUEL)?):?\s+(\d+)(?![\d.])/.exec(line))
    )
      ls.tif = Number(m[1]);
    if (
      ls.underload === undefined &&
      (m = /(?:^|\s)(?:UNDLD|ULOAD|UNDERLOAD):?\s+(\d+)(?![\d.])/.exec(line))
    )
      ls.underload = Number(m[1]);
    if (ls.dow === undefined && (m = /(?:^|\s)DOW\s+(\d+)(?![\d.])/.exec(line)))
      ls.dow = Number(m[1]);
    if (ls.bw === undefined && (m = /(?:^|\s)BW\s*(\d+)(?![\d.])/.exec(line)))
      ls.bw = Number(m[1]);
    if (
      ls.crew === undefined &&
      (m = /^CREW\s+(\d{1,2}\/\d{1,2}(?:\/\d{1,2})?)\b/.exec(line))
    )
      ls.crew = m[1];
    if (ls.tob === undefined && (m = /^TOB\s+(\d+)(?![\d.])/.exec(line)))
      ls.tob = Number(m[1]);
    if (
      ls.aircraft_type === undefined &&
      (m = /^TYPE\s+([A-Z0-9-]{3,10})$/.exec(line))
    )
      ls.aircraft_type = m[1];
    if (
      ls.pax_total === undefined &&
      (m = /(?:^|\s)PAX[\s/]+(\d+(?:\/\s*\d+)*)\s+TTL\s+(\d+)/.exec(line))
    ) {
      ls.pax_breakdown = m[1].replace(/\s/g, '');
      ls.pax_total = Number(m[2]);
    }
    if (
      ls.pax_total === undefined &&
      (m = /^PAX\s+(\d+)\s+(\d+(?:\/\d+)+)$/.exec(line))
    ) {
      // PAX 255 145/96/9/5: total first, then the breakdown.
      ls.pax_total = Number(m[1]);
      ls.pax_breakdown = m[2];
    }
    if (
      ls.infants === undefined &&
      (m = /^PAX\s+\d+\s+PLUS\s+(\d+)/.exec(line))
    )
      ls.infants = Number(m[1]);
    for (const [re, field] of INDEX_PATTERNS) {
      if (ls[field] !== undefined) continue;
      const im = re.exec(line);
      if (im) ls[field] = Number(im[1].replace(',', '.'));
    }
    for (const [re, field] of COLUMN_INDEX) {
      if (ls[field] !== undefined) continue;
      const im = re.exec(line);
      if (im) ls[field] = Number(im[1].replace(',', '.'));
    }
    if (ls.notoc === undefined && (m = /NOTOC:?\s*(YES|NO)\b/.exec(line)))
      ls.notoc = m[1] === 'YES';
    if (
      ls.weight_unit === undefined &&
      (m =
        /(?:WEIGHTS IN|WGHTS|WT IN|WTS IN|UOM[:/ ]|LOADSHEET -)\s*(KG|LB|KILO)/.exec(
          line,
        ))
    )
      ls.weight_unit = m[1] === 'LB' ? 'LB' : 'KG';
  }
}

function parseAcceptance(text: string): Loadsheet | null {
  const csv = ACCEPT_CSV.exec(text);
  if (csv) {
    const ls: Loadsheet = {
      kind: 'acceptance',
      status: csv[5] === 'FINAL' ? 'final' : 'prelim',
      edition: Number(csv[6]),
      time: csv[4],
      departure: csv[1],
      arrival: csv[2],
    };
    const flight = text.match(/([A-Z]{2,3}\d{1,4}[A-Z]?),[A-Z]{3,4},/);
    if (flight) ls.flight_number = flight[1];
    const date = csv[3];
    ls.date = `20${date.slice(4, 6)}-${date.slice(2, 4)}-${date.slice(0, 2)}`;
    return ls;
  }
  if (
    /\b(?:LOADSHEET|LDSHT|LOAD SHEET)(?:\s+(?:FINAL|PRELIM))?(?:\s+\d{1,2})?\s+(?:ACCEPT|ACKNOW|RCVD)/.test(
      text,
    ) ||
    /\bACK LOADSHEET/.test(text) ||
    // LOADSHEET FINAL,EDNO 01,ACCEPT
    /\b(?:LOADSHEET|LDSHT|LOAD SHEET)\s+(?:FINAL|PRELIM),\s*EDNO\s*\d+,\s*ACCEPT/.test(
      text,
    ) ||
    /(?:ACKNOWLEDGEMENT|ACCEPTANCE) OF (?:THE )?(?:FINAL|PRELIM) LOADSHEET/.test(
      text,
    )
  ) {
    const ls: Loadsheet = { kind: 'acceptance' };
    const status = STATUS.exec(text);
    if (status) ls.status = status[1] === 'FINAL' ? 'final' : 'prelim';
    const edno = text.match(
      /EDN[O0]?\s*0*(\d{1,2})\b|LOADSHEET\s*0*(\d{1,2})\b|LOADSHEET ID:\s*(?:FINAL|PRELIM)0*(\d{1,2})\b/,
    );
    if (edno) ls.edition = Number(edno[1] ?? edno[2] ?? edno[3]);
    const flight = text.match(
      /(?:FLIGHT NUMBER:\s*|FOR\s+)([A-Z0-9]{2}[A-Z]?\d{1,4}[A-Z]?)\b/,
    );
    if (flight) ls.flight_number = flight[1];
    // FOR QR274/21NOV26: the flight date, when the year is given.
    const forDate = text.match(
      /\bFOR\s+[A-Z0-9]{2}[A-Z]?\d{1,4}[A-Z]?\/(\d{2})([A-Z]{3})(\d{2})\b/,
    );
    if (forDate) {
      const date = flightDate(forDate[1], forDate[2], forDate[3]);
      if (date) ls.date = date;
    }
    // SECTOR: YPPH-OMDB first, then the pair after the flight
    // (FOR QR274/21NOV AMS-DOH, or 21NOV26), then a pair at the start of a
    // line.
    const sector =
      text.match(/SECTOR:\s*([A-Z]{3,4})[-/]([A-Z]{3,4})\b/) ||
      text.match(
        /\bFOR\s+[A-Z0-9]{2}[A-Z]?\d{1,4}[A-Z]?(?:\/\d{2}[A-Z]{3}(?:\d{2})?)?\s+([A-Z]{3,4})[-/]([A-Z]{3,4})\b/,
      ) ||
      text.match(/^([A-Z]{3,4})[-/]([A-Z]{3,4})(?:\s|$)/m);
    if (sector) {
      ls.departure = sector[1];
      ls.arrival = sector[2];
    }
    return ls;
  }
  return null;
}

/**
 * Parse a loadsheet, loadsheet acceptance or loadsheet request from ACARS
 * text. Returns null when the text holds none of them.
 */
export function parseLoadsheet(text: string): Loadsheet | null {
  if (!text || !mayBeLoadsheet(text)) return null;
  const lines = cleanLines(text);

  // Several header lines can appear (a routing line, then the real one):
  // use the last header before the first weight line.
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(?:ZFW|TOW)(?: ACTUAL)?:?\s+\d/.test(line)) break;
    if (HEADER_WORD.test(line) && !NOT_HEADER.test(line)) headerIdx = i;
  }

  if (headerIdx >= 0) {
    const ls: Loadsheet = { kind: 'loadsheet' };
    const body = lines.slice(headerIdx + 1);
    parseHeader(
      ls,
      lines[headerIdx],
      body.filter((l) => l.trim()),
    );
    parseBody(ls, body);
    // A loadsheet names its flight or gives its weights; a header alone
    // (a continuation block, a cover note) is not decoded.
    if (
      ls.flight_number !== undefined ||
      ls.zfw !== undefined ||
      ls.tow !== undefined
    ) {
      return ls;
    }
  }

  const accepted = parseAcceptance(text);
  if (accepted) return accepted;

  // /ORIG on the same line or one of the next two (uplinks wrap).
  const req = text.match(
    /\b(?:LOADSHEET|LDSHT|LOAD SHEET)\s+(?:REQ|REQUEST)\b(?:[^\n]*(?:\r?\n[^\n]*){0,2}?\/ORIG\s+([A-Z]{3,4}))?/,
  );
  if (req) {
    const ls: Loadsheet = { kind: 'request' };
    if (req[1]) ls.departure = req[1];
    return ls;
  }
  return null;
}
