// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/4A/Slash_01.yaml. Do not edit.
// Plugin: Label_4A_Slash_01

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_4A_Slash_01 extends DecoderPlugin {
  name = "label-4a-slash-01";

  qualifiers() {
    return {
      labels: ["4A"],
      preambles: ["/01"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Latest New Format");

    return hatches.label_4a_slash_01_decode(this, message, result, options);
  }
}
