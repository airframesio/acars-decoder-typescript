import { DateTimeUtils } from "../DateTimeUtils";
import { DecodeResult } from "../DecoderPluginInterface";
import { Waypoint } from "../types/waypoint";
import { CoordinateUtils } from "./coordinate_utils";
import { FlightPlanUtils } from "./flight_plan_utils";
import { ResultFormatter } from "./result_formatter";
import { RouteUtils } from "./route_utils";

export class H1Helper {
    public static decodeH1Message(decodeResult: DecodeResult, message: string) {
        const checksum = message.slice(-4);
        const data = message.slice(0, message.length - 4);

        const fields = data.split('/');
        parseMessageType(decodeResult, fields[0]);

        for (let i = 1; i < fields.length; ++i) {
            if (fields[i].startsWith('FN')) {
                decodeResult.raw.flight_number = fields[i].substring(2); // Strip off 'FN'
            } else if (fields[i].startsWith('SN')) {
                decodeResult.raw.serial_number = fields[i].substring(2); // Strip off 'SN'
            } else if (fields[i].startsWith('DC')) {
                processDC(decodeResult, fields[i].substring(2).split(',')); // Strip off 'DC'
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
            } else if (fields[i].startsWith('DT')) {
                const data = fields[i].substring(2).split(','); // Strip off DT
                processDT(decodeResult, data);
            } else if (fields[i].startsWith('ID')) {
                processIdentification(decodeResult, fields[i].substring(2).split(',')); // Strip off ID
            } else if (fields[i].startsWith('LR')) {
                const data = fields[i].substring(2).split(','); // Strip off LR
                processLR(decodeResult, data);
            } else if (fields[i].startsWith('RI') || fields[i].startsWith('RF') || fields[i].startsWith('RP')) {
                FlightPlanUtils.processFlightPlan(decodeResult, fields[i].split(':'));
            } else if (fields[i].startsWith('PR')) {
                // process PR data
                // data[8] is temperature
                ResultFormatter.unknown(decodeResult, fields[i], '/');
            } else if (fields[i].startsWith('AF')) {
                processAirField(decodeResult, fields[i].substring(2).split(',')); // Strip off AF
            } else if (fields[i].startsWith('TD')) {
                processTimeOfDeparture(decodeResult, fields[i].substring(2).split(',')); // Strip off TD
            } else if (fields[i].startsWith('FX')) {
                ResultFormatter.freetext(decodeResult, fields[i].substring(2));
            }  else if (fields[i].startsWith('ET')) {
                if(fields[i].length === 7) { // 1 digit day
                //ResultFormatter.dayOfMonth(decodeResult, Number(fields[i].substring(1, 3)));
                ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[i].substring(3)+'00'));
                } else if(fields[i].length === 8) { // 2 digit day
                //ResultFormatter.dayOfMonth(decodeResult, Number(fields[i].substring(2, 4)));
                ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[i].substring(4)+'00'));
                } else {
                    ResultFormatter.unknown(decodeResult, fields[i], '/');
                }
            } else {
                ResultFormatter.unknown(decodeResult, fields[i], '/');
            }
        }
        if (decodeResult.formatted.items.length > 0) {
            ResultFormatter.checksum(decodeResult, checksum);
        }
        return true;
    }
}

function processAirField(decodeResult: DecodeResult, data: string[]) {
    if (data.length === 2) {
        ResultFormatter.departureAirport(decodeResult, data[0]);
        ResultFormatter.arrivalAirport(decodeResult, data[1]);
    } else {
        ResultFormatter.unknown(decodeResult, data.join(','), 'AF/');
    }
}
function processTimeOfDeparture(decodeResult: DecodeResult, data: string[]) {
    if (data.length === 2) {
        decodeResult.raw.plannedDepartureTime = data[0]; //DDHHMM
        decodeResult.formatted.items.push({
            type: 'ptd',
            code: "ptd",
            label: 'Planned Departure Time',
            value: `YYYY-MM-${data[0].substring(0, 2)}T${data[0].substring(2, 4)}:${data[0].substring(4)}:00Z`,
        });

        decodeResult.raw.plannedDepartureTime = data[1]; //HHMM
        decodeResult.formatted.items.push({
            type: 'etd',
            code: "etd",
            label: 'Estimated Departure Time',
            value: `${data[1].substring(0, 2)}:${data[1].substring(2)}`,
        });
    } else {
        ResultFormatter.unknown(decodeResult, data.join(','), '/TD');
    }
}

function processIdentification(decodeResult: DecodeResult, data: string[]) {
    ResultFormatter.tail(decodeResult, data[0])
    if (data.length > 1) {
        decodeResult.raw.flight_number = data[1];
    }
    if (data.length > 2) { //TODO: figure out what this is
        decodeResult.raw.mission_number = data[2];
    }
}

