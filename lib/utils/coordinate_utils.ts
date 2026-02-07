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
    const firstChar = stringCoords.substring(0, 1);
    let middleChar = stringCoords.substring(6, 7);
    let longitudeChars = stringCoords.substring(7, 13);
    if (middleChar == ' ') {
      middleChar = stringCoords.substring(7, 8);
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
    const firstChar = stringCoords.substring(0, 1);
    let middleChar = stringCoords.substring(6, 7);
    let longitudeChars = stringCoords.substring(7, 13);
    if (middleChar == ' ') {
      middleChar = stringCoords.substring(7, 8);
      longitudeChars = stringCoords.substring(8, 14);
    }
    const latDeg = Math.trunc(Number(stringCoords.substring(1, 6)) / 1000);
    const latMin = (Number(stringCoords.substring(1, 6)) % 1000) / 10;
    const lonDeg = Math.trunc(Number(longitudeChars) / 1000);
    const lonMin = (Number(longitudeChars) % 1000) / 10;

    if (
      (firstChar === 'N' || firstChar === 'S') &&
      (middleChar === 'W' || middleChar === 'E')
    ) {
      return {
        latitude:
          (latDeg + latMin / 60) * CoordinateUtils.getDirection(firstChar),
        longitude:
          (lonDeg + lonMin / 60) * CoordinateUtils.getDirection(middleChar),
      };
    }
    return undefined;
  }
  public static coordinateString(coords: {
    latitude: number;
    longitude: number;
  }): string {
    const latDir = coords.latitude > 0 ? 'N' : 'S';
    const lonDir = coords.longitude > 0 ? 'E' : 'W';
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
}
