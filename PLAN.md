# Architecture & Performance Improvement Plan

## 1. Reduce Decoder Boilerplate with Base Class Helpers

**Problem:** Every decoder repeats the same 3-line initialization and decode-level determination logic.

**Solution:** Add helper methods to `DecoderPlugin` base class:

```typescript
// In DecoderPlugin.ts
protected initResult(message: Message, description: string): DecodeResult {
  const result = this.defaultResult();
  result.decoder.name = this.name;
  result.formatted.description = description;
  result.message = message;
  return result;
}

protected setDecodeLevel(result: DecodeResult, decoded: boolean, level?: 'full' | 'partial'): void {
  result.decoded = decoded;
  result.decoder.decodeLevel = decoded ? (level ?? (result.remaining.text ? 'partial' : 'full')) : 'none';
}
```

Then update all 68 plugins to use `this.initResult()` and `this.setDecodeLevel()` instead of the repeated boilerplate. This removes ~3-6 lines per plugin (~300 lines total).

## 2. Extract Common CSV-Parsing Base for Label_44 Family

**Problem:** `Label_44_ON`, `Label_44_OFF`, `Label_44_IN`, `Label_44_ETA` all follow the same pattern: split on comma, validate field count, parse position from field 1, airports from fields 2-3, date from field 4, a time event from field 5, and fuel from the end.

**Solution:** Create `Label_44_Base` that handles the shared structure:

```typescript
// lib/plugins/Label_44_Base.ts
export abstract class Label_44_Base extends DecoderPlugin {
  abstract get description(): string;
  abstract get minFields(): number;
  abstract decodeFields(result: DecodeResult, data: string[], options: Options): void;

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, this.description);
    const data = message.text.split(',');
    if (data.length < this.minFields) {
      return this.failUnknown(result, message.text, options);
    }
    // Common: position, airports, date
    ResultFormatter.position(result, CoordinateUtils.decodeStringCoordinatesDecimalMinutes(data[1]));
    ResultFormatter.departureAirport(result, data[2]);
    ResultFormatter.arrivalAirport(result, data[3]);
    ResultFormatter.month(result, Number(data[4].substring(0, 2)));
    ResultFormatter.day(result, Number(data[4].substring(2, 4)));
    // Subclass-specific fields
    this.decodeFields(result, data, options);
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}
```

Each Label_44 variant becomes ~15 lines instead of ~65.

## 3. Add Debug Logging & Error Helpers to Base Class

**Problem:** `if (options.debug) { console.log(...) }` appears 100+ times. The "fail unknown" pattern (5-6 lines) appears 50+ times.

**Solution:** Add to `DecoderPlugin`:

```typescript
protected debug(options: Options, ...args: unknown[]): void {
  if (options.debug) {
    console.log(`[${this.name}]`, ...args);
  }
}

protected failUnknown(result: DecodeResult, text: string, options: Options): DecodeResult {
  this.debug(options, `Unknown message: ${text}`);
  ResultFormatter.unknown(result, text);
  result.decoded = false;
  result.decoder.decodeLevel = 'none';
  return result;
}
```

## 4. Plugin Auto-Registration via Decorator/Convention

**Problem:** `MessageDecoder` constructor has 67 manually written `registerPlugin()` calls. Adding a new plugin requires editing two files (plugin + MessageDecoder).

**Solution:** Use the existing `official.ts` barrel file to export a `plugins` array, and auto-register in the constructor:

```typescript
// lib/plugins/official.ts - add at bottom
export const allPlugins = [CBand, Arinc702, Label_ColonComma, ...];

// lib/MessageDecoder.ts
constructor() {
  this.plugins = [];
  for (const Plugin of Plugins.allPlugins) {
    this.registerPlugin(new Plugin(this));
  }
}
```

This keeps ordering explicit but eliminates the repetitive `registerPlugin` calls.

## 5. Optimize Plugin Matching with Label Index

