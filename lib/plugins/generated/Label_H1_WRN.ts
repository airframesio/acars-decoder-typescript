// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/H1/WRN.yaml. Do not edit.
// Plugin: Label_H1_WRN

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_H1_WRN extends DecoderPlugin {
  name = "label-h1-wrn";

  qualifiers() {
    return {
      labels: ["H1"],
      preambles: ["WRN","#CFBWRN"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Warning Message");

    return hatches.label_h1_wrn_parse(this, message, result, options);
  }
}
