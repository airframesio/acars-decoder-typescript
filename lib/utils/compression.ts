import * as pako from 'pako';

/**
 * Inflate compressed data with support for partial/truncated streams.
 * Uses Z_SYNC_FLUSH to extract as much data as possible, even from
 * incomplete deflate streams. Captures output via onData callback.
 *
 * @param data - The compressed input bytes
 * @param raw - If true, use raw deflate (no zlib header); if false, expect zlib header
 * @returns The decompressed bytes, or undefined if no output was produced
 */
export function inflateData(
  data: Uint8Array,
  raw: boolean,
): Uint8Array | undefined {
  const chunks: Uint8Array[] = [];
  const inflator = new pako.Inflate({ windowBits: raw ? -15 : 15 });
  inflator.onData = (chunk: Uint8Array) => {
    chunks.push(chunk);
  };
  inflator.push(data, 2); // Z_SYNC_FLUSH

  if (chunks.length === 0) return undefined;
  if (chunks.length === 1) return chunks[0];

  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Decode a base64 or base64url string to Uint8Array.
 * Handles missing padding and converts base64url chars (- and _) to
 * standard base64 chars (+ and /), matching Buffer.from(str, 'base64') behavior.
 *
 * @param base64 - The base64 or base64url encoded string
 * @returns The decoded bytes
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/[^A-Za-z0-9+/]/g, '');
  const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
