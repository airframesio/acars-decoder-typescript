// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/4A.yaml. Do not edit.
// Plugin: Label_4A
// Docs: https://github.com/airframesio/acars-message-documentation/blob/main/research/4A/README.md

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_4A extends DecoderPlugin {
  name = "label-4a";

  qualifiers() {
    return {
      labels: ["4A"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Latest New Format");

    const fields = message.text.split(",");
    if (fields.length === 11) {
      const timestamp = helpers.timestampHhmmss(fields[0]);
      result.raw.timestamp = timestamp;
      const tail = helpers.tailNumber(fields[2], {"strip_chars":"."});
      result.raw.tail = tail;
      let callsign;
      if (fields[3] !== "") {
        callsign = helpers.callsign(fields[3]);
        result.raw.callsign = callsign;
      }
      const departure_icao = helpers.airport(fields[4]);
      result.raw.departure_icao = departure_icao;
      const arrival_icao = helpers.airport(fields[5]);
      result.raw.arrival_icao = arrival_icao;
    }
    else if ((fields.length === 6) && (new RegExp("^[NS]").test(fields[0]))) {
      const variant_2_result = hatches.label_4a_variant_2_decode(fields, {});
      result.raw.variant_2_result = variant_2_result;
    }
    else if (fields.length === 6) {
      const timestamp = helpers.timestampHhmmss(fields[0]);
      result.raw.timestamp = timestamp;
      const eta = helpers.timestampHhmmss(fields[1]);
      result.raw.eta = eta;
      const altitude = helpers.integer(fields[3]);
      result.raw.altitude = altitude;
      const position = hatches.label_4a_variant_3_position(fields, {});
      result.raw.position = position;
    }
    else {
      return this.failUnknown(result, message.text, options);
    }
    hatches.label_4a_format(result);
    this.setDecodeLevel(result, true, 'partial');
    return result;
  }
}