function processDT(decodeResult: DecodeResult, data: string[]) {
    if (!decodeResult.raw.arrival_icao) {
        ResultFormatter.arrivalAirport(decodeResult, data[0]);
    } else if (decodeResult.raw.arrival_icao != data[0]) {
        ResultFormatter.unknownArr(decodeResult, data);
    } // else duplicate - don't do anything


    if (data.length > 1) {
        ResultFormatter.arrivalRunway(decodeResult, data[1]);
    }
    if (data.length > 2) {
        ResultFormatter.currentFuel(decodeResult, Number(data[2]));
    }
    if (data.length > 3) {
        ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(data[3]));
    }
    if (data.length > 4) {
        ResultFormatter.remainingFuel(decodeResult, Number(data[4]));
    }
    if (data.length > 5) {//TODO: figure out what this is
        ResultFormatter.unknownArr(decodeResult, data);
    }
};

function processLR(decodeResult: DecodeResult, data: string[]) {
    if (data.length === 19) {
        ResultFormatter.unknown(decodeResult, data[1]);
        ResultFormatter.flightNumber(decodeResult, data[2]);
        ResultFormatter.departureAirport(decodeResult, data[3]);
        ResultFormatter.arrivalAirport(decodeResult, data[4]);
        ResultFormatter.arrivalRunway(decodeResult, data[5]);
        ResultFormatter.unknown(decodeResult, data.slice(6, 19).join(','));
    } else {
        ResultFormatter.unknown(decodeResult, data.join(','));
    }
};


function parseMessageType(decodeResult: DecodeResult, messageType: string) {
    const parts = messageType.split('#');
    if (parts.length == 1) {
        const type = parts[0].substring(0, 3);
        if (type === 'POS' && parts[0].length !== 3) {
            processPosition(decodeResult, parts[0].substring(3).split(','));
        }
        return processMessageType(decodeResult, type);
    } else if (parts.length == 2) {
        if (parts[0].length > 0) {
            ResultFormatter.unknown(decodeResult, parts[0].substring(0, 3));
            decodeResult.raw.flight_number = parts[0].substring(3);
            ResultFormatter.unknown(decodeResult, parts[1].length == 5 ? parts[1].substring(0, 2) : parts[1].substring(0, 3), '#');
        }
        // TODO - see if there's a better way to determine the type
        const type = parts[1].length == 5 ? parts[1].substring(2, 5) : parts[1].substring(3, 6);
        if (parts[1].substring(3, 6) === 'POS' && parts[1].length > 6) {
            processPosition(decodeResult, parts[1].substring(6).split(','));
        }
        processMessageType(decodeResult, type);
    }
    else {
        ResultFormatter.unknown(decodeResult, messageType);
    }
}

function processMessageType(decodeResult: DecodeResult, type: string) {
    if (type === 'FPN') {
        decodeResult.formatted.description = 'Flight Plan';
    } else if (type === 'FTX') {
        decodeResult.formatted.description = 'Free Text';
    } else if (type === 'INI') {
        decodeResult.formatted.description = 'Flight Plan Initial Report';
    } else if (type === 'POS') {
        decodeResult.formatted.description = 'Position Report';
    } else if (type === 'PRG') {
        decodeResult.formatted.description = 'Progress Report';
    } else {
        decodeResult.formatted.description = 'Unknown H1 Message';
    }
}

function processDC(decodeResult: DecodeResult, data: string[]) {
    decodeResult.raw.message_date = data[0]; // DDMMYYYY;

    if (data.length === 1) {
        // noop?
    } else if (data.length === 2) {
        // convert DDMMYY to MMDDYY - TODO figure out a better way to determine
        const date = data[0].substring(2, 4) + data[0].substring(0, 2) + data[0].substring(4, 6);
        const time = DateTimeUtils.convertDateTimeToEpoch(data[1], data[0]); // HHMMSS

        decodeResult.raw.message_timestamp = time;
    }
}

function processPS(decodeResult: DecodeResult, data: string[]) {
    const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(data[0]);
    if (position) {
        decodeResult.raw.position = position
        decodeResult.formatted.items.push({
            type: 'aircraft_position',
            code: 'POS',
            label: 'Aircraft Position',
            value: CoordinateUtils.coordinateString(position),
        });
    }
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
}
function processPosition(decodeResult: DecodeResult, data: string[]) {
    const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(data[0]);
    if (position) {
        decodeResult.raw.position = position
        decodeResult.formatted.items.push({
            type: 'aircraft_position',
            code: 'POS',
            label: 'Aircraft Position',
            value: CoordinateUtils.coordinateString(position),
        });
    }
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
}


function processRoute(decodeResult: DecodeResult, last: string, time: string, next: string, eta: string, then?: string, date?: string) {
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
