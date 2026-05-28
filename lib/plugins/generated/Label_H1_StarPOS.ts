// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/H1/StarPOS.yaml. Do not edit.
// Plugin: Label_H1_StarPOS

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_H1_StarPOS extends DecoderPlugin {
  name = "label-h1-starpos";

  qualifiers() {
    return {
      labels: ["H1"],
      preambles: ["*POS"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    return hatches.label_h1_starpos_parse(this, message, result, options);
  }
}
