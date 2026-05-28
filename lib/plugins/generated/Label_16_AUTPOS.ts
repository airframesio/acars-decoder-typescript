// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/16/AUTPOS.yaml. Do not edit.
// Plugin: Label_16_AUTPOS

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_16_AUTPOS extends DecoderPlugin {
  name = "label-16-autpos";

  qualifiers() {
    return {
      labels: ["16"],
      preambles: [""],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_16_autpos_decode(this, message, result, options);
  }
}
