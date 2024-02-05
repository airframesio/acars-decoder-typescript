import { CoordinateUtils } from "../utils/coordinate_utils";

/**
 * Represenation of a waypoint.
 * 
 * Usually used in Routes which is an array of waypoints.
 * Airways/Jetways can also be represented as a waypoint, by just the name.
 * There is no distinction between the two currently because there is no difference from the current messages
 * Distinction must be determined from tne name.
 * In the event that a waypoint is a GPS position, the name can be the raw position string (N12345W012345)
 */
export interface Waypoint {
    /** unique identifier of the waypoint*/
    name: string;
    /** 
     * latitude in decimal degrees
     *
     * if set, longitude must be provided
    */
    latitude?: number;
    /** longitude in decimal degrees 
     * 
     * if set, latitude must be provided
    */
    longitude?: number;
    /** 
     * time of arrival. If in future, it is an ETA.
     * 
     * if set, timeFormat must be provided
    */
    time?: number;
    /**  
     * tod = 'Time of Day. seoconds since midnight', epoch = 'unix time. seconds since Jan 1, 1970 UTC'
     * 
     * if set, time must be provided
     */
    timeFormat?: 'tod' | 'epoch'

}