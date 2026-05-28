// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/H1/FLR.yaml. Do not edit.
// Plugin: Label_H1_FLR

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_H1_FLR extends DecoderPlugin {
  name = "label-h1-flr";

  qualifiers() {
    return {
      labels: ["H1"],
      preambles: ["FLR","#CFBFLR"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Fault Log Report");

    return hatches.label_h1_flr_parse(this, message, result, options);
  }
}
