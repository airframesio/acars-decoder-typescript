// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/H1/Paren.yaml. Do not edit.
// Plugin: Label_H1_Paren

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_H1_Paren extends DecoderPlugin {
  name = "label-h1-paren";

  qualifiers() {
    return {
      labels: ["H1"],
      preambles: ["("],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_h1_paren_parse(this, message, result, options);
  }
}
