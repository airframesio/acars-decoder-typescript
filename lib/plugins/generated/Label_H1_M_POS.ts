// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/H1/M_POS.yaml. Do not edit.
// Plugin: Label_H1_M_POS

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_H1_M_POS extends DecoderPlugin {
  name = "label-h1-m-pos";

  qualifiers() {
    return {
      labels: ["H1"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "M-Series Periodic Position Report");

    return hatches.label_h1_m_pos_parse(this, message, result, options);
  }
}
