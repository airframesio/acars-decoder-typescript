// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/ColonComma.yaml. Do not edit.
// Plugin: Label_ColonComma
// Docs: https://github.com/airframesio/acars-message-documentation/blob/main/research/colon_comma/README.md

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_ColonComma extends DecoderPlugin {
  name = "label-colon-comma";

  qualifiers() {
    return {
      labels: [":;"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Aircraft Transceiver Frequency Change");

    return hatches.label_colon_comma_parse(this, message, result, options);
  }
}
