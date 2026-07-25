// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/4T/AGFSR.yaml. Do not edit.
// Plugin: Label_4T_AGFSR

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_4T_AGFSR extends DecoderPlugin {
  name = "label-4t-agfsr";

  qualifiers() {
    return {
      labels: ["4T"],
      preambles: ["AGFSR"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_4t_agfsr_parse(this, message, result, options);
  }
}
