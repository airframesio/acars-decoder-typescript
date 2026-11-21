/**
 * Air Mobility Command (AMC) mission numbers, as carried in the third
 * element of the ARINC 702 `/ID` field of military H1 messages, e.g.
 *
 *   INI/ID70045B,RCH2050,AJM363201271/...
 *                        ^^^^^^^^^^^^
 *
 * A mission number is 12 characters. Only the overall layout is decoded
 * here, because it is the part that is consistent across mission types:
 *
 *   AJM 3632 01 271
 *   |   |    |  +-- day of year (001-366) the mission was scheduled to operate
 *   |   |    +----- suffix (2 characters)
 *   |   +---------- basic mission number (4 characters)
 *   +-------------- prefix (3 characters)
 *
 * The meaning of the individual prefix / suffix characters differs between
 * mission types and is not publicly documented in full, so they are exposed
 * as-is rather than interpreted.
 */
export interface MissionNumber {
  /** The mission number exactly as received */
  value: string;
  /** First 3 characters */
  prefix: string;
  /** Characters 4-7, the basic mission number */
  basic: string;
  /** Characters 8-9 */
  suffix: string;
  /** Characters 10-12 as a number, 1-366 */
  day_of_year: number;
}

const MISSION_NUMBER_REGEX = /^[A-Z0-9]{9}(\d{3})$/;

/** Default values some avionics send when no mission number has been entered */
const PLACEHOLDERS = new Set(['COLLINSAM123', 'ZZZ123456789']);

export class MissionNumberUtils {
  /**
   * Parses a 12 character AMC mission number.
   *
   * @returns the parsed mission number, or null if `value` does not look like one
   */
  public static parse(value: string | undefined): MissionNumber | null {
    if (!value || PLACEHOLDERS.has(value)) {
      return null;
    }
    const match = MISSION_NUMBER_REGEX.exec(value);
    if (!match) {
      return null;
    }
    const dayOfYear = parseInt(match[1], 10);
    if (dayOfYear < 1 || dayOfYear > 366) {
      return null;
    }
    return {
      value,
      prefix: value.substring(0, 3),
      basic: value.substring(3, 7),
      suffix: value.substring(7, 9),
      day_of_year: dayOfYear,
    };
  }

  /**
   * Formats a mission number in the grouped form commonly used when
   * writing them down, e.g. `AJM 3632 01 271`.
   */
  public static format(mission: MissionNumber): string {
    return `${mission.prefix} ${mission.basic} ${mission.suffix} ${mission.value.substring(9)}`;
  }

  /**
   * Resolves the day of year to a calendar date (UTC), given a reference
   * time such as when the message was received. The mission number carries
   * no year, so the year that puts the date closest to the reference is used.
   * Day 366 only exists in leap years, so up to four years either side are
   * searched.
   *
   * @returns date as `YYYY-MM-DD`, or null if no year fits
   */
  public static operatingDate(
    mission: MissionNumber,
    reference: Date,
  ): string | null {
    const refYear = reference.getUTCFullYear();
    let best: Date | null = null;
    for (let year = refYear - 4; year <= refYear + 4; year++) {
      const candidate = new Date(Date.UTC(year, 0, mission.day_of_year));
      // day 366 of a non-leap year rolls into the next year; skip it
      if (candidate.getUTCFullYear() !== year) {
        continue;
      }
      if (
        best === null ||
        Math.abs(candidate.getTime() - reference.getTime()) <
          Math.abs(best.getTime() - reference.getTime())
      ) {
        best = candidate;
      }
    }
    return best ? best.toISOString().substring(0, 10) : null;
  }
}
