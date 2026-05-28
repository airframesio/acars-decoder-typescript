// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/15/Paren2.yaml. Do not edit.
// Plugin: Label_15

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_15 extends DecoderPlugin {
  name = "label-15";

  qualifiers() {
    return {
      labels: ["15"],
      preambles: ["(2"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_15_decode(this, message, result, options);
  }
}
