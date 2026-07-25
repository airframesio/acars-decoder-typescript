// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/44/OFF.yaml. Do not edit.
// Plugin: Label_44_OFF

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_44_OFF extends DecoderPlugin {
  name = "label-44-off";

  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00OFF01","00OFF02","00OFF03","OFF01","OFF02","OFF03"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Off Runway Report");

    const data = message.text.split(",");
    if (data.length < 8) {
      return this.failUnknown(result, message.text, options);
    }
    const position = helpers.coordinateDecimalMinutes(data[1], {"style":"combined","format":"NSDDMM_M_EWDDMM_M"});
    const departure_icao = helpers.airport(data[2]);
    const arrival_icao = helpers.airport(data[3]);
    const month = helpers.integer(data[4], {"substring_start":0,"substring_length":2});
    const day = helpers.integer(data[4], {"substring_start":2,"substring_length":2});
    const off_time = helpers.timestampHhmmss(data[5]);
    const eta_time = helpers.timestampHhmmss(data[6]);
    let fuel_remaining;
    if (!(["---.-"].includes(data[7]))) {
      fuel_remaining = helpers.float(data[7]);
    }
    ResultFormatter.position(result, position);
    ResultFormatter.departureAirport(result, departure_icao);
    ResultFormatter.arrivalAirport(result, arrival_icao);
    ResultFormatter.month(result, month);
    ResultFormatter.day(result, day);
    ResultFormatter.off(result, off_time);
    ResultFormatter.eta(result, eta_time);
    ResultFormatter.remainingFuel(result, fuel_remaining);
    if (data.length > 8) {
      ResultFormatter.unknownArr(result, data.slice(8));
    }
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}
