import { decode } from "punycode";
import { DecodeResult } from "../DecoderPluginInterface";
import { CoordinateUtils } from "./coordinate_utils";
import { DateTimeUtils } from "../DateTimeUtils";
import { RouteUtils } from "./route_utils";
import { Waypoint } from "../types/waypoint";
import { Route } from "../types/route";

/**
 * Class to format the results of common fields
 */
export class ResultFormatter {

    static route(decodeResult: DecodeResult, route: Route) {
        decodeResult.raw.route = route;
        decodeResult.formatted.items.push({
            type: 'aircraft_route',
            code: 'ROUTE',
            label: 'Aircraft Route',
            value: RouteUtils.routeToString(route),
        });
    };

    static state_change(decodeResult: DecodeResult, from: string, to: string) {
        decodeResult.raw.state_change = {
            from: from,
            to: to,
        };
        from = RouteUtils.formatFlightState(from);
        to = RouteUtils.formatFlightState(to);
        decodeResult.formatted.items.push({
            type: 'state_change',
            code: 'STATE_CHANGE',
            label: 'State Change',
            value: `${from} -> ${to}`,
        });
    }

    static freetext(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.freetext = value;
        decodeResult.formatted.items.push({
            type: 'freetext',
            code: 'FREE_TEXT',
            label: 'Free Text',
            value: value,
        });
    }

    static door_event(decodeResult: DecodeResult, name: string, state: string) {
        decodeResult.raw.door_event = {
            door: name,
            state: state,
        };

        decodeResult.formatted.items.push({
            type: 'door_event',
            code: 'DOOR',
            label: 'Door Event',
            value: `${name} ${state}`,
        });
    }

    static position(decodeResult: DecodeResult, value: { latitude: number, longitude: number } | undefined) {
        if (!value || isNaN(value.latitude) || isNaN(value.longitude)) {
            return;
        }
        decodeResult.raw.position = value;
        decodeResult.formatted.items.push({
            type: 'aircraft_position',
            code: 'POS',
            label: 'Aircraft Position',
            value: CoordinateUtils.coordinateString(value),
        });
    }

    static altitude(decodeResult: DecodeResult, value: number) {
        if(isNaN(value)) {
            return;
        }
        decodeResult.raw.altitude = value;
        decodeResult.formatted.items.push({
            type: 'altitude',
            code: 'ALT',
            label: 'Altitude',
            value: `${decodeResult.raw.altitude} feet`,
        });
    }

    static flightNumber(decodeResult: DecodeResult, value: string) {
        if(value.length === 0 ) {
            return;
        }
        decodeResult.raw.flight_number = value;
        decodeResult.formatted.items.push({
            type: 'flight_number',
            code: 'FLIGHT',
            label: 'Flight Number',
            value: decodeResult.raw.flight_number,
        });
    };

    static callsign(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.callsign = value;
        decodeResult.formatted.items.push({
            type: 'callsign',
            code: 'CALLSIGN',
            label: 'Callsign',
            value: decodeResult.raw.callsign,
        });
    };

    static departureAirport(decodeResult: DecodeResult, value: string, type: 'IATA' | 'ICAO' = 'ICAO') {
        if (type === 'ICAO') {
            decodeResult.raw.departure_icao = value;
            decodeResult.formatted.items.push({
                type: 'icao',
                code: 'ORG',
                label: 'Origin',
                value: value,
            });
        } else {
            decodeResult.raw.departure_iata = value;
            decodeResult.formatted.items.push({
                type: 'iata',
                code: 'ORG',
                label: 'Origin',
                value: value,
            });
        }
    };

    static departureRunway(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.departure_runway = value;
        decodeResult.formatted.items.push({
            type: 'runway',
            code: 'DEPRWY',
            label: 'Departure Runway',
            value: decodeResult.raw.departure_runway,
        });
    }

    static arrivalAirport(decodeResult: DecodeResult, value: string, type: 'IATA' | 'ICAO' = 'ICAO') {
        if (type === 'ICAO') {
            decodeResult.raw.arrival_icao = value;
            decodeResult.formatted.items.push({
                type: 'icao',
                code: 'DST',
                label: 'Destination',
                value: value,
            });
        } else {
            decodeResult.raw.arrival_iata = value;
            decodeResult.formatted.items.push({
                type: 'iata',
                code: 'DST',
                label: 'Destination',
                value: value,
            });
        }
    };

    static alternateAirport(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.alternate_icao = value;
        decodeResult.formatted.items.push({
            type: 'icao',
            code: 'ALT_DST',
            label: 'Alternate Destination',
            value: decodeResult.raw.alternate_icao,
        });
    };

    static eta(decodeResult: DecodeResult, time: number, type: 'tod' | 'epoch' = 'tod') {
        if (type === 'tod') {
            decodeResult.raw.eta_time = time;
            decodeResult.formatted.items.push({
                type: 'time_of_day',
                code: 'ETA',
                label: 'Estimated Time of Arrival',
                value: DateTimeUtils.timestampToString(time, 'tod'),
            });
        } else {
            decodeResult.raw.eta_date = time;
            decodeResult.formatted.items.push({
                type: 'epoch',
                code: 'ETA',
                label: 'Estimated Time of Arrival',
                value: DateTimeUtils.timestampToString(time, 'epoch'),
            });
        }
    }

    static arrivalRunway(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.arrival_runway = value;
        decodeResult.formatted.items.push({
            type: 'runway',
            code: 'ARWY',
            label: 'Arrival Runway',
            value: decodeResult.raw.arrival_runway,
        });
    };

    static alternateRunway(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.alternate_runway = value;
        decodeResult.formatted.items.push({
            type: 'runway',
            code: 'ALT_ARWY',
            label: 'Alternate Runway',
            value: decodeResult.raw.alternate_runway,
        });
    };

