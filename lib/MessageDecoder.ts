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
  Plugins.Label_3L_Position,
];

export class MessageDecoder {
  name: string;
  plugins: Array<DecoderPluginInterface>;
  debug: boolean;

  /** Maps a label string to the plugins registered for it, preserving registration order. */
  private labelIndex: Map<string, DecoderPluginInterface[]> = new Map();
  /** Plugins that match all labels (qualifier label '*'). */
  private wildcardPlugins: DecoderPluginInterface[] = [];

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
    for (const label of qualifiers.labels) {
      if (label === '*') {
        this.wildcardPlugins.push(plugin);
      } else {
        let bucket = this.labelIndex.get(label);
        if (!bucket) {
          bucket = [];
          this.labelIndex.set(label, bucket);
        }
        bucket.push(plugin);
      }
    }

    return true;
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    // Build candidate list: wildcard plugins first (e.g. CBand wrapper),
    // then label-specific plugins, preserving registration order.
    // Use a Set to prevent duplicate execution if a plugin registers both '*' and a specific label.
    const labelPlugins = this.labelIndex.get(message.label) ?? [];
    const seen = new Set<DecoderPluginInterface>();
    const candidates: DecoderPluginInterface[] = [];
    for (const plugin of [...this.wildcardPlugins, ...labelPlugins]) {
      if (!seen.has(plugin)) {
        seen.add(plugin);
        candidates.push(plugin);
      }
    }

    const usablePlugins = candidates.filter((plugin) => {
      const preambles = plugin.qualifiers().preambles;
      if (!preambles || preambles.length === 0) {
        return true;
      }
      return preambles.some((p: string) => message.text.startsWith(p));
    });

    if (options.debug) {
      console.log('Usable plugins');
      console.log(usablePlugins);
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
        text: message.text,
      },
      raw: {},
      formatted: {
        description: 'Not Decoded',
        items: [],
      },
    };

    for (let i = 0; i < usablePlugins.length; i++) {
      const plugin = usablePlugins[i];
      result = plugin.decode(message, options);
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
}
