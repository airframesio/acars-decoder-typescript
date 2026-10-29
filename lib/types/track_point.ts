/**
 * One point of an aircraft's recorded track.
 */
export interface TrackPoint {
  /** latitude in decimal degrees */
  latitude: number;
  /** longitude in decimal degrees */
  longitude: number;
  /** day of the month */
  day: number;
  /** seconds since midnight */
  time: number;
  /** feet */
  altitude: number;
  /** outside air temperature, degrees C */
  temperature: number;
  /** degrees */
  windDirection: number;
  /** knots */
  windSpeed: number;
  /** flight phase name, or the code as sent when it has no established name */
  phase: string;
  /** whether the aircraft has a humidity sensor */
  humiditySensor?: boolean;
  /** water vapor from the humidity sensor, parts per million by volume */
  waterVapor?: number;
}
