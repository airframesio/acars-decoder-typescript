// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/30/Slash_EA.yaml. Do not edit.
// Plugin: Label_30_Slash_EA

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_30_Slash_EA extends DecoderPlugin {
  name = "label-30-slash-ea";

  qualifiers() {
    return {
      labels: ["30"],
      preambles: ["/EA"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "ETA Report");

    return hatches.label_30_slash_ea_decode(this, message, result, options);
  }
}
