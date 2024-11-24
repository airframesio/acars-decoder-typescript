import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_83 extends DecoderPlugin {
  name = 'label-83';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['83'],
    };
  }

  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;
    decodeResult.formatted.description = 'Airline Defined';

    decodeResult.decoded = true;
    if (message.text.substring(0, 10) === "4DH3 ETAT2") {
        // variant 2
        const fields = message.text.split(/\s+/);
        if (fields[2].length > 5) {
            decodeResult.raw.day = fields[2].substring(5);
        }
        ResultFormatter.unknown(decodeResult, fields[2].substring(0, 4));
        const subfields = fields[3].split("/");
        ResultFormatter.departureAirport(decodeResult, subfields[0]);
        ResultFormatter.arrivalAirport(decodeResult, subfields[1]);
        ResultFormatter.tail(decodeResult, fields[4].replace(/\./g, ""));
        ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(fields[6] + "00"));
    } else if (message.text.substring(0, 5) === "001PR") {
        // variant 3
        decodeResult.raw.day = message.text.substring(5, 7);
        const position = CoordinateUtils.decodeStringCoordinatesDecimalMinutes(message.text.substring(13, 28).replace(/\./g, ""))
        if (position) {
            ResultFormatter.position(decodeResult, position);
        }
        ResultFormatter.altitude(decodeResult, Number(message.text.substring(28, 33)));
        decodeResult.remaining.text = message.text.substring(33);
    } else {
        const fields = message.text.replace(/\s/g, "").split(',');
        if (fields.length === 9) {
            // variant 1
            ResultFormatter.departureAirport(decodeResult, fields[0]);
            ResultFormatter.arrivalAirport(decodeResult, fields[1]);
            decodeResult.raw.day = fields[2].substring(0,2);
            decodeResult.raw.time = fields[2].substring(2);
            ResultFormatter.position(decodeResult,
                {
                    latitude: Number(fields[3].replace(/\s/g, "")),
                    longitude: Number(fields[4].replace(/\s/g, "")),
                });
            ResultFormatter.altitude(decodeResult, Number(fields[5]));
            ResultFormatter.groundspeed(decodeResult, Number(fields[6]));
            ResultFormatter.heading(decodeResult, Number(fields[7]));
            ResultFormatter.unknown(decodeResult, fields[8]);
        } else {
            decodeResult.decoded = false;
            ResultFormatter.unknown(decodeResult, message.text);
        }
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
