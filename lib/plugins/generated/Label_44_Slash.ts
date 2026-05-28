// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/44/Slash.yaml. Do not edit.
// Plugin: Label_44_Slash

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_44_Slash extends DecoderPlugin {
  name = "label-44-slash";

  qualifiers() {
    return {
      labels: ["44"],
      preambles: [" /FB"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Flight Briefing");

    return hatches.label_44_slash_decode(this, message, result, options);
  }
}
