// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/16/POSA1.yaml. Do not edit.
// Plugin: Label_16_POSA1

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_16_POSA1 extends DecoderPlugin {
  name = "label-16-posa1";

  qualifiers() {
    return {
      labels: ["16"],
      preambles: ["POSA1"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_16_posa1_decode(this, message, result, options);
  }
}
