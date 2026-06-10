// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/H1/EZF.yaml. Do not edit.
// Plugin: Label_H1_EZF

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_H1_EZF extends DecoderPlugin {
  name = "label-h1-ezf";

  qualifiers() {
    return {
      labels: ["H1","1M"],
      preambles: ["EZF"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Load Sheet");

    return hatches.label_h1_ezf_parse(this, message, result, options);
  }
}
