import { DecodeResult } from "../DecoderPluginInterface";

/**
 * Class to format the results of common fields
 */
export class ResultFormatter {

    static altitude(decodeResult: DecodeResult, value: number) {
        decodeResult.raw.altitude = value;
        decodeResult.formatted.items.push({
            type: 'altitude',
            code: 'ALT',
            label: 'Altitude',
            value: `${decodeResult.raw.altitude} feet`,
        });
    }

    public static flightNumber(decodeResult: any, value: string) {
        decodeResult.raw.flight_number = value;
    };

    public static departureAirport(decodeResult: any, value: string) {
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

    public static arrivalAirport(decodeResult: any, value: string) {
        decodeResult.raw.arrival_icao = value;
        decodeResult.formatted.items.push({
            type: 'destination',
            code: 'DST',
            label: 'Destination',
            value: decodeResult.raw.arrival_icao,
        });
    };

    public static eta(decodeResult: DecodeResult, value: string) {
        decodeResult.formatted.items.push({
            type: 'eta',
            code: 'ETA',
            label: 'Estimated Time of Arrival',
            value: value.substring(0, 2) + ':' + value.substring(2, 4) + ':' + value.substring(4, 6),
        });
    }

    public static arrivalRunway(decodeResult: any, value: string) {
        decodeResult.raw.arrival_runway = value;
        decodeResult.formatted.items.push({
            type: 'runway',
            label: 'Arrival Runway',
            value: decodeResult.raw.arrival_runway,
        });
    };


    public static currentFuel(decodeResult: any, value: number) {
        decodeResult.raw.fuel_on_board = value;
        decodeResult.formatted.items.push({
            type: 'fuel_on_board',
            code: 'FOB',
            label: 'Fuel On Board',
            value: decodeResult.raw.fuel_on_board.toString(),
        });
    };
    public static remainingFuel(decodeResult: any, value: number) {
        decodeResult.raw.fuel_remaining = value;
        decodeResult.formatted.items.push({
            type: 'fuel_remaining',
            label: 'Fuel Remaining',
            value: decodeResult.raw.fuel_remaining.toString(),
        });
    };


    public static checksum(decodeResult: DecodeResult, value: string) {
        decodeResult.raw.checksum = Number("0x" + value);
        decodeResult.formatted.items.push({
            type: 'message_checksum',
            code: 'CHECKSUM',
            label: 'Message Checksum',
            value: '0x' + ('0000' + decodeResult.raw.checksum.toString(16)).slice(-4),
        });
    };

    public static groundspeed(decodeResult: any, value: number) {
        decodeResult.raw.groundspeed = value;
        decodeResult.formatted.items.push({
            type: 'aircraft_groundspeed',
            code: 'GSPD',
            label: 'Aircraft Groundspeed',
            value: `${decodeResult.raw.groundspeed}`
        });
    }


    public static temperature(decodeResult: any, value: string) {
        decodeResult.raw.outside_air_temperature = Number(value.substring(1)) * (value.charAt(0) === 'M' ? -1 : 1);
        decodeResult.formatted.items.push({
            type: 'outside_air_temperature',
            code: 'OATEMP',
            label: 'Outside Air Temperature (C)',
            value: `${decodeResult.raw.outside_air_temperature}`,
        });
    }
    public static unknown(decodeResult: any, value: string) {
        decodeResult.remaining.text += ',' + value;
    };
}