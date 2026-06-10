// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/22/POS.yaml. Do not edit.
// Plugin: Label_22_POS

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_22_POS extends DecoderPlugin {
  name = "label-22-pos";

  qualifiers() {
    return {
      labels: ["22"],
      preambles: ["N","S"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_22_pos_decode(this, message, result, options);
  }
}
