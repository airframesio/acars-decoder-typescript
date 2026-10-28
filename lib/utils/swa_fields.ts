import { DateTimeUtils } from '../DateTimeUtils';
import { DecodeResult } from '../DecoderPluginInterface';
import { ResultFormatter } from './result_formatter';

/**
 * Field layouts and field writers shared by the Southwest label 37 and 40 plugins.
 *
 * A decoded body is split on ',' and on line breaks. A type's fields are only read when every
 * field matches its layout; otherwise the plugin returns the decoded text alone. The "no value"
 * forms (empty, ----.---, **.*, ****) are the aircraft's own placeholders.
 */
const APT = '(?:[A-Z]{4}| {4}|)';
const LAT = '(?:[NS] ?\\d{1,2}\\.\\d{3}|-{4}\\.-{3}|)';
const LON = '(?:[EW] ?\\d{1,3}\\.\\d{3}|-{4}\\.-{3}|)';
const T4 = '(?:\\d{4}|\\*{4}|-{4})';
const FOB = '(?: ?\\d{1,2}\\.\\d|\\*\\*\\.\\*)';
const INT = '(?: *-? *\\d+| *|-+|\\*+)';
const MACH = '\\.\\d{3}';
const HMS = '\\d{6}';
const OC = '[OC]';
const POS = [
  APT,
  APT,
  LAT,
  LON,
  INT,
  INT,
  INT,
  MACH,
  FOB,
  T4,
  INT,
  INT,
  INT,
  INT,
];
const ASR = ' *-?\\d+(?:\\.[\\d-])?|XX\\.X';

/** Each type's layouts, one pattern per field. A type may have more than one layout. */
export const SWA_LAYOUTS: Record<string, string[][]> = {
  POS01: [
    [...POS, INT],
    [...POS, INT, HMS],
  ],
  POS02: [[...POS, INT, HMS]],
  HGD03: [[...POS, INT]],
  FHD04: [
    [
      ...POS,
      '(?:OUT|OFF|ON|IN|RET IN)',
      'X',
      INT,
      ' *\\d*',
      HMS,
      '(?:\\d{6}|-{6})',
      '\\d{5}',
    ],
  ],
  GAM02: [[APT, APT, T4, LAT, LON]],
  CLB02: [[APT, APT, LAT, '', LON, FOB, T4]],
  ETA03: [[APT, APT, T4, FOB, LAT, LON]],
  INR04: [[APT, APT, T4, T4, FOB, LAT, LON]],
  FLI01: [[APT, APT, T4, FOB, LAT, LON]],
  OUT03: [[APT, APT, T4, FOB, FOB, T4]],
  TXI02: [[APT, APT, T4, FOB]],
  INN03: [[APT, APT, T4, T4, FOB, OC, OC, OC, OC]],
  RTG04: [[APT, APT, T4, T4, T4, FOB, OC, OC, OC, OC]],
  RTG05: [[APT, APT, T4, T4, T4, FOB, OC, OC, OC, OC]],
  TDM01: [[APT, APT, LAT, LON, '(?:L1|L2|CR|SV)', OC, T4, HMS]],
  FCM01: [['L[\\d-]', 'R[\\d-]', 'A[\\d-]', 'B[\\d-]', '\\d+', T4]],
  GAR03: [
    [
      '[A-Z0-9]{1,4} *',
      '[YN]',
      '[YN]',
      '[YN]',
      '[YN]',
      '[YN]',
      '(?:1[23]\\d\\.\\d{1,3}|999\\.999)',
      '',
      '',
    ],
  ],
  ASR01: [[ASR, ASR, ASR, ASR, ASR, ASR, ASR, ASR, '', '']],
  VXR02: [['[A-Z]{3}']],
};

/** Types whose first fields have a layout and whose free text follows. */
export const SWA_PREFIX_LAYOUTS: Record<string, string[]> = {
  MXR03: [APT, '(?:\\d{4}|)', '[0-3]'],
};

/** A crew position code followed by an employee number: captain, first officer, flight attendant. */
const CREW_ID = /\b(CAE|FOE|CA|FO|FA|PILOT ?:)( ?)(\d{5,7})\b/g;

/** Crew schedule uplinks list the crew by employee number; they are not decoded. */
export function swaIsCrewSchedule(text: string): boolean {
  return /CREW SCH|PART ?117|\b(?:CAE|FOE) ?\d{5,7}\b/.test(text);
}

/** Replaces the digits of an employee number written after a crew position code with '*'. */
export function swaHideCrewIds(text: string): string {
  return text.replace(
    CREW_ID,
    (_, who: string, gap: string, num: string) =>
      `${who}${gap}${'*'.repeat(num.length)}`,
  );
}

