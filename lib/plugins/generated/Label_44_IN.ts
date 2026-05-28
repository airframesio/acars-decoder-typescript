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
    result.raw.position = position;
    const departure_icao = helpers.airport(data[2]);
    result.raw.departure_icao = departure_icao;
    const arrival_icao = helpers.airport(data[3]);
    result.raw.arrival_icao = arrival_icao;
    const month = helpers.integer(data[4], {"substring_start":0,"substring_length":2});
    result.raw.month = month;
    const day = helpers.integer(data[4], {"substring_start":2,"substring_length":2});
    result.raw.day = day;
    const in_time = helpers.timestampHhmmss(data[5]);
    result.raw.in_time = in_time;
    if (!(["---.-"].includes(data[6]))) {
      const fuel_remaining = helpers.float(data[6]);
      result.raw.fuel_remaining = fuel_remaining;
    }
    ResultFormatter.position(result, position);
    ResultFormatter.departureAirport(result, departure_icao);
    ResultFormatter.arrivalAirport(result, arrival_icao);
    ResultFormatter.timestamp(result, month);
    ResultFormatter.timestamp(result, day);
    ResultFormatter.timestamp(result, in_time);
    ResultFormatter.fuel(result, fuel_remaining);
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}
