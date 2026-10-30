import { Waypoint } from './waypoint';

/**
 * One point of an aircraft's recorded track: a waypoint of the route it flew, with the
 * conditions the aircraft measured there.
 */
export interface TrackPoint extends Waypoint {
  /** the position as sent, e.g. N3621.7W12135.7 */
  name: string;
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
