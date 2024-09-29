import { DateTimeUtils } from "../DateTimeUtils";
import { DecodeResult } from "../DecoderPluginInterface";
import { Waypoint } from "../types/waypoint";
import { CoordinateUtils } from "./coordinate_utils";
import { FlightPlanUtils } from "./flight_plan_utils";
import { ResultFormatter } from "./result_formatter";
import { RouteUtils } from "./route_utils";

export class H1Helper {
    public static decodeH1Message(decodeResult: DecodeResult, message: String) {
        let allKnownFields = true;
        const checksum = message.slice(-4);
        const data = message.slice(0, message.length - 4);

        const fields = data.split('/');
        allKnownFields = allKnownFields && parseMessageType(decodeResult, fields[0]);
        for (let i = 1; i < fields.length; ++i) {
            if (fields[i].startsWith('FN')) {
                decodeResult.raw.flight_number = fields[i].substring(2); // Strip off 'FN'
            } else if (fields[i].startsWith('SN')) {
                decodeResult.raw.serial_number = fields[i].substring(2); // Strip off 'SN'
            } else if (fields[i].startsWith('TS')) {
                const ts = fields[i].substring(2).split(','); // Strip off PS
                let time = DateTimeUtils.convertDateTimeToEpoch(ts[0], ts[1]);

                if (Number.isNaN(time)) {  // convert DDMMYY to MMDDYY - TODO figure out a better way to determine
                    const date = ts[1].substring(2, 4) + ts[1].substring(0, 2) + ts[1].substring(4, 6);
                    time = DateTimeUtils.convertDateTimeToEpoch(ts[0], date);
                }
                decodeResult.raw.message_date = ts[1];
                decodeResult.raw.message_timestamp = time;
            } else if (fields[i].startsWith('PS')) {
                const pos = processPS(decodeResult, fields[i].substring(2).split(',')); // Strip off PS
                allKnownFields == allKnownFields && pos;
            } else if (fields[i].startsWith('DT')) {
                const data = fields[i].substring(2).split(','); // Strip off DT
                const dt = processDT(decodeResult, data);
                allKnownFields = allKnownFields && dt;
            } else if (fields[i].startsWith('ID')) {
                const data = fields[i].substring(2).split(','); // Strip off ID
                decodeResult.raw.tail = data[0];
                decodeResult.formatted.items.push({
                    type: 'tail',
                    code: "TAIL",
                    label: 'Tail',
                    value: decodeResult.raw.tail,
                });
                if (data.length > 1) {
                    decodeResult.raw.flight_number = data[1];
                }
                if (data.length > 2) {//TODO: figure out what this is
                    allKnownFields = false;
                    decodeResult.remaining.text += ',' + data.slice(2).join(',');
                }
            } else if (fields[i].startsWith('LR')) {
                const data = fields[i].substring(2).split(','); // Strip off LR
                const lr = processLR(decodeResult, data);
                allKnownFields = allKnownFields && lr;
            } else if (fields[i].startsWith('RI') || fields[i].startsWith('RF') || fields[i].startsWith('RP')) {
                const fp = FlightPlanUtils.processFlightPlan(decodeResult, fields[i].split(':'));
                allKnownFields = allKnownFields && fp;
            } else if (fields[i].startsWith('PR')) {
                // process PR data
                // data[8] is temperature
                allKnownFields = false
                decodeResult.remaining.text += '/' + fields[i];

            } else if (fields[i].startsWith('PS')) {
                // process position data
                allKnownFields = false
                decodeResult.remaining.text += fields[i];
            } else {
                decodeResult.remaining.text += '/' + fields[i];
                allKnownFields = false
            }
        }
        if (decodeResult.formatted.items.length > 0) {
            ResultFormatter.checksum(decodeResult, checksum);
        }
        return allKnownFields;
    }
}

function processDT(decodeResult: DecodeResult, data: string[]): boolean {
    let allKnownFields = true;
    if (!decodeResult.raw.arrival_icao) {
        ResultFormatter.arrivalAirport(decodeResult, data[0]);
    } else if (decodeResult.raw.arrival_icao != data[0]) {
        decodeResult.remaining.text += '/' + data;
    } // else duplicate - don't do anything


    if (data.length > 1) {
        ResultFormatter.arrivalRunway(decodeResult, data[1]);
    }
    if (data.length > 2) {
        ResultFormatter.currentFuel(decodeResult, Number(data[2]));
    }
    if (data.length > 3) {
        ResultFormatter.eta(decodeResult, data[3]);
    }
    if (data.length > 4) {
        ResultFormatter.remainingFuel(decodeResult, Number(data[4]));
    }
    if (data.length > 5) {//TODO: figure out what this is
        allKnownFields = false
        decodeResult.remaining.text += ',' + data.slice(5).join(',');
    }


    return allKnownFields;
};

function processLR(decodeResult: DecodeResult, data: string[]): boolean {
    let allKnownFields = true;
    if (data.length === 19) {
        ResultFormatter.unknown(decodeResult, data[1]);
        ResultFormatter.flightNumber(decodeResult, data[2]);
        ResultFormatter.departureAirport(decodeResult, data[3]);
        ResultFormatter.arrivalAirport(decodeResult, data[4]);
        ResultFormatter.arrivalRunway(decodeResult, data[5]);
        ResultFormatter.unknown(decodeResult, data.slice(6, 19).join(','));
        allKnownFields = false;
    } else {
        allKnownFields = false;
    }

    return allKnownFields;
};


