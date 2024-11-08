export class DateTimeUtils {

  // Expects a four digit UTC time string (HHMM)
  public static UTCToString(UTCString: string) {
    let utcDate = new Date();
    utcDate.setUTCHours(+UTCString.substr(0, 2), +UTCString.substr(2, 2), 0);
    return utcDate.toTimeString();
  }

  // Expects a six digit date string and a four digit UTC time string
  // (DDMMYY) (HHMM)
  public static UTCDateTimeToString(dateString: string, timeString: string) {
    let utcDate = new Date();
    utcDate.setUTCDate(+dateString.substr(0, 2));
    utcDate.setUTCMonth(+dateString.substr(2, 2));
    if (dateString.length === 6) {
      utcDate.setUTCFullYear(2000 + +dateString.substr(4, 2));
    }
    if (timeString.length === 6) {
      utcDate.setUTCHours(+timeString.substr(0, 2), +timeString.substr(2, 2), +timeString.substr(4, 2));
    } else {
      utcDate.setUTCHours(+timeString.substr(0, 2), +timeString.substr(2, 2), 0);
    }
    return utcDate.toUTCString();
  }

  /**
   * 
   * @param time HHMMSS or HHMM
   * @returns seconds since midnight
   */
  public static convertHHMMSSToTod(time: string): number {
    if(time.length === 4) { // add seconds if not present
      time += '00';
    }
    const h = Number(time.substring(0, 2));
    const m = Number(time.substring(2, 4));
    const s = Number(time.substring(4, 6));
    const tod = (h * 3600) + (m * 60) + s;
    return tod;
  }

  /**
   * 
   * @param time HHMMSS
   * @param date MMDDYY or MMDDYYYY
   * @returns seconds since epoch
   */
  public static convertDateTimeToEpoch(time: string, date: string): number {
    //YYYY-MM-DDTHH:mm:ss.sssZ
    if (date.length === 6) {
      date = date.substring(0, 4) + `20${date.substring(4, 6)}`;
    }
    const timestamp = `${date.substring(4, 8)}-${date.substring(0, 2)}-${date.substring(2, 4)}T${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}.000Z`
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
  public static timestampToString(time: number, format: 'tod' | 'epoch'): string {
    const date = new Date(time * 1000); if (format == 'tod') {
      return date.toISOString().slice(11, 19);
    }
    //strip off millis
    return date.toISOString().slice(0, -5) + "Z";
  }
}