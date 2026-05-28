// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/22/OFF.yaml. Do not edit.
// Plugin: Label_22_OFF

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_22_OFF extends DecoderPlugin {
  name = "label-22-off";

  qualifiers() {
    return {
      labels: ["22"],
      preambles: ["OFF"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Takeoff Report");

    return hatches.label_22_off_decode(this, message, result, options);
  }
}
