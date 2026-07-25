// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/QQ.yaml. Do not edit.
// Plugin: Label_QQ

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_QQ extends DecoderPlugin {
  name = "label-qq";

  qualifiers() {
    return {
      labels: ["QQ"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "OFF Report");

    return hatches.label_qq_dispatch(this, message, result, options);
  }
}
