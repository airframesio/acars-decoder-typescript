// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/12/N_Space.yaml. Do not edit.
// Plugin: Label_12_N_Space

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_12_N_Space extends DecoderPlugin {
  name = "label-12-n-space";

  qualifiers() {
    return {
      labels: ["12"],
      preambles: ["N ","S "],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_12_n_space_decode(this, message, result, options);
  }
}
