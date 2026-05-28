// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/HX.yaml. Do not edit.
// Plugin: Label_HX

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_HX extends DecoderPlugin {
  name = "label-hx";

  qualifiers() {
    return {
      labels: ["HX"],
      preambles: ["RA FMT LOCATION","RA FMT 43"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Undelivered Uplink Report");

    return hatches.label_hx_dispatch(this, message, result, options);
  }
}
