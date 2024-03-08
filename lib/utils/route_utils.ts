import { Route } from "../types/route";
import { Waypoint } from "../types/waypoint";
import { CoordinateUtils } from "./coordinate_utils";

export class RouteUtils {
    
    public static routeToString(route: Route): string {
        let str = '';
        if(route.name) {
            str += route.name;
        }
        if(route.runway) {
            str += `(${route.runway})`;
        }
        if(str.length!==0 && route.waypoints && route.waypoints.length === 1) {
            str += ' starting at '
        }
        else if(str.length!==0 && route.waypoints) {
            str += ': ';
        }

        if(route.waypoints) {
            str += RouteUtils.waypointsToString(route.waypoints);
        } 
        
        return str;
    }

    public static waypointToString(waypoint: Waypoint): string {
        let s = waypoint.name;
        if(waypoint.latitude && waypoint.longitude) {
            s += `(${CoordinateUtils.coordinateString({latitude:waypoint.latitude, longitude: waypoint.longitude})})`;
        }
        if(waypoint.time && waypoint.timeFormat) {
            s +=`@${RouteUtils.timestampToString(waypoint.time, waypoint.timeFormat)}`;
        }
        return s;
    }
    
    public static getWaypoint(leg: string): Waypoint {
        const waypoint = leg.split(',');
        if(waypoint.length ==2) {
            const position = CoordinateUtils.decodeStringCoordinates(waypoint[1]);
            if(position) {
                return {name: waypoint[0], latitude: position.latitude, longitude: position.longitude};
            }
        }
        if(leg.length == 14) { //looks like coordinates
            const position = CoordinateUtils.decodeStringCoordinates(leg);
            if(position) {
                return {name: waypoint[0], latitude: position.latitude, longitude: position.longitude};
            }
        }
        return {name: leg};
    }

    // move out if we want public
    private static timestampToString(time: number, format: 'tod' | 'epoch'): string {
        const date = new Date(time * 1000);        if(format == 'tod') {
            return date.toISOString().slice(11, 19);
        }
        //strip off millis
        return date.toISOString().slice(0,-5)+"Z";
    }

    private static waypointsToString(waypoints: Waypoint[]): string {
        let str = waypoints.map((x) => RouteUtils.waypointToString(x)).join( ' > ').replaceAll('>  >', '>>');
            if(str.startsWith(' > ')) {
                str = '>>' + str.slice(2);
            }
        return str;
    }
}