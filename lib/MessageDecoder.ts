import {
  DecodeResult,
  DecoderPluginInterface,
  Message,
  Options,
} from './DecoderPluginInterface';

import * as Plugins from './plugins/official';

// Stage 2.5 bulk swap: most plugins now run through the ADS-generated tree
// (lib/plugins/generated/*) backed by the escape-hatch implementations in
// lib/plugins/escape_hatches/*. Behavior is byte-for-byte identical against
// the existing test suite.
//
// Two plugins are intentionally kept hand-written:
//   - Plugins.Label_4A          — agent stubbed; field-level hatches need
//                                 design work (variant_2_decode / variant_3_position
//                                 + format hatch contract).
//   - Plugins.Label_44_POS      — spec uses field-level customs
//                                 (parse_flight_level_or_ground +
//                                 flight_level_to_altitude_feet) that no agent
//                                 implemented in this bulk pass.
// Both are scheduled for follow-up.
import { Label_10_LDR as Gen_Label_10_LDR } from './plugins/generated/Label_10_LDR';
import { Label_10_POS as Gen_Label_10_POS } from './plugins/generated/Label_10_POS';
import { Label_10_Slash as Gen_Label_10_Slash } from './plugins/generated/Label_10_Slash';
import { Label_12_N_Space as Gen_Label_12_N_Space } from './plugins/generated/Label_12_N_Space';
import { Label_12_POS as Gen_Label_12_POS } from './plugins/generated/Label_12_POS';
import { Label_13Through18_Slash as Gen_Label_13Through18_Slash } from './plugins/generated/Label_13Through18_Slash';
import { Label_15 as Gen_Label_15 } from './plugins/generated/Label_15';
import { Label_15_FST as Gen_Label_15_FST } from './plugins/generated/Label_15_FST';
import { Label_16_AUTPOS as Gen_Label_16_AUTPOS } from './plugins/generated/Label_16_AUTPOS';
import { Label_16_Honeywell as Gen_Label_16_Honeywell } from './plugins/generated/Label_16_Honeywell';
import { Label_16_N_Space as Gen_Label_16_N_Space } from './plugins/generated/Label_16_N_Space';
import { Label_16_POSA1 as Gen_Label_16_POSA1 } from './plugins/generated/Label_16_POSA1';
import { Label_16_TOD as Gen_Label_16_TOD } from './plugins/generated/Label_16_TOD';
import { Label_1L_070 as Gen_Label_1L_070 } from './plugins/generated/Label_1L_070';
import { Label_1L_3Line as Gen_Label_1L_3Line } from './plugins/generated/Label_1L_3Line';
import { Label_1L_660 as Gen_Label_1L_660 } from './plugins/generated/Label_1L_660';
import { Label_1L_Slash as Gen_Label_1L_Slash } from './plugins/generated/Label_1L_Slash';
import { Label_1M_Slash as Gen_Label_1M_Slash } from './plugins/generated/Label_1M_Slash';
import { Label_20_CFB01 as Gen_Label_20_CFB01 } from './plugins/generated/Label_20_CFB01';
import { Label_20_POS as Gen_Label_20_POS } from './plugins/generated/Label_20_POS';
import { Label_21_POS as Gen_Label_21_POS } from './plugins/generated/Label_21_POS';
import { Label_22_OFF as Gen_Label_22_OFF } from './plugins/generated/Label_22_OFF';
import { Label_22_POS as Gen_Label_22_POS } from './plugins/generated/Label_22_POS';
import { Label_24_Slash as Gen_Label_24_Slash } from './plugins/generated/Label_24_Slash';
import { Label_2P_FM3 as Gen_Label_2P_FM3 } from './plugins/generated/Label_2P_FM3';
import { Label_2P_FM4 as Gen_Label_2P_FM4 } from './plugins/generated/Label_2P_FM4';
import { Label_2P_FM5 as Gen_Label_2P_FM5 } from './plugins/generated/Label_2P_FM5';
import { Label_30_Slash_EA as Gen_Label_30_Slash_EA } from './plugins/generated/Label_30_Slash_EA';
import { Label_44_ETA as Gen_Label_44_ETA } from './plugins/generated/Label_44_ETA';
import { Label_44_IN as Gen_Label_44_IN } from './plugins/generated/Label_44_IN';
import { Label_44_OFF as Gen_Label_44_OFF } from './plugins/generated/Label_44_OFF';
import { Label_44_ON as Gen_Label_44_ON } from './plugins/generated/Label_44_ON';
import { Label_44_Slash as Gen_Label_44_Slash } from './plugins/generated/Label_44_Slash';
import { Label_4A_01 as Gen_Label_4A_01 } from './plugins/generated/Label_4A_01';
import { Label_4A_DIS as Gen_Label_4A_DIS } from './plugins/generated/Label_4A_DIS';
import { Label_4A_DOOR as Gen_Label_4A_DOOR } from './plugins/generated/Label_4A_DOOR';
import { Label_4A_Slash_01 as Gen_Label_4A_Slash_01 } from './plugins/generated/Label_4A_Slash_01';
import { Label_4N as Gen_Label_4N } from './plugins/generated/Label_4N';
import { Label_4T_AGFSR as Gen_Label_4T_AGFSR } from './plugins/generated/Label_4T_AGFSR';
import { Label_4T_ETA as Gen_Label_4T_ETA } from './plugins/generated/Label_4T_ETA';
import { Label_58 as Gen_Label_58 } from './plugins/generated/Label_58';
import { Label_5Z_Slash as Gen_Label_5Z_Slash } from './plugins/generated/Label_5Z_Slash';
import { Label_80 as Gen_Label_80 } from './plugins/generated/Label_80';
import { Label_83 as Gen_Label_83 } from './plugins/generated/Label_83';
import { Label_8E as Gen_Label_8E } from './plugins/generated/Label_8E';
import { Label_B6_Forwardslash as Gen_Label_B6_Forwardslash } from './plugins/generated/Label_B6_Forwardslash';
import { Label_ColonComma as Gen_Label_ColonComma } from './plugins/generated/Label_ColonComma';
import { Label_H1_ATIS as Gen_Label_H1_ATIS } from './plugins/generated/Label_H1_ATIS';
import { Label_H1_EZF as Gen_Label_H1_EZF } from './plugins/generated/Label_H1_EZF';
import { Label_H1_FLR as Gen_Label_H1_FLR } from './plugins/generated/Label_H1_FLR';
import { Label_H1_M_POS as Gen_Label_H1_M_POS } from './plugins/generated/Label_H1_M_POS';
import { Label_H1_OFP as Gen_Label_H1_OFP } from './plugins/generated/Label_H1_OFP';
import { Label_H1_OHMA as Gen_Label_H1_OHMA } from './plugins/generated/Label_H1_OHMA';
import { Label_H1_Paren as Gen_Label_H1_Paren } from './plugins/generated/Label_H1_Paren';
import { Label_H1_StarPOS as Gen_Label_H1_StarPOS } from './plugins/generated/Label_H1_StarPOS';
import { Label_H1_WRN as Gen_Label_H1_WRN } from './plugins/generated/Label_H1_WRN';
import { Label_H2_02E as Gen_Label_H2_02E } from './plugins/generated/Label_H2_02E';
import { Label_HX as Gen_Label_HX } from './plugins/generated/Label_HX';
import { Label_MA as Gen_Label_MA } from './plugins/generated/Label_MA';
import { Label_QP as Gen_Label_QP } from './plugins/generated/Label_QP';
import { Label_QQ as Gen_Label_QQ } from './plugins/generated/Label_QQ';
import { Label_QR as Gen_Label_QR } from './plugins/generated/Label_QR';
import { Label_QS as Gen_Label_QS } from './plugins/generated/Label_QS';
import { Label_SQ as Gen_Label_SQ } from './plugins/generated/Label_SQ';
import { ARINC_702 as Gen_ARINC_702 } from './plugins/generated/ARINC_702';
import { CBand as Gen_CBand } from './plugins/generated/CBand';

