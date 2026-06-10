// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/5Z/Slash.yaml. Do not edit.
// Plugin: Label_5Z_Slash

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_5Z_Slash extends DecoderPlugin {
  name = "label-5z-slash";

  qualifiers() {
    return {
      labels: ["5Z"],
      preambles: ["/"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Airline Designated Downlink");

    return hatches.label_5z_slash_parse(this, message, result, options);
  }
}
