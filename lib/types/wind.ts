import { Waypoint } from './waypoint';

export interface Wind {
  waypoint: Waypoint;
  flightLevel: number;
  windDirection: number;
  windSpeed: number;
  temperature?: {
    flightLevel: number;
    degreesC: number;
  };
}
