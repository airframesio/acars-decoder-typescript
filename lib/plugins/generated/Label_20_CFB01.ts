// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/20/CFB01.yaml. Do not edit.
// Plugin: Label_20_CFB01

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_20_CFB01 extends DecoderPlugin {
  name = "label-20-cfb01";

  qualifiers() {
    return {
      labels: ["20"],
      preambles: ["#CFB.01"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Crew Flight Bag Message");

    return hatches.label_20_cfb01_decode(this, message, result, options);
  }
}
