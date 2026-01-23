import { DateTimeUtils } from "../DateTimeUtils";
import { DecoderPlugin } from "../DecoderPlugin";
import { DecodeResult, Message, Options } from "../DecoderPluginInterface";
import { CoordinateUtils } from "../utils/coordinate_utils";
import { FlightPlanUtils } from "../utils/flight_plan_utils";
import { ResultFormatter } from "../utils/result_formatter";

// Flight Briefing Report
export class Label_44_Slash extends DecoderPlugin {
  name = "label-44-slash";

  qualifiers() {
    // eslint-disable-line class-methods-use-this
    return {
      labels: ["44"],
      preambles: [" /FB"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Flight Briefing";
    decodeResult.message = message;

    const fields = message.text.split("/");
    if (fields.length !== 4) {
      if (options.debug) {
        console.log(`Decoder: Unknown 44 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = "none";
      return decodeResult;
    }
    ResultFormatter.unknownArr(decodeResult, fields.slice(0, 2), "/"); // 0 is a space
    // 1 is the briefing id
    // 2 is arrival airport, but repeated later
    const data = fields[3].split(",");
    if (data.length >= 6) {
      if (options.debug) {
        console.log(`Label 44 Slash: groups`);
        console.log(data);
      }

      ResultFormatter.position(decodeResult, {
        latitude:
          (data[0].charAt(0) === "S" ? -1 : 1) *
          parseFloat(data[0].slice(1).trim()),
        longitude:
          (data[1].charAt(0) === "W" ? -1 : 1) *
          parseFloat(data[1].slice(1).trim()),
      });
      ResultFormatter.flightNumber(decodeResult, data[2]);
      ResultFormatter.unknown(decodeResult, data[3]); // Status - need more info to decode
      ResultFormatter.arrivalAirport(decodeResult, data[4]);
      ResultFormatter.eta(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(data[5]),
      );
      if (data.length === 18) {
        ResultFormatter.unknownArr(decodeResult, data.slice(6, 8), ","); // 6 is repeated arrival airport
        ResultFormatter.remainingFuel(decodeResult, parseFloat(data[8]));
        ResultFormatter.unknownArr(decodeResult, data.slice(9, 11), ",");
        ResultFormatter.arrivalRunway(decodeResult, data[11]);
        FlightPlanUtils.addProcedure(decodeResult, data[12], "arrival");
        ResultFormatter.unknownArr(decodeResult, data.slice(13, 18), ",");
      }
    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown 44 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = "none";
      return decodeResult;
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "partial";

    return decodeResult;
  }
}

export default {};
