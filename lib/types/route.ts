import { Waypoint } from "./waypoint";

/**
 * Representation of a route
 * 
 * Typically a list of waypoints, this can also be a named company route.
 */
export interface Route {
    /** optional name. If not set, `waypoints` is required */
    name?: string,

    /** optional runway */
    runway?: string,

    /** optional list of waypoints. If not set, `name` is required */
    waypoints?: Waypoint[],
}