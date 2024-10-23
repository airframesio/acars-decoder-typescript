import { DateTimeUtils } from "../DateTimeUtils";
import { Route } from "../types/route";
import { Waypoint } from "../types/waypoint";
import { CoordinateUtils } from "./coordinate_utils";

export class RouteUtils {

    public static formatFlightState(state: string): string {
        switch (state) {
            case "TO": return "Takeoff";
            case "IC": return "Initial Climb";
            case "CL": return "Climb";
            case "ER": return "En Route";
            case "DC": return "Descent";
            case "AP": return "Approach";
            default: return `Unknown ${state}`;
        }
    }
    
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
        if(waypoint.offset) {
            s += `[${waypoint.offset.bearing}° ${waypoint.offset.distance}nm]`;
        }
        if(waypoint.time && waypoint.timeFormat) {
            s +=`@${DateTimeUtils.timestampToString(waypoint.time, waypoint.timeFormat)}`;
        }
        return s;
    }
    
    public static getWaypoint(leg: string): Waypoint {
        const regex = leg.match(/^([A-Z]+)(\d{3})-(\d{4})$/); // {name}{bearing}-{distance}
        if(regex?.length == 4) {
            return {name: regex[1], offset: {bearing: parseInt(regex[2]), distance: parseInt(regex[3])/10}};
        }

        const waypoint = leg.split(',');
        if(waypoint.length ==2) {
            const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(waypoint[1]);
            if(position) {
                return {name: waypoint[0], latitude: position.latitude, longitude: position.longitude};
            }
        }
        if(leg.length == 13 || leg.length == 14) { //looks like coordinates
            const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(leg);
            const name = waypoint.length == 2 ? waypoint[0] : '';
            if(position) {
                return {name: name, latitude: position.latitude, longitude: position.longitude};
            }
        }
        return {name: leg};
    }

    private static waypointsToString(waypoints: Waypoint[]): string {
        let str = waypoints.map((x) => RouteUtils.waypointToString(x)).join( ' > ').replaceAll('>  >', '>>');
            if(str.startsWith(' > ')) {
                str = '>>' + str.slice(2);
            }
        return str;
    }
}
