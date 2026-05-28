// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/H1/OHMA.yaml. Do not edit.
// Plugin: Label_H1_OHMA
// Docs: https://github.com/airframesio/acars-message-documentation/blob/main/research/H1/OHMA.md

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_H1_OHMA extends DecoderPlugin {
  name = "label-h1-ohma";

  qualifiers() {
    return {
      labels: ["H1"],
      preambles: ["OHMA","/RTNBOCR.OHMA","#T1B/RTNBOCR.OHMA"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "OHMA Message");

    const ohma_parts = message.text.split("OHMA");
    if (ohma_parts.length < 2) {
      return this.failUnknown(result, message.text, options);
    }
    const deflated_bytes = helpers.base64ToUint8Array(ohma_parts[1]);
    const json_bytes = helpers.inflate(deflated_bytes, "raw");
    const json_text = helpers.textDecode(json_bytes, "utf-8");
    const ohma = hatches.ohma_unwrap_message(json_text, {});
    result.raw.ohma = ohma;
    hatches.ohma_message_item(result);
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}
