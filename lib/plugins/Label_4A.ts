import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { DateTimeUtils } from '../DateTimeUtils';
import { ResultFormatter } from '../utils/result_formatter';
import { Waypoint } from '../types/waypoint';

export class Label_4A extends DecoderPlugin {
  name = 'label-4a';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['4A'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Latest New Format';


    // Inmarsat C-band seems to prefix normal messages with a message number and flight number
    let text = message.text;
    if (text.match(/^M\d{2}A\w{6}/)) {
        ResultFormatter.flightNumber(decodeResult, message.text.substring(4, 10).replace(/^([A-Z]+)0*/g, "$1"));
        text = text.substring(10);
    }

    decodeResult.decoded = true;
    const fields = text.split(",");
    if (fields.length === 11) {
        // variant 1
        ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[0]));
        ResultFormatter.tail(decodeResult, fields[2].replace(".", ""));
        if (fields[3])
            ResultFormatter.callsign(decodeResult, fields[3]);
        ResultFormatter.departureAirport(decodeResult, fields[4]);
        ResultFormatter.arrivalAirport(decodeResult, fields[5]);
        const alt = text.substring(48, 51);
        if(alt !== '') {
            ResultFormatter.altitude(decodeResult, Number(alt) * 100);
        }
        ResultFormatter.unknownArr(decodeResult, fields.slice(8));
    } else if (fields.length === 6) {
        if (fields[0].match(/^[NS]/)) {
            // variant 2
            ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinates(fields[0].substring(0, 13)));
            let wp1: Waypoint = {
                name: fields[0].substring(13).trim(),
                time: DateTimeUtils.convertHHMMSSToTod(fields[1].substring(0, 6)),
                timeFormat: 'tod',
            };
            ResultFormatter.altitude(decodeResult, Number(fields[1].substring(6, 9)) * 100);
            let wp2: Waypoint = {
                name: fields[1].substring(9).trim(),
                time: DateTimeUtils.convertHHMMSSToTod(fields[2]),
                timeFormat: 'tod',
            };
            ResultFormatter.route(decodeResult, {waypoints: [wp1, wp2]});
            ResultFormatter.temperature(decodeResult, fields[3]);
            ResultFormatter.unknownArr(decodeResult, fields.slice(4));
        } else {
            // variant 3
            ResultFormatter.time_of_day(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[0]));
            ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[1]));
            ResultFormatter.unknown(decodeResult, fields[2]);
            ResultFormatter.altitude(decodeResult, Number(fields[3]));
            ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinates((fields[4]+fields[5]).replace(/[ \.]/g, "")));
        }
    } else {
        decodeResult.decoded = false;
        ResultFormatter.unknown(decodeResult, text);
    }

    if (decodeResult.decoded) {
        if(!decodeResult.remaining.text)
            decodeResult.decoder.decodeLevel = 'full';
        else
            decodeResult.decoder.decodeLevel = 'partial';
    } else {
        decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}

export default {};
