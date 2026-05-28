// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/10/POS.yaml. Do not edit.
// Plugin: Label_10_POS
// Docs: https://github.com/airframesio/acars-message-documentation/blob/main/research/10/POS.md

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_10_POS extends DecoderPlugin {
  name = "label-10-pos";

  qualifiers() {
    return {
      labels: ["10"],
      preambles: ["POS"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    const parts = message.text.split(",");
    if (parts.length !== 12) {
      return this.failUnknown(result, message.text, options);
    }
    const latitude = helpers.coordinate(parts[1], {"style":"single_axis","axis":"latitude","prefix_chars":["N","S"],"digits":5,"divisor":100});
    result.raw.latitude = latitude;
    const longitude = helpers.coordinate(parts[2], {"style":"single_axis","axis":"longitude","prefix_chars":["E","W"],"digits":5,"divisor":100});
    result.raw.longitude = longitude;
    const altitude = helpers.integer(parts[7]);
    result.raw.altitude = altitude;
    ResultFormatter.position(result, { latitude: latitude, longitude: longitude });
    ResultFormatter.altitude(result, altitude);
    ResultFormatter.unknownArr(result, [parts[0], parts[3], parts[4], parts[5], parts[6], parts[8], parts[9], parts[10], parts[11]]);
    this.setDecodeLevel(result, true, 'partial');
    return result;
  }
}