function parseMessageType(decodeResult: DecodeResult, messageType: string): boolean {
    let decoded = true;
    const parts = messageType.split('#');
    if (parts.length == 1) {
        if (parts[0].startsWith('POS') && parts[0].length !== 3 && !(parts[0].startsWith('POS/'))) {
            decoded = processPosition(decodeResult, parts[0].substring(3).split(','));
        }
        return decoded;
    } else if (parts.length == 2) {
        if (parts[0].length > 0) {
            decodeResult.remaining.text += parts[0].substring(0, 3);
            decodeResult.raw.flight_number = parts[0].substring(3);
            decodeResult.remaining.text += '#' + parts[1].substring(0, 3);
        }
        if (parts[1].substring(3, 6) === 'POS' && parts[1].length !== 6 && parts[1].substring(3, 7) !== 'POS/') {
            decoded = processPosition(decodeResult, parts[1].substring(6).split(','));
        }

        decodeResult.raw.message_type = messageType;
        return decoded;
    }

    decodeResult.remaining.text += messageType;
    return false;
}

function processPS(decodeResult: DecodeResult, data: string[]): boolean {
    let allKnownFields = true;
    const position = CoordinateUtils.decodeStringCoordinates(data[0]);
    if (position) {
        decodeResult.raw.position = position
        decodeResult.formatted.items.push({
            type: 'aircraft_position',
            code: 'POS',
            label: 'Aircraft Position',
            value: CoordinateUtils.coordinateString(position),
        });
    } else {
        allKnownFields = false;
    }
    console.log('PS data.length: ', data.length);
    console.log('PS data: ', data);
    if (data.length === 9) { // variant 7
        processRoute(decodeResult, data[3], data[1], data[5], data[4], undefined);
        ResultFormatter.altitude(decodeResult, Number(data[2]) * 100);
        ResultFormatter.temperature(decodeResult, data[6]);
        ResultFormatter.unknown(decodeResult, data[7]);
        ResultFormatter.unknown(decodeResult, data[8]);
    }
    if (data.length === 14) { // variant 2
        ResultFormatter.altitude(decodeResult, Number(data[3]) * 100);
        processRoute(decodeResult, data[4], data[2], data[6], data[5], undefined);
        ResultFormatter.temperature(decodeResult, data[7]);
        ResultFormatter.groundspeed(decodeResult, Number(data[10]));
        ResultFormatter.unknown(decodeResult, data[1]);
        ResultFormatter.unknown(decodeResult, data[8]);
        ResultFormatter.unknown(decodeResult, data[9]);
        ResultFormatter.unknown(decodeResult, data.slice(11).join(','));
    }
    allKnownFields = false;
    return allKnownFields;
}
function processPosition(decodeResult: DecodeResult, data: string[]): boolean {
    let allKnownFields = true;
    const position = CoordinateUtils.decodeStringCoordinates(data[0]);
    if (position) {
        decodeResult.raw.position = position
        decodeResult.formatted.items.push({
            type: 'aircraft_position',
            code: 'POS',
            label: 'Aircraft Position',
            value: CoordinateUtils.coordinateString(position),
        });
    } else {
        allKnownFields = false;
    }
    console.log('data.length: ', data.length);
    console.log('data: ', data);
    if (data.length >= 10) { // variant 1, short
        ResultFormatter.altitude(decodeResult, Number(data[3]) * 100);
        processRoute(decodeResult, data[1], data[2], data[4], data[5], data[6]);
        ResultFormatter.temperature(decodeResult, data[7]);
        ResultFormatter.unknown(decodeResult, data[8]);
        ResultFormatter.unknown(decodeResult, data[9]);
    }
    if (data.length >= 14) { // variant 2,long
        ResultFormatter.groundspeed(decodeResult, Number(data[10]));
        ResultFormatter.unknown(decodeResult, data[11]);
        ResultFormatter.unknown(decodeResult, data[12]);
        ResultFormatter.unknown(decodeResult, data[13]);
    }
    allKnownFields = false;
    return allKnownFields;
}


function processRoute(decodeResult: any, last: string, time: string, next: string, eta: string, then?: string, date?: string) {
    const lastTime = date ? DateTimeUtils.convertDateTimeToEpoch(time, date) : DateTimeUtils.convertHHMMSSToTod(time);
    const nextTime = date ? DateTimeUtils.convertDateTimeToEpoch(eta, date) : DateTimeUtils.convertHHMMSSToTod(eta);
    const timeFormat = date ? 'epoch' : 'tod';

    const lastWaypoint = RouteUtils.getWaypoint(last);
    lastWaypoint.time = lastTime;
    lastWaypoint.timeFormat = timeFormat;

    const nextWaypoint = RouteUtils.getWaypoint(next);
    nextWaypoint.time = nextTime;
    nextWaypoint.timeFormat = timeFormat;

    const thenWaypoint = RouteUtils.getWaypoint(then || '?');

    const waypoints: Waypoint[] = [lastWaypoint, nextWaypoint, thenWaypoint];
    decodeResult.raw.route = { waypoints: waypoints };
    decodeResult.formatted.items.push({
        type: 'aircraft_route',
        code: 'ROUTE',
        label: 'Aircraft Route',
        value: RouteUtils.routeToString(decodeResult.raw.route),
    });
}