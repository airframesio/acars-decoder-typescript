// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/44/ON.yaml. Do not edit.
// Plugin: Label_44_ON

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_44_ON extends DecoderPlugin {
  name = "label-44-on";

  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00ON01","00ON02","00ON03","ON01","ON02","ON03"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "On Runway Report");

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
    const on_time = helpers.timestampHhmmss(data[5]);
    result.raw.on_time = on_time;
    if (!(["---.-"].includes(data[6]))) {
      const fuel_remaining = helpers.float(data[6]);
      result.raw.fuel_remaining = fuel_remaining;
    }
    ResultFormatter.position(result, position);
    ResultFormatter.departureAirport(result, departure_icao);
    ResultFormatter.arrivalAirport(result, arrival_icao);
    ResultFormatter.timestamp(result, month);
    ResultFormatter.timestamp(result, day);
    ResultFormatter.timestamp(result, on_time);
    ResultFormatter.fuel(result, fuel_remaining);
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}
