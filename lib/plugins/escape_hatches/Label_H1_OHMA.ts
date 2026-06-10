import type { DecodeResult } from '@airframes/ads-runtime-ts';

/**
 * Field-level hatch for the OHMA `ohma` field.
 *
 * The legacy plugin stored the inflated JSON text on `decodeResult.raw.ohma`
 * and pushed a pretty-printed version into `formatted.items`. The DSL
 * pipeline puts the inflated JSON text into `$json_text`, so the field
 * hatch's only job is to pass it through (the formatter hatch handles
 * the pretty-printing).
 */
export function ohma_unwrap_message(value: unknown, _args: Record<string, unknown>): unknown {
  // Preserve original behavior: raw.ohma is the raw inflated JSON text.
  return typeof value === 'string' ? value : String(value);
}

/**
 * Formatter-level hatch for the OHMA Downlink item.
 *
 * Re-derives the formatted string from `result.raw.ohma` using the same
 * two-stage JSON unwrap the legacy plugin used:
 *   1. Parse the outer envelope, take `.message` (fall back to raw text).
 *   2. Parse that as JSON, then JSON.stringify(_, null, 2) for display
 *      (fall back to the unwrapped string).
 */
export function ohma_message_item(result: DecodeResult): void {
  const jsonText = typeof result.raw.ohma === 'string' ? result.raw.ohma : String(result.raw.ohma ?? '');

  let jsonMessage: string;
  try {
    jsonMessage = JSON.parse(jsonText).message;
  } catch {
    jsonMessage = jsonText;
  }

  let formattedMsg: string;
  try {
    const ohmaMsg = JSON.parse(jsonMessage);
    formattedMsg = JSON.stringify(ohmaMsg, null, 2);
  } catch {
    formattedMsg = jsonMessage;
  }

  result.formatted.items.push({
    type: 'ohma',
    code: 'OHMA',
    label: 'OHMA Downlink',
    value: formattedMsg,
  });
}
