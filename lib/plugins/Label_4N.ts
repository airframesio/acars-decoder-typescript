import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_4N extends DecoderPlugin {
  name = 'label-4n';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['4N'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Airline Defined';

    // Inmarsat C-band seems to prefix normal messages with a message number and flight number
    let text = message.text;
    if (text.match(/^M\d{2}A\w{6}/)) {
        ResultFormatter.flightNumber(decodeResult, message.text.substring(4, 10).replace(/0/g, ""));
        text = text.substring(10);
    }

    decodeResult.decoded = true;
    const fields = text.split(",");
    if (text.length === 51) {
        // variant 1
        decodeResult.day_of_month = text.substring(0, 2);
        ResultFormatter.departureAirport(decodeResult, text.substring(8, 11));
        ResultFormatter.arrivalAirport(decodeResult, text.substring(13, 16));
        ResultFormatter.position(decodeResult, CoordinateUtils.decodeStringCoordinatesDecimalMinutes(text.substring(30, 45)));
        ResultFormatter.altitude(decodeResult, text.substring(48, 51) * 100);
        decodeResult.remaining.text = [text.substring(2, 4), text.substring(19, 29)].join(" ");
    } else if (fields.length === 33) {
        // variant 2
        decodeResult.date = fields[3];
        ResultFormatter.position(decodeResult, {latitude: Number(fields[4]), longitude: Number(fields[5])});
        ResultFormatter.altitude(decodeResult, fields[6]);
        ResultFormatter.departureAirport(decodeResult, fields[8]);
        ResultFormatter.arrivalAirport(decodeResult, fields[9]);
        ResultFormatter.arrivalRunway(decodeResult, fields[11].split("/")[0]);
        ResultFormatter.checksum(decodeResult, fields[32]);
        let remaining = [];
        const idxs = [0, 3, 4, 5, 6, 8, 9, 10, 11, 32];
        for (let i = 0; i < fields.length; i++) {
            if (fields[i] !== "" && !idxs.includes(i))
                remaining.concat(fields[i]);
        } 
        decodeResult.remaining.text = remaining.join(",");
    } else {
        decodeResult.decoded = false;
        decodeResult.remaining.text = text;
    }

    if (decodeResult.decoded) {
        if(decodeResult.remaining.text === "")
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
