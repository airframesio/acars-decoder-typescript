// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/SQ.yaml. Do not edit.
// Plugin: Label_SQ

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_SQ extends DecoderPlugin {
  name = "label-sq";

  qualifiers() {
    return {
      labels: ["SQ"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Ground Station Squitter");

    return hatches.label_sq_dispatch(this, message, result, options);
  }
}
