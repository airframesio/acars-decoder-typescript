// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/2P/FM3.yaml. Do not edit.
// Plugin: Label_2P_FM3

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_2P_FM3 extends DecoderPlugin {
  name = "label-2p-fm3";

  qualifiers() {
    return {
      labels: ["2P"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Flight Report");

    return hatches.label_2p_fm3_decode(this, message, result, options);
  }
}