    static currentFuel(decodeResult: DecodeResult, value: number) {
        decodeResult.raw.fuel_on_board = value;
        decodeResult.formatted.items.push({
            type: 'fuel_on_board',
            code: 'FOB',
            label: 'Fuel On Board',
            value: decodeResult.raw.fuel_on_board.toString(),
        });
    };

    static remainingFuel(decodeResult: DecodeResult, value: number) {
        decodeResult.raw.fuel_remaining = value;
        decodeResult.formatted.items.push({
            type: 'fuel_remaining',
            code: 'FUEL',
            label: 'Fuel Remaining',
            value: decodeResult.raw.fuel_remaining.toString(),
        });
    };


    static checksum(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.checksum = Number("0x" + value);
        decodeResult.formatted.items.push({
            type: 'message_checksum',
            code: 'CHECKSUM',
            label: 'Message Checksum',
            value: '0x' + ('0000' + decodeResult.raw.checksum.toString(16)).slice(-4),
        });
    };

    static groundspeed(decodeResult: DecodeResult, value: number) {
        decodeResult.raw.groundspeed = value;
        decodeResult.formatted.items.push({
            type: 'aircraft_groundspeed',
            code: 'GSPD',
            label: 'Aircraft Groundspeed',
            value: `${decodeResult.raw.groundspeed} knots`
        });
    }

    static temperature(decodeResult: DecodeResult, value: string) {
        if(value.length === 0 ) {
            return;
        }
        decodeResult.raw.outside_air_temperature = Number(value.replace("M", "-").replace("P", "+"));
        decodeResult.formatted.items.push({
            type: 'outside_air_temperature',
            code: 'OATEMP',
            label: 'Outside Air Temperature (C)',
            value: `${decodeResult.raw.outside_air_temperature} degrees`,
        });
    }

    static heading(decodeResult: DecodeResult, value: number) {
        decodeResult.raw.heading = value;
        decodeResult.formatted.items.push({
            type: 'heading',
            code: 'HDG',
            label: 'Heading',
            value: `${decodeResult.raw.heading}`,
        });
    }

    static tail(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.tail = value;
        decodeResult.formatted.items.push({
            type: 'tail',
            code: "TAIL",
            label: 'Tail',
            value: decodeResult.raw.tail,
        });
    }

    static out(decodeResult: DecodeResult, time: number) {
        decodeResult.raw.out_time = time;
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'OUT',
            label: 'Out of Gate Time',
            value: DateTimeUtils.timestampToString(time, 'tod'),
        });
    }

    static off(decodeResult: DecodeResult, time: number, type: 'tod' | 'epoch' = 'tod') {
        if (type === 'tod') {
            decodeResult.raw.off_time = time;
            decodeResult.formatted.items.push({
                type: 'time_of_day',
                code: 'OFF',
                label: 'Takeoff Time',
                value: DateTimeUtils.timestampToString(time, 'tod'),
            });
        } else {
            decodeResult.raw.off_date = time;
            decodeResult.formatted.items.push({
                type: 'epoch',
                code: 'OFF',
                label: 'Takeoff Time',
                value: DateTimeUtils.timestampToString(time, 'epoch'),
            });
        }
    }

    static on(decodeResult: DecodeResult, time: number) {
        decodeResult.raw.on_time = time;
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'ON',
            label: 'Landing Time',
            value: DateTimeUtils.timestampToString(time, 'tod'),
        });
    }

    static in(decodeResult: DecodeResult, time: number) {
        decodeResult.raw.in_time = time;
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'IN',
            label: 'In Gate Time',
            value: DateTimeUtils.timestampToString(time, 'tod'),
        });
    }

    static time_of_day(decodeResult: DecodeResult, time: number) {
        decodeResult.raw.time_of_day = time;
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'MSG_TOD',
            label: 'Message Timestamp',
            value: DateTimeUtils.timestampToString(time, 'tod'),
        });
    }

    static day(decodeResult: DecodeResult, day: number) {
        decodeResult.raw.day = day;
        decodeResult.formatted.items.push({
            type: 'day',
            code: 'MSG_DAY',
            label: 'Day of Month',
            value: `${day}`,
        });
    }

    static month(decodeResult: DecodeResult, month: number) {
        decodeResult.raw.month = month;
        decodeResult.formatted.items.push({
            type: 'month',
            code: 'MSG_MON',
            label: 'Month of Year',
            value: `${month}`,
        });
    }

    static departureDay(decodeResult: DecodeResult, day: number) {
        decodeResult.raw.departure_day = day;
        decodeResult.formatted.items.push({
            type: 'day',
            code: 'DEP_DAY',
            label: 'Departure Day',
            value: `${day}`,
        });
    }

    static arrivalDay(decodeResult: DecodeResult, day: number) {
        decodeResult.raw.arrival_day = day;
        decodeResult.formatted.items.push({
            type: 'day',
            code: 'ARR_DAY',
            label: 'Arrival Day',
            value: `${day}`,
        });
    }

    static text(decodeResult: DecodeResult, text: string) {
        decodeResult.raw.text = text;
        decodeResult.formatted.items.push({
            type: 'text',
            code: 'TEXT',
            label: 'Text Message',
            value: text,
        });
    }

    static unknown(decodeResult: DecodeResult, value: string, sep: string = ',') {
        if (!decodeResult.remaining.text)
            decodeResult.remaining.text = value;
        else
            decodeResult.remaining.text += sep + value;
    };

    static unknownArr(decodeResult: DecodeResult, value: string[], sep: string = ',') {
        this.unknown(decodeResult, value.join(sep), sep);
    };
}
