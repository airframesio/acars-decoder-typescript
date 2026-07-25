/**
 * Shared-corpus parity test.
 *
 * Walks vendor/airframes-decoder/corpus/**\/*.json — golden (input → expected)
 * pairs extracted from this repo's own test suite while the hand-written
 * plugins were still registered — and asserts that today's decoder (the
 * ADS-generated tree) produces byte-identical output.
 *
 * This is the same corpus the Rust and C implementations run in Stage 3;
 * any cross-language divergence shows up as a diff against these fixtures.
 *
 * Dispatch note: samples were extracted by calling each plugin's decode()
 * directly, so the test routes each input to the plugin named in
 * expected.decoder.name rather than through MessageDecoder's dispatch
 * order (a wildcard plugin like CBand could otherwise shadow a sample).
 *
 * Comparison note: the extractor serialized results with JSON.stringify,
 * which drops undefined fields and turns NaN into null. The actual result
 * is passed through the same JSON round-trip before comparing so the
 * semantics match exactly.
 */
import * as fs from 'fs';
import * as path from 'path';
import { MessageDecoder } from './MessageDecoder';
import { DecoderPluginInterface } from './DecoderPluginInterface';

const CORPUS_ROOT = path.join(__dirname, '..', 'vendor', 'airframes-decoder', 'corpus');

interface CorpusSample {
  spec: string;
  source?: string;
  description?: string;
  input: { label: string; sublabel?: string; text: string };
  expected: {
    decoded: boolean;
    decoder: { name: string; type: string; decodeLevel: string };
    formatted?: unknown;
    raw?: unknown;
    remaining?: unknown;
  };
}

function walkJson(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) out.push(...walkJson(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out;
}

const sampleFiles = fs.existsSync(CORPUS_ROOT) ? walkJson(CORPUS_ROOT) : [];

describe('shared corpus', () => {
  const decoder = new MessageDecoder();
  const byName = new Map<string, DecoderPluginInterface>();
  for (const plugin of decoder.plugins) {
    byName.set((plugin as unknown as { name: string }).name, plugin);
  }

  test('corpus is present (submodule initialized)', () => {
    expect(sampleFiles.length).toBeGreaterThan(0);
  });

  for (const file of sampleFiles) {
    const rel = path.relative(CORPUS_ROOT, file);
    const sample: CorpusSample = JSON.parse(fs.readFileSync(file, 'utf8'));

    test(`${rel} (${sample.expected.decoder.name})`, () => {
      const plugin = byName.get(sample.expected.decoder.name);
      expect(plugin).toBeDefined();

      const result = plugin!.decode(
        {
          label: sample.input.label,
          sublabel: sample.input.sublabel,
          text: sample.input.text,
        },
        {},
      );

      // Mirror the extractor's JSON.stringify semantics (undefined dropped,
      // NaN → null) so comparisons match how the fixtures were captured.
      const actual = JSON.parse(
        JSON.stringify({
          decoded: result.decoded,
          decoder: result.decoder,
          formatted: result.formatted,
          raw: result.raw,
          remaining: result.remaining,
        }),
      );

      expect(actual).toEqual(sample.expected);
    });
  }
});