export function swaFields(text: string): string[] {
  return text.replace(/\|/g, ',').split(',');
}

/** True when the fields match one of the layouts exactly. */
export function swaMatchesLayout(fields: string[], layouts: string[][]) {
  return layouts.some(
    (layout) =>
      layout.length === fields.length &&
      layout.every((rx, i) => new RegExp(`^(?:${rx})$`).test(fields[i])),
  );
}

/**
 * Writes fields into a DecodeResult and remembers which ones it used, so the rest can go to
 * `remaining`.
 */
export class SwaFieldWriter {
  private used = new Set<number>();

  constructor(
    private decodeResult: DecodeResult,
    private fields: string[],
  ) {}

  private take(i: number): string {
    this.used.add(i);
    return this.fields[i] ?? '';
  }

  /** A field with no ResultFormatter helper; `key` is its name in `raw` and its item type. */
  item(i: number, key: string, code: string, label: string, value: string) {
    this.used.add(i);
    this.decodeResult.raw[key] = value;
    this.decodeResult.formatted.items.push({ type: key, code, label, value });
  }

  /** Marks a field as read without writing it (it was written together with another). */
  use(i: number): string {
    return this.take(i);
  }

  departure(i: number) {
    const v = this.take(i);
    if (/^[A-Z]{4}$/.test(v))
      ResultFormatter.departureAirport(this.decodeResult, v);
  }

  arrival(i: number) {
    const v = this.take(i);
    if (/^[A-Z]{4}$/.test(v))
      ResultFormatter.arrivalAirport(this.decodeResult, v);
  }

  /**
   * Writes the position when both coordinates are present and in range. Otherwise the
   * placeholders are consumed and any coordinate that was sent stays for `remaining`.
   */
  position(latIndex: number, lonIndex: number) {
    const lat = this.fields[latIndex] ?? '';
    const lon = this.fields[lonIndex] ?? '';
    const latitude = /^[NS] ?\d/.test(lat)
      ? (lat[0] === 'N' ? 1 : -1) * Number(lat.substring(1).trim())
      : NaN;
    const longitude = /^[EW] ?\d/.test(lon)
      ? (lon[0] === 'E' ? 1 : -1) * Number(lon.substring(1).trim())
      : NaN;
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      this.used.add(latIndex);
      this.used.add(lonIndex);
      ResultFormatter.position(this.decodeResult, { latitude, longitude });
      return;
    }
    if (!/^[NS] ?\d/.test(lat)) this.used.add(latIndex);
    if (!/^[EW] ?\d/.test(lon)) this.used.add(lonIndex);
  }

  /** A whole number, or undefined for a placeholder. */
  int(i: number): number | undefined {
    const v = this.take(i).replace(/ /g, '');
    return /^-?\d+$/.test(v) ? Number(v) : undefined;
  }

  altitude(i: number) {
    const v = this.int(i);
    if (v !== undefined) ResultFormatter.altitude(this.decodeResult, v);
  }

  /** Fuel on board, sent in thousands of pounds; written in pounds. */
  fuel(i: number) {
    const v = this.take(i).trim();
    if (/^\d+\.\d$/.test(v)) {
      ResultFormatter.currentFuel(
        this.decodeResult,
        Math.round(Number(v) * 1000),
      );
    }
  }

  /**
   * HHMM or HHMMSS as seconds of the day. A placeholder is consumed; a time out of range is
   * left for `remaining`.
   */
  tod(i: number): number | undefined {
    const v = this.fields[i] ?? '';
    if (/^(?:[01]\d|2[0-3])[0-5]\d(?:[0-5]\d)?$/.test(v)) {
      this.used.add(i);
      return DateTimeUtils.convertHHMMSSToTod(v);
    }
    if (!/^\d+$/.test(v)) this.used.add(i);
    return undefined;
  }

  /** Writes a time through a ResultFormatter helper such as `out`, `in` or `timestamp`. */
  time(i: number, write: (decodeResult: DecodeResult, time: number) => void) {
    const t = this.tod(i);
    if (t !== undefined) write(this.decodeResult, t);
  }

  /** A time with no ResultFormatter helper, written as HH:MM:SS. */
  timeItem(i: number, key: string, code: string, label: string) {
    const t = this.tod(i);
    if (t !== undefined) {
      this.item(i, key, code, label, DateTimeUtils.timestampToString(t));
    }
  }

  eta(i: number) {
    this.time(i, (r, t) => ResultFormatter.eta(r, t));
  }

  /** Fields not written above, non-empty, to `remaining`. */
  finish() {
    const rest = this.fields.filter(
      (v, i) => !this.used.has(i) && v.trim() !== '',
    );
    if (rest.length > 0) ResultFormatter.unknownArr(this.decodeResult, rest);
    return rest.length;
  }
}
