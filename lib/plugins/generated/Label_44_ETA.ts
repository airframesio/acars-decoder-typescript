// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/44/ETA.yaml. Do not edit.
// Plugin: Label_44_ETA

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_44_ETA extends DecoderPlugin {
  name = "label-44-eta";

  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00ETA01","00ETA02","00ETA03","ETA01","ETA02","ETA03"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "ETA Report");

    const data = message.text.split(",");
    if (data.length < 9) {
      return this.failUnknown(result, message.text, options);
    }
    const position = helpers.coordinateDecimalMinutes(data[1], {"style":"combined","format":"NSDDMM_M_EWDDMM_M"});
    const altitude = helpers.integer(data[2], {"multiplier":100});
    const departure_icao = helpers.airport(data[3]);
    const arrival_icao = helpers.airport(data[4]);
    const month = helpers.integer(data[5], {"substring_start":0,"substring_length":2});
    const day = helpers.integer(data[5], {"substring_start":2,"substring_length":2});
    const timestamp = helpers.timestampHhmmss(data[6]);
    const eta_time = helpers.timestampHhmmss(data[7]);
    if (!(["---.-"].includes(data[8]))) {
      const fuel_remaining = helpers.float(data[8]);
    }
    ResultFormatter.position(result, position);
    ResultFormatter.altitude(result, altitude);
    ResultFormatter.departureAirport(result, departure_icao);
    ResultFormatter.arrivalAirport(result, arrival_icao);
    ResultFormatter.timestamp(result, month);
    ResultFormatter.timestamp(result, day);
    ResultFormatter.timestamp(result, timestamp);
    ResultFormatter.timestamp(result, eta_time);
    ResultFormatter.fuel(result, fuel_remaining);
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}
