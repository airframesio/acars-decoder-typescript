// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/wildcards/label_13_18_slash.yaml. Do not edit.
// Plugin: Label_13Through18_Slash

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_13Through18_Slash extends DecoderPlugin {
  name = "label-13through18-slash";

  qualifiers() {
    return {
      labels: ["13","14","15","16","17","18"],
      preambles: ["/"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "OOOI Report");

    return hatches.label_13_18_slash_decode(this, message, result, options);
  }
}
