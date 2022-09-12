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
    utcDate.setUTCHours(+timeString.substr(0, 2), +timeString.substr(2, 2), 0);
    return utcDate.toUTCString();
  }
}

export default {};