**Problem:** `MessageDecoder.decode()` iterates ALL plugins to find matches via `.filter()` on every message. With 85 plugins, this is O(n) per decode.

**Solution:** Build a label-to-plugins index at registration time:

```typescript
private labelIndex: Map<string, DecoderPluginInterface[]> = new Map();
private wildcardPlugins: DecoderPluginInterface[] = [];

registerPlugin(plugin: DecoderPluginInterface): boolean {
  this.plugins.push(plugin);
  const qualifiers = plugin.qualifiers();
  for (const label of qualifiers.labels) {
    if (label === '*') {
      this.wildcardPlugins.push(plugin);
    } else {
      if (!this.labelIndex.has(label)) this.labelIndex.set(label, []);
      this.labelIndex.get(label)!.push(plugin);
    }
  }
  return true;
}

decode(message: Message, options: Options = {}): DecodeResult {
  const candidates = [
    ...(this.labelIndex.get(message.label) ?? []),
    ...this.wildcardPlugins,
  ];
  const usablePlugins = candidates.filter(plugin => {
    const preambles = plugin.qualifiers().preambles;
    if (!preambles || preambles.length === 0) return true;
    return preambles.some(p => message.text.startsWith(p));
  });
  // ... rest unchanged
}
```

This reduces decode from O(85) to O(k) where k is the number of plugins for that label (typically 1-5).

## 6. Type-Safe `raw` Field on DecodeResult

**Problem:** `raw: any` loses all type safety. Plugins set arbitrary properties with no compile-time checking.

**Solution:** Define a typed interface for the raw field:

```typescript
export interface RawFields {
  position?: { latitude: number; longitude: number };
  altitude?: number;
  departure_icao?: string;
  arrival_icao?: string;
  departure_iata?: string;
  arrival_iata?: string;
  fuel_on_board?: number;
  fuel_remaining?: number;
  // ... all fields used by ResultFormatter
  [key: string]: unknown; // escape hatch for plugin-specific fields
}
```

This gives autocomplete and type checking while remaining backward-compatible via the index signature.

## 7. Pass `options` Through Plugin.decode() Consistently

**Problem:** The `DecoderPluginInterface.decode()` signature is `decode(message: Message): DecodeResult` but every implementation accepts `options: Options = {}`. The `MessageDecoder.decode()` receives options but never passes them to plugins (`result = plugin.decode(message)` on line 143).

**Solution:**
- Update `DecoderPluginInterface` to `decode(message: Message, options?: Options): DecodeResult`
- Update `MessageDecoder.decode()` to pass options: `result = plugin.decode(message, options)`

This fixes the bug where debug mode doesn't actually work in any plugin when called via `MessageDecoder`.

## Summary of Changes

| Change | Impact | Risk | Files Changed |
|--------|--------|------|---------------|
| 1. Base class helpers | ~300 LOC reduction | Low | DecoderPlugin.ts + all plugins |
| 2. Label_44_Base | ~200 LOC reduction | Low | 4 Label_44 plugins + new base |
| 3. Debug/error helpers | ~200 LOC reduction | Low | DecoderPlugin.ts + all plugins |
| 4. Auto-registration | ~65 LOC reduction | Low | MessageDecoder.ts + official.ts |
| 5. Label index | Performance (O(n) → O(k)) | Low | MessageDecoder.ts |
| 6. Typed raw field | Type safety | Low (backward-compat) | DecoderPluginInterface.ts |
| 7. Pass options to plugins | Bug fix | Low | DecoderPluginInterface.ts + MessageDecoder.ts |

## Implementation Order

1. **#7** (bug fix - options not passed) — small, high-value fix
2. **#1 + #3** (base class helpers) — foundation for other changes
3. **#5** (label index) — performance win, independent of other changes
4. **#2** (Label_44_Base) — demonstrates the pattern for other families
5. **#6** (typed raw) — type safety improvement
6. **#4** (auto-registration) — cleanup
