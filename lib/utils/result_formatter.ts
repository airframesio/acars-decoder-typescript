import { decode } from "punycode";
import { DecodeResult } from "../DecoderPluginInterface";
import { CoordinateUtils } from "./coordinate_utils";

/**
 * Class to format the results of common fields
 */
export class ResultFormatter {

    static position(decodeResult: DecodeResult, value: { latitude: number, longitude: number }) {
        decodeResult.raw.position = value;
        decodeResult.formatted.items.push({
            type: 'aircraft_position',
            code: 'POS',
            label: 'Aircraft Position',
            value: CoordinateUtils.coordinateString(value),
        });
    }

    static altitude(decodeResult: DecodeResult, value: number) {
        decodeResult.raw.altitude = value;
        decodeResult.formatted.items.push({
            type: 'altitude',
            code: 'ALT',
            label: 'Altitude',
            value: `${decodeResult.raw.altitude} feet`,
        });
    }

    static flightNumber(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.flight_number = value;
    };

    static departureAirport(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.departure_icao = value;
        decodeResult.formatted.items.push({
            type: 'origin',
            code: 'ORG',
            label: 'Origin',
            value: decodeResult.raw.departure_icao,
        });
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

    static arrivalAirport(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.arrival_icao = value;
        decodeResult.formatted.items.push({
            type: 'destination',
            code: 'DST',
            label: 'Destination',
            value: decodeResult.raw.arrival_icao,
        });
    };

    static alternateAirport(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.alternate_icao = value;
        decodeResult.formatted.items.push({
            type: 'destination',
            code: 'ALT_DST',
            label: 'Alternate Destination',
            value: decodeResult.raw.alternate_icao,
        });
    };

    // FIXME - make seconds since midnight for time of day
    static eta(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.eta_time = value;
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'ETA',
            label: 'Estimated Time of Arrival',
            value: value.substring(0, 2) + ':' + value.substring(2, 4) + ':' + value.substring(4, 6),
        });
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
        decodeResult.raw.outside_air_temperature = Number(value.substring(1)) * (value.charAt(0) === 'M' ? -1 : 1);
        decodeResult.formatted.items.push({
            type: 'outside_air_temperature',
            code: 'OATEMP',
            label: 'Outside Air Temperature (C)',
            value: `${decodeResult.raw.outside_air_temperature}`,
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
        const date = new Date(time * 1000);
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'OUT',
            label: 'Out of Gate Time',
            value: date.toISOString().slice(11, 19),
        });
    }

    static off(decodeResult: DecodeResult, time: number) {
        decodeResult.raw.off_time = time;
        const date = new Date(time * 1000);
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'OFF',
            label: 'Takeoff Time',
            value: date.toISOString().slice(11, 19),
        });
    }

    static on(decodeResult: DecodeResult, time: number) {
        decodeResult.raw.on_time = time;
        const date = new Date(time * 1000);
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'ON',
            label: 'Landing Time',
            value: date.toISOString().slice(11, 19),
        });
    }

    static in(decodeResult: DecodeResult, time: number) {
        decodeResult.raw.in_time = time;
        const date = new Date(time * 1000);
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'IN',
            label: 'In Gate Time',
            value: date.toISOString().slice(11, 19),
        });
    }

    static time_of_day(decodeResult: DecodeResult, time: number) {
        decodeResult.raw.time_of_day = time;
        const date = new Date(time * 1000);
        decodeResult.formatted.items.push({
            type: 'time_of_day',
            code: 'MSG_TOD',
            label: 'Message Timestamp',
            value: date.toISOString().slice(11, 19),
        });
    }

    static unknown(decodeResult: DecodeResult, value: string) {
        decodeResult.remaining.text += ',' + value;
    };
}
