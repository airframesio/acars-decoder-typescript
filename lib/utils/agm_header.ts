import { DecodeResult } from '../DecoderPluginInterface';
import { ResultFormatter } from './result_formatter';

// Ground uplinks on label C1 start with a Type B style header:
// '.TULYVAA 220448\r\nAGM\r\nAN N777AN/FI AA0006\r\n-   FPR\r\n...'
// (lines sometimes indented with a tab). splitAgmHeader returns the body
// lines after the '-' line, or the text's lines when there is no header,
// and adds the aircraft and flight of the AN line to the result.
const AGM_HEADER_REGEX =
  /^\.([A-Z0-9]{7}) (\d{6})\r?\n\t?AGM\r?\n\t?AN ([^\r\n]*)\r?\n\t?-\s*/;

export function splitAgmHeader(
  text: string,
  results: DecodeResult,
): string[] | undefined {
  const m = AGM_HEADER_REGEX.exec(text);
  if (!m) {
    return undefined;
  }
  ResultFormatter.groundAddress(results, m[1]);
  ResultFormatter.unknown(results, m[2], ' ');
  for (const field of m[3].trim().split('/')) {
    if (field.startsWith('FI ')) {
      ResultFormatter.flightNumber(results, field.substring(3).trim());
    } else if (/^[A-Z0-9-]{3,8}$/.test(field)) {
      ResultFormatter.tail(results, field);
    } else if (field) {
      ResultFormatter.unknown(results, field, '/');
    }
  }
  return text
    .substring(m[0].length)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\t/, ''));
}
