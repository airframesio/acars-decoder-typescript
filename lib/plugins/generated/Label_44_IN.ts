// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/44/IN.yaml. Do not edit.
// Plugin: Label_44_IN

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_44_IN extends DecoderPlugin {
  name = "label-44-in";

  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00IN01","00IN02","00IN03","IN01","IN02","IN03"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "In Gate Report");

    const data = message.text.split(",");
    if (data.length < 7) {
      return this.failUnknown(result, message.text, options);
    }
    const position = helpers.coordinateDecimalMinutes(data[1], {"style":"combined","format":"NSDDMM_M_EWDDMM_M"});
    const departure_icao = helpers.airport(data[2]);
    const arrival_icao = helpers.airport(data[3]);
    const month = helpers.integer(data[4], {"substring_start":0,"substring_length":2});
    const day = helpers.integer(data[4], {"substring_start":2,"substring_length":2});
    const in_time = helpers.timestampHhmmss(data[5]);
    let fuel_remaining;
    if (!(["---.-"].includes(data[6]))) {
      fuel_remaining = helpers.float(data[6]);
    }
    ResultFormatter.position(result, position);
    ResultFormatter.departureAirport(result, departure_icao);
    ResultFormatter.arrivalAirport(result, arrival_icao);
    ResultFormatter.timestamp(result, month);
    ResultFormatter.timestamp(result, day);
    ResultFormatter.timestamp(result, in_time);
    ResultFormatter.currentFuel(result, fuel_remaining);
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}
