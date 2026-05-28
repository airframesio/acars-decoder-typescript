// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/B6/Forwardslash.yaml. Do not edit.
// Plugin: Label_B6_Forwardslash

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_B6_Forwardslash extends DecoderPlugin {
  name = "label-b6-forwardslash";

  qualifiers() {
    return {
      labels: ["B6"],
      preambles: ["/"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "CPDLC Message");

    return hatches.label_b6_forwardslash_parse(this, message, result, options);
  }
}
