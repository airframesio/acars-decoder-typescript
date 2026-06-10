// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/1M/Slash.yaml. Do not edit.
// Plugin: Label_1M_Slash

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_1M_Slash extends DecoderPlugin {
  name = "label-1m-slash";

  qualifiers() {
    return {
      labels: ["1M"],
      preambles: ["/"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "ETA Report");

    return hatches.label_1m_slash_decode(this, message, result, options);
  }
}
