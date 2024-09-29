export class CoordinateUtils {
  /**
   * Decode a string of coordinates into an object with latitude and longitude in millidegrees
   * @param stringCoords - The string of coordinates to decode
   * 
   * @returns An object with latitude and longitude properties
   */
  public static decodeStringCoordinates(stringCoords: string) : {latitude: number, longitude: number} | undefined{ // eslint-disable-line class-methods-use-this
    var results : any = {};
    // format: N12345W123456 or N12345 W123456
    const firstChar = stringCoords.substring(0, 1);
    let middleChar = stringCoords.substring(6, 7);
    let longitudeChars = stringCoords.substring(7, 13);
    if (middleChar == ' ') {
      middleChar = stringCoords.substring(7, 8);
      longitudeChars = stringCoords.substring(8, 14);
    }
    if ((firstChar === 'N' || firstChar === 'S') && (middleChar === 'W' || middleChar === 'E')) {
      results.latitude = (Number(stringCoords.substring(1, 6)) / 1000) * (firstChar === 'S' ? -1 : 1);
      results.longitude = (Number(longitudeChars) / 1000) * (middleChar === 'W' ? -1 : 1);
    } else {
      return;
    }

    return results;
  }

    /**
   * Decode a string of coordinates into an object with latitude and longitude in degrees and decimal minutes
   * @param stringCoords - The string of coordinates to decode
   * 
   * @returns An object with latitude and longitude properties
   */
  public static decodeStringCoordinatesDecimalMinutes(stringCoords: string) : {latitude: number, longitude: number} | undefined{ // eslint-disable-line class-methods-use-this
    var results : any = {};
    // format: N12345W123456 or N12345 W123456
    const firstChar = stringCoords.substring(0, 1);
    let middleChar = stringCoords.substring(6, 7);
    let longitudeChars = stringCoords.substring(7, 13);
    if (middleChar ==' ') {
      middleChar = stringCoords.substring(7, 8);
      longitudeChars = stringCoords.substring(8, 14);
    }
    const latDeg = Math.trunc(Number(stringCoords.substring(1, 6)) / 1000);
    const latMin = (Number(stringCoords.substring(1, 6)) % 1000) / 10;
    const lonDeg = Math.trunc(Number(longitudeChars) / 1000);
    const lonMin = (Number(longitudeChars) % 1000) / 10;

    if ((firstChar === 'N' || firstChar === 'S') && (middleChar === 'W' || middleChar === 'E')) {
      results.latitude = (latDeg +  (latMin / 60)) * (firstChar === 'S' ? -1 : 1);
      results.longitude = (lonDeg + (lonMin / 60)) * (middleChar === 'W' ? -1 : 1);
    } else {
      return;
    }

    return results;
  }
  public static coordinateString(coords: {latitude: number, longitude: number}) : String {
    const latDir = coords.latitude > 0 ? 'N' : 'S';
    const lonDir = coords.longitude > 0 ? 'E' : 'W';
    return `${Math.abs(coords.latitude).toFixed(3)} ${latDir}, ${Math.abs(coords.longitude).toFixed(3)} ${lonDir}`;
  }
}