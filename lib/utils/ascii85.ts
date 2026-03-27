/**
 * Pure JavaScript ASCII85 (Adobe variant) decoder.
 * Replaces the `base85` npm package to eliminate Node.js Buffer dependency.
 * Works in browsers, Node.js 18+, Deno, Bun, and edge runtimes.
 */
export function ascii85Decode(input: string): Uint8Array | null {
  let str = input;
  if (str.startsWith('<~')) str = str.slice(2);
  if (str.endsWith('~>')) str = str.slice(0, -2);
  str = str.replace(/\s/g, '');
  if (str.length === 0) return new Uint8Array(0);

  const output: number[] = [];
  let i = 0;

  while (i < str.length) {
    if (str[i] === 'z') {
      output.push(0, 0, 0, 0);
      i++;
      continue;
    }

    const remaining = str.length - i;
    const chunkLen = Math.min(5, remaining);
    if (chunkLen === 1) break; // trailing single char from truncated input; ignore it

    let padded = str.slice(i, i + chunkLen);
    while (padded.length < 5) padded += 'u';

    let value = 0;
    for (let j = 0; j < 5; j++) {
      const digit = padded.charCodeAt(j) - 33;
      if (digit < 0 || digit > 84) return null;
      value = value * 85 + digit;
    }

    if (chunkLen === 5 && value > 0xffffffff) return null;

    // Use >>> 0 to simulate uint32 overflow for padded groups
    const v = value >>> 0;
    const numBytes = chunkLen === 5 ? 4 : chunkLen - 1;
    if (numBytes >= 1) output.push((v >>> 24) & 0xff);
    if (numBytes >= 2) output.push((v >>> 16) & 0xff);
    if (numBytes >= 3) output.push((v >>> 8) & 0xff);
    if (numBytes >= 4) output.push(v & 0xff);

    i += chunkLen;
  }

  return new Uint8Array(output);
}
