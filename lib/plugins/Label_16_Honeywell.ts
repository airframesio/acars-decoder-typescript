import { DecoderPlugin } from "../DecoderPlugin";
import { DecodeResult, Message, Options } from "../DecoderPluginInterface";
import { CoordinateUtils } from "../utils/coordinate_utils";
import { ResultFormatter } from "../utils/result_formatter";

// Honeywell Label 16 Position Report
export class Label_16_Honeywell extends DecoderPlugin {
  name = "label-16-honeywell";

  qualifiers() {
    // eslint-disable-line class-methods-use-this
    return {
      labels: ["16"],
      preambles: ["(2"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Position Report";
    decodeResult.message = message;

    if (message.text.startsWith("(2") && message.text.endsWith("(Z") && message.text.length >= 29) {
      const between = message.text.substring(2, message.text.length - 2);
      ResultFormatter.unknown(decodeResult, between.substring(0, 4), ""); // Session ID
      ResultFormatter.position(
        decodeResult,
        CoordinateUtils.decodeStringCoordinatesDecimalMinutes(
          between.substring(4, 17),
        ),
      );
      if (between.charAt(17) === "-") {
        // Waypoint mode
        const waypoint1 = between.substring(18, 23).trim();
        const waypoint2 = between.substring(23, 28).trim();
        if (waypoint2) {
          ResultFormatter.route(decodeResult, {
            waypoints: [{ name: waypoint1 }, { name: waypoint2 }],
          });
        } else {
          ResultFormatter.route(decodeResult, {
            waypoints: [{ name: waypoint1 }],
          });
        }
      } else {
        // Route mode
        ResultFormatter.departureAirport(
          decodeResult,
          between.substring(17, 21),
        );
        ResultFormatter.arrivalAirport(decodeResult, between.substring(21, 25));
        //ignore the rest (should just be '-')
      }
      /*
      const phases: { [key: string]: string } = {
        '/O': 'En Route',
        '/A': 'Arrival',
        '/D': 'Departure',
        '/P': 'Preflight',
        '/C': 'Climb',
      };
      */
      ResultFormatter.unknown(
        decodeResult,
        between.substring(between.length - 2),
        "",
      );
    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown 16 Honeywell message: ${message.text}`);
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
