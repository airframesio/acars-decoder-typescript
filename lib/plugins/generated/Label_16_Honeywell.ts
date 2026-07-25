// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/16/Honeywell.yaml. Do not edit.
// Plugin: Label_16_Honeywell

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_16_Honeywell extends DecoderPlugin {
  name = "label-16-honeywell";

  qualifiers() {
    return {
      labels: ["16"],
      preambles: ["(2"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_16_honeywell_decode(this, message, result, options);
  }
}
