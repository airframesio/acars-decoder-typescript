export class CoordinateUtils {
  public static decodeStringCoordinates(stringCoords: String) : any { // eslint-disable-line class-methods-use-this
    var results : any = {};
    // format: N12345W123456 or N12345 W123456
    const firstChar = stringCoords.substring(0, 1);
    let middleChar = stringCoords.substring(6, 7);
    let longitudeChars = stringCoords.substring(7, 13);
    if (middleChar ==' ') {
      middleChar = stringCoords.substring(7, 8);
      longitudeChars = stringCoords.substring(8, 14);
    }
    if ((firstChar === 'N' || firstChar === 'S') && (middleChar === 'W' || middleChar === 'E')) {
      results.latitudeDirection = firstChar;
      results.latitude = (Number(stringCoords.substring(1, 6)) / 1000) * (firstChar === 'S' ? -1 : 1);
      results.longitudeDirection = middleChar;
      results.longitude = (Number(longitudeChars) / 1000) * (middleChar === 'W' ? -1 : 1);
    } else {
      return;
    }

    return results;
  }

  public static coordinateString(coords: any) : String {
    return `${Math.abs(coords.latitude)} ${coords.latitudeDirection}, ${Math.abs(coords.longitude)} ${coords.longitudeDirection}`;
  }
  
  public static latLonToCoordinateString(lat: number, lon: number) : String {
    const latDir = lat > 0 ? 'N' : 'S';
    const lonDir = lon > 0 ? 'E' : 'W';
    return `${Math.abs(lat)} ${latDir}, ${Math.abs(lon)} ${lonDir}`;
  }
}