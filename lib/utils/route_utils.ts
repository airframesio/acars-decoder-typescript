import { Waypoint } from "../types/waypoint";
import { CoordinateUtils } from "./coordinate_utils";

export class RouteUtils {
    
    public static routeToString(route: Waypoint[]): string {
        return route.map((x) => RouteUtils.waypointToString(x)).join( ' > ').replaceAll('>  >', '>>');
    }

    public static waypointToString(waypoint: Waypoint): string {
        let s = waypoint.name;
        if(waypoint.latitude && waypoint.longitude) {
            s += `(${CoordinateUtils.latLonToCoordinateString(waypoint.latitude, waypoint.longitude)})`;
        }
        if(waypoint.time && waypoint.timeFormat) {
            s +=`@${RouteUtils.timestampToString(waypoint.time, waypoint.timeFormat)}`;
        }
        return s;
    }
    // move out if we want public
    private static timestampToString(time: number, format: 'tod' | 'epoch'): string {
        const date = new Date(time * 1000);
        if(format == 'tod') {
            return date.toISOString().slice(11, 19);
        }
        //strip off millis
        return date.toISOString().slice(0,-5)+"Z";
    }
}