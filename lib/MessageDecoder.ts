import {
  DecodeResult,
  DecoderPluginInterface,
  Message,
  Options,
} from './DecoderPluginInterface';

import * as Plugins from './plugins/official';

/**
 * Ordered list of plugin constructors. Order matters — plugins are tried
 * sequentially until one returns decoded: true.
 */
const pluginClasses = [
  Plugins.CBand, // first, for now, so it can wrap other plugins
  Plugins.Arinc702,
  Plugins.Label_ColonComma,
  Plugins.Label_5Z_Slash,
  Plugins.Label_10_LDR,
  Plugins.Label_10_POS,
  Plugins.Label_10_Slash,
  Plugins.Label_12_N_Space,
  Plugins.Label_12_POS,
  Plugins.Label_13Through18_Slash,
  Plugins.Label_15,
  Plugins.Label_15_FST,
  Plugins.Label_16_Honeywell,
  Plugins.Label_16_N_Space,
  Plugins.Label_16_POSA1,
  Plugins.Label_16_TOD,
  Plugins.Label_1L_3Line,
  Plugins.Label_1L_070,
  Plugins.Label_1L_660,
  Plugins.Label_1L_Slash,
  Plugins.Label_20_POS,
  Plugins.Label_21_POS,
  Plugins.Label_22_OFF,
  Plugins.Label_22_POS,
  Plugins.Label_24_Slash,
  Plugins.Label_2P_FM3,
  Plugins.Label_2P_FM4,
  Plugins.Label_2P_FM5,
  Plugins.Label_30_Slash_EA,
  Plugins.Label_44_ETA,
  Plugins.Label_44_IN,
  Plugins.Label_44_OFF,
  Plugins.Label_44_ON,
  Plugins.Label_44_POS,
  Plugins.Label_44_Slash,
  Plugins.Label_4A,
  Plugins.Label_4A_01,
  Plugins.Label_4A_DIS,
  Plugins.Label_4A_DOOR,
  Plugins.Label_4A_Slash_01,
  Plugins.Label_4N,
  Plugins.Label_4T_AGFSR,
  Plugins.Label_4T_ETA,
  Plugins.Label_B6_Forwardslash,
  Plugins.Label_H2_02E,
  Plugins.Label_H1_ATIS,
  Plugins.Label_H1_EZF,
  Plugins.Label_H1_FLR,
  Plugins.Label_H1_M_POS,
  Plugins.Label_H1_OHMA,
  Plugins.Label_H1_OFP,
  Plugins.Label_H1_Paren,
  Plugins.Label_H1_WRN,
  Plugins.Label_H1_StarPOS,
  Plugins.Label_HX,
  Plugins.Label_58,
  Plugins.Label_80,
  Plugins.Label_83,
  Plugins.Label_8E,
  Plugins.Label_1M_Slash,
  Plugins.Label_MA,
  Plugins.Label_SQ,
  Plugins.Label_QP,
  Plugins.Label_QQ,
  Plugins.Label_QR,
  Plugins.Label_QS,
];

/**
 * Per-plugin metadata captured at registration time so that decode() can
 * avoid re-invoking plugin.qualifiers() (and re-allocating its arrays) on
 * every message.
 */
interface PluginEntry {
  plugin: DecoderPluginInterface;
  preambles: string[] | undefined;
}

export class MessageDecoder {
  name: string;
  plugins: Array<DecoderPluginInterface>;
  debug: boolean;

  /** Maps a label string to the candidate entries (wildcard + label-specific) in registration order. */
  private candidatesByLabel: Map<string, PluginEntry[]> = new Map();
  /** Wildcard entries (plugins that register the '*' label). */
  private wildcardEntries: PluginEntry[] = [];
  /** Membership set for wildcard entries to dedupe when a plugin also registers a specific label. */
  private wildcardSet: Set<DecoderPluginInterface> = new Set();

  constructor() {
    this.name = 'acars-decoder-typescript';
    this.plugins = [];
    this.debug = false;

    for (const PluginClass of pluginClasses) {
      this.registerPlugin(new PluginClass(this));
    }
  }

  registerPlugin(plugin: DecoderPluginInterface): boolean {
    this.plugins.push(plugin);

    const qualifiers = plugin.qualifiers();
    const entry: PluginEntry = {
      plugin,
      preambles:
        qualifiers.preambles && qualifiers.preambles.length > 0
          ? qualifiers.preambles
          : undefined,
    };

    for (const label of qualifiers.labels) {
      if (label === '*') {
        if (!this.wildcardSet.has(plugin)) {
          this.wildcardEntries.push(entry);
          this.wildcardSet.add(plugin);
          // Insert the new wildcard at the end of the wildcard section
          // in every existing label bucket so that wildcard plugins are
          // still tried before label-specific ones while preserving
          // registration order among wildcard plugins (matching how new
          // buckets are seeded via wildcardEntries.slice() below).
          const wildcardInsertIndex = this.wildcardEntries.length - 1;
          for (const bucket of this.candidatesByLabel.values()) {
            bucket.splice(wildcardInsertIndex, 0, entry);
          }
        }
      } else {
        let bucket = this.candidatesByLabel.get(label);
        if (!bucket) {
          // Seed new bucket with all wildcard entries (in registration order)
          // so they remain ahead of label-specific plugins.
          bucket = this.wildcardEntries.slice();
          this.candidatesByLabel.set(label, bucket);
        }
        // Skip if this plugin is a wildcard plugin already in the bucket.
        if (!this.wildcardSet.has(plugin)) {
          bucket.push(entry);
        }
      }
    }

    return true;
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const text = message.text;
    const candidates =
      this.candidatesByLabel.get(message.label) ?? this.wildcardEntries;

    if (options.debug) {
      console.log('Usable plugins');
      console.log(
        candidates
          .filter((e) => this.matchesPreambles(text, e.preambles))
          .map((e) => e.plugin),
      );
    }

    let result: DecodeResult = {
      decoded: false,
      error: 'No known decoder plugin for this message',
      decoder: {
        name: 'none',
        type: 'none',
        decodeLevel: 'none',
      },
      message: message,
      remaining: {
        text: text,
      },
      raw: {},
      formatted: {
        description: 'Not Decoded',
        items: [],
      },
    };

    for (let i = 0; i < candidates.length; i++) {
      const entry = candidates[i];
      if (!this.matchesPreambles(text, entry.preambles)) {
        continue;
      }
      result = entry.plugin.decode(message, options);
      if (result.decoded) {
        break;
      }
    }

    if (options.debug) {
      console.log('Result');
      console.log(result);
    }

    return result;
  }

  private matchesPreambles(
    text: string,
    preambles: string[] | undefined,
  ): boolean {
    if (!preambles) {
      return true;
    }
    for (let i = 0; i < preambles.length; i++) {
      if (text.startsWith(preambles[i])) {
        return true;
      }
    }
    return false;
  }
}
