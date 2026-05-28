// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/wildcards/arinc_702.yaml. Do not edit.
// Plugin: ARINC_702
// Docs: https://github.com/airframesio/acars-message-documentation/blob/main/research/ARINC_702.md

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class ARINC_702 extends DecoderPlugin {
  name = "arinc-702";

  qualifiers() {
    return {
      labels: ["*"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "ARINC 702 Message");

    return hatches.arinc_702_dispatch(this, message, result, options);
  }
}
