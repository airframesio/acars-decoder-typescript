// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/10/LDR.yaml. Do not edit.
// Plugin: Label_10_LDR

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_10_LDR extends DecoderPlugin {
  name = "label-10-ldr";

  qualifiers() {
    return {
      labels: ["10"],
      preambles: ["LDR"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_10_ldr_decode(this, message, result, options);
  }
}
