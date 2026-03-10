export class DateTimeUtils {
  // Expects a four digit UTC time string (HHMM)
  public static UTCToString(UTCString: string) {
    const utcDate = new Date();
    utcDate.setUTCHours(
      +UTCString.substring(0, 2),
      +UTCString.substring(2, 4),
      0,
    );
    return utcDate.toTimeString();
  }

  // Expects a six digit date string and a four digit UTC time string
  // (DDMMYY) (HHMM)
  public static UTCDateTimeToString(dateString: string, timeString: string) {
    const day = +dateString.substring(0, 2);
    const month = +dateString.substring(2, 4) - 1; // zero-indexed
    const year =
      dateString.length === 6 ? 2000 + +dateString.substring(4, 6) : undefined;
    const hours = +timeString.substring(0, 2);
    const minutes = +timeString.substring(2, 4);
    const seconds =
      timeString.length === 6 ? +timeString.substring(4, 6) : 0;

    const utcDate = new Date();
    if (year !== undefined) {
      utcDate.setUTCFullYear(year, month, day);
    } else {
      utcDate.setUTCMonth(month, day);
    }
    utcDate.setUTCHours(hours, minutes, seconds);
    return utcDate.toUTCString();
  }

  /**
   *
   * @param time HHMMSS or HHMM
   * @returns seconds since midnight
   */
  public static convertHHMMSSToTod(time: string): number {
    if (time.length === 4) {
      time += '00';
    }
    const h = Number(time.substring(0, 2));
    const m = Number(time.substring(2, 4));
    const s = Number(time.substring(4, 6));
    const tod = h * 3600 + m * 60 + s;
    return tod;
  }

  /**
   *
   * @param time HHMMSS
   * @param date DDMMYY or DDMMYYYY
   * @returns seconds since epoch
   */
  public static convertDateTimeToEpoch(time: string, date: string): number {
    //YYYY-MM-DDTHH:mm:ss.sssZ
    if (date.length === 6) {
      date = date.substring(0, 4) + `20${date.substring(4, 6)}`;
    }
    const timestamp = `${date.substring(4, 8)}-${date.substring(2, 4)}-${date.substring(0, 2)}T${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}.000Z`;
    const millis = Date.parse(timestamp);
    return millis / 1000;
  }

  /**
   * Converts a timestamp to a string
   *
   * ISO-8601 format for 'epoch'
   * HH:MM:SS for 'tod'
   * @param time
   * @param format
   * @returns
   */
  public static timestampToString(
    time: number,
    format: 'tod' | 'epoch',
  ): string {
    const date = new Date(time * 1000);
    if (format === 'tod') {
      return date.toISOString().slice(11, 19);
    }
    //strip off millis
    return date.toISOString().slice(0, -5) + 'Z';
  }
}