/**
 * Ordered list of plugin constructors. Order matters — plugins are tried
 * sequentially until one returns decoded: true.
 */
const pluginClasses = [
  Gen_CBand, // first, for now, so it can wrap other plugins
  Gen_ARINC_702,
  Gen_Label_ColonComma,
  Gen_Label_5Z_Slash,
  Gen_Label_10_LDR,
  Gen_Label_10_POS,
  Gen_Label_10_Slash,
  Gen_Label_12_N_Space,
  Gen_Label_12_POS,
  Gen_Label_13Through18_Slash,
  Gen_Label_15,
  Gen_Label_15_FST,
  Gen_Label_16_AUTPOS,
  Gen_Label_16_Honeywell,
  Gen_Label_16_N_Space,
  Gen_Label_16_POSA1,
  Gen_Label_16_TOD,
  Gen_Label_1L_3Line,
  Gen_Label_1L_070,
  Gen_Label_1L_660,
  Gen_Label_1L_Slash,
  Gen_Label_20_CFB01,
  Gen_Label_20_POS,
  Gen_Label_21_POS,
  Gen_Label_22_OFF,
  Gen_Label_22_POS,
  Gen_Label_24_Slash,
  Gen_Label_2P_FM3,
  Gen_Label_2P_FM4,
  Gen_Label_2P_FM5,
  Gen_Label_30_Slash_EA,
  Gen_Label_44_ETA,
  Gen_Label_44_IN,
  Gen_Label_44_OFF,
  Gen_Label_44_ON,
  Plugins.Label_44_POS, // KEPT: field-level hatches not yet implemented
  Gen_Label_44_Slash,
  Plugins.Label_4A, // KEPT: variant_2_decode + variant_3_position + format hatches stubbed
  Gen_Label_4A_01,
  Gen_Label_4A_DIS,
  Gen_Label_4A_DOOR,
  Gen_Label_4A_Slash_01,
  Gen_Label_4N,
  Gen_Label_4T_AGFSR,
  Gen_Label_4T_ETA,
  Gen_Label_B6_Forwardslash,
  Gen_Label_H2_02E,
  Gen_Label_H1_ATIS,
  Gen_Label_H1_EZF,
  Gen_Label_H1_FLR,
  Gen_Label_H1_M_POS,
  Gen_Label_H1_OHMA,
  Gen_Label_H1_OFP,
  Gen_Label_H1_Paren,
  Gen_Label_H1_WRN,
  Gen_Label_H1_StarPOS,
  Gen_Label_HX,
  Gen_Label_58,
  Gen_Label_80,
  Gen_Label_83,
  Gen_Label_8E,
  Gen_Label_1M_Slash,
  Gen_Label_MA,
  Gen_Label_SQ,
  Gen_Label_QP,
  Gen_Label_QQ,
  Gen_Label_QR,
  Gen_Label_QS,
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
