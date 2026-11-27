export class CoordinateUtils {
  /**
   * Decode a string of coordinates into an object with latitude and longitude in millidegrees
   * @param stringCoords - The string of coordinates to decode
   *
   * @returns An object with latitude and longitude properties
   */
  public static decodeStringCoordinates(
    stringCoords: string,
  ): { latitude: number; longitude: number } | undefined {
    // format: N12345W123456 or N12345 W123456
    const firstChar = stringCoords.charAt(0);
    let middleChar = stringCoords.charAt(6);
    let longitudeChars = stringCoords.substring(7, 13);
    if (middleChar === ' ') {
      middleChar = stringCoords.charAt(7);
      longitudeChars = stringCoords.substring(8, 14);
    }
    if (
      (firstChar === 'N' || firstChar === 'S') &&
      (middleChar === 'W' || middleChar === 'E')
    ) {
      return {
        latitude:
          (Number(stringCoords.substring(1, 6)) / 1000) *
          CoordinateUtils.getDirection(firstChar),
        longitude:
          (Number(longitudeChars) / 1000) *
          CoordinateUtils.getDirection(middleChar),
      };
    }

    return undefined;
  }

  /**
   * Decode a string of coordinates into an object with latitude and longitude in degrees and decimal minutes
   * @param stringCoords - The string of coordinates to decode
   *
   * @returns An object with latitude and longitude properties
   */
  public static decodeStringCoordinatesDecimalMinutes(
    stringCoords: string,
  ): { latitude: number; longitude: number } | undefined {
    // format: N12345W123456 or N12345 W123456
    const firstChar = stringCoords.charAt(0);
    let middleChar = stringCoords.charAt(6);
    let longitudeChars = stringCoords.substring(7, 13);
    if (middleChar === ' ') {
      middleChar = stringCoords.charAt(7);
      longitudeChars = stringCoords.substring(8, 14);
    }

    if (
      (firstChar !== 'N' && firstChar !== 'S') ||
      (middleChar !== 'W' && middleChar !== 'E')
    ) {
      return undefined;
    }

    const latRaw = Number(stringCoords.substring(1, 6));
    const lonRaw = Number(longitudeChars);
    const latDeg = Math.trunc(latRaw / 1000);
    const latMin = (latRaw % 1000) / 10;
    const lonDeg = Math.trunc(lonRaw / 1000);
    const lonMin = (lonRaw % 1000) / 10;

    return {
      latitude:
        (latDeg + latMin / 60) * CoordinateUtils.getDirection(firstChar),
      longitude:
        (lonDeg + lonMin / 60) * CoordinateUtils.getDirection(middleChar),
    };
  }
  /**
   * Decode coordinates written as packed degrees, minutes and seconds:
   * N394138W752038 is 39°41′38″ N, 75°20′38″ W. The latitude is DDMMSS
   * (6 digits), the longitude DDDMMSS (6 or 7 digits), and whitespace is
   * allowed after each hemisphere letter.
   *
   * The digits are packed, not a decimal fraction (39.4138) and not
   * DDMM.tenths — see decodeStringCoordinates and
   * decodeStringCoordinatesDecimalMinutes for those two encodings.
   *
   * @param stringCoords - The string of coordinates to decode
   *
   * @returns An object with latitude and longitude properties, or undefined
   * when the field is malformed or a value is out of range
   */
  public static decodeStringCoordinatesDMS(
    stringCoords: string,
  ): { latitude: number; longitude: number } | undefined {
    const m = /^([NS])\s*(\d{6})\s*([EW])\s*(\d{6,7})$/.exec(
      stringCoords.trim(),
    );
    if (!m) {
      return undefined;
    }
    const [, latDir, latDigits, lonDir, lonDigits] = m;
    const lat = CoordinateUtils.packedDmsToDecimalDegrees(latDigits);
    const lon = CoordinateUtils.packedDmsToDecimalDegrees(lonDigits);
    if (lat === undefined || lon === undefined || lat > 90 || lon > 180) {
      return undefined;
    }
    return {
      latitude: lat * CoordinateUtils.getDirection(latDir),
      longitude: lon * CoordinateUtils.getDirection(lonDir),
    };
  }

  private static packedDmsToDecimalDegrees(digits: string): number | undefined {
    const packed = Number(digits);
    const degrees = Math.floor(packed / 10000);
    const minutes = Math.floor((packed % 10000) / 100);
    const seconds = packed % 100;
    if (minutes >= 60 || seconds >= 60) {
      return undefined;
    }
    return CoordinateUtils.dmsToDecimalDegrees(degrees, minutes, seconds);
  }

  public static coordinateString(coords: {
    latitude: number;
    longitude: number;
  }): string {
    const latDir = coords.latitude >= 0 ? 'N' : 'S';
    const lonDir = coords.longitude >= 0 ? 'E' : 'W';
    return `${Math.abs(coords.latitude).toFixed(3)} ${latDir}, ${Math.abs(coords.longitude).toFixed(3)} ${lonDir}`;
  }

  public static getDirection(coord: string): number {
    if (coord.startsWith('N') || coord.startsWith('E')) {
      return 1;
    } else if (coord.startsWith('S') || coord.startsWith('W')) {
      return -1;
    }
    return NaN;
  }

  public static dmsToDecimalDegrees(
    degrees: number,
    minutes: number,
    seconds: number,
  ): number {
    return degrees + minutes / 60 + seconds / 3600;
  }

  // DDMM.mm or DDDMM.mm, e.g. 3835.95 is 38 degrees 35.95 minutes
  public static decimalMinutesToDecimalDegrees(value: number): number {
    return CoordinateUtils.dmsToDecimalDegrees(
      Math.trunc(value / 100),
      value % 100,
      0,
    );
  }
}
