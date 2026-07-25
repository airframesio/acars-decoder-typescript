// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/H2/02E.yaml. Do not edit.
// Plugin: Label_H2_02E

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_H2_02E extends DecoderPlugin {
  name = "label-h2-02e";

  qualifiers() {
    return {
      labels: ["H2"],
      preambles: ["02E"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Weather Report");

    return hatches.label_h2_02e_dispatch(this, message, result, options);
  }
}
