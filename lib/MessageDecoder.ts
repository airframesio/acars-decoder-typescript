import {
  DecodeResult,
  DecoderPluginInterface,
  Message,
  Options,
} from './DecoderPluginInterface';

import * as Plugins from './plugins/official';
export class MessageDecoder {
  name: string;
  plugins: Array<DecoderPluginInterface>;
  debug: boolean;

  constructor() {
    this.name = 'acars-decoder-typescript';
    this.plugins = [];
    this.debug = false;

    this.registerPlugin(new Plugins.CBand(this)); // first, for now, so it can wrap other plugins
    this.registerPlugin(new Plugins.Label_ColonComma(this));
    this.registerPlugin(new Plugins.Label_5Z_Slash(this));
    this.registerPlugin(new Plugins.Label_10_LDR(this));
    this.registerPlugin(new Plugins.Label_10_POS(this));
    this.registerPlugin(new Plugins.Label_10_Slash(this));
    this.registerPlugin(new Plugins.Label_12_N_Space(this));
    this.registerPlugin(new Plugins.Label_12_POS(this));
    this.registerPlugin(new Plugins.Label_13Through18_Slash(this));
    this.registerPlugin(new Plugins.Label_15(this));
    this.registerPlugin(new Plugins.Label_15_FST(this));
    this.registerPlugin(new Plugins.Label_16_Honeywell(this));
    this.registerPlugin(new Plugins.Label_16_N_Space(this));
    this.registerPlugin(new Plugins.Label_16_POSA1(this));
    this.registerPlugin(new Plugins.Label_16_TOD(this));
    this.registerPlugin(new Plugins.Label_1J_2J_FTX(this));
    this.registerPlugin(new Plugins.Label_1L_3Line(this));
    this.registerPlugin(new Plugins.Label_1L_070(this));
    this.registerPlugin(new Plugins.Label_1L_660(this));
    this.registerPlugin(new Plugins.Label_1L_Slash(this));
    this.registerPlugin(new Plugins.Label_20_POS(this));
    this.registerPlugin(new Plugins.Label_21_POS(this));
    this.registerPlugin(new Plugins.Label_22_OFF(this));
    this.registerPlugin(new Plugins.Label_22_POS(this));
    this.registerPlugin(new Plugins.Label_24_Slash(this));
    this.registerPlugin(new Plugins.Label_2P_FM3(this));
    this.registerPlugin(new Plugins.Label_2P_FM4(this));
    this.registerPlugin(new Plugins.Label_2P_FM5(this));
    this.registerPlugin(new Plugins.Label_2P_POS(this));
    this.registerPlugin(new Plugins.Label_30_Slash_EA(this));
    this.registerPlugin(new Plugins.Label_44_ETA(this));
    this.registerPlugin(new Plugins.Label_44_IN(this));
    this.registerPlugin(new Plugins.Label_44_OFF(this));
    this.registerPlugin(new Plugins.Label_44_ON(this));
    this.registerPlugin(new Plugins.Label_44_POS(this));
    this.registerPlugin(new Plugins.Label_44_Slash(this));
    this.registerPlugin(new Plugins.Label_4A(this));
    this.registerPlugin(new Plugins.Label_4A_01(this));
    this.registerPlugin(new Plugins.Label_4A_DIS(this));
    this.registerPlugin(new Plugins.Label_4A_DOOR(this));
    this.registerPlugin(new Plugins.Label_4A_Slash_01(this));
    this.registerPlugin(new Plugins.Label_4J_POS(this));
    this.registerPlugin(new Plugins.Label_4N(this));
    this.registerPlugin(new Plugins.Label_4T_AGFSR(this));
    this.registerPlugin(new Plugins.Label_4T_ETA(this));
    this.registerPlugin(new Plugins.Label_B6_Forwardslash(this));
    this.registerPlugin(new Plugins.Label_H2_02E(this));
    this.registerPlugin(new Plugins.Label_H1_FLR(this));
    this.registerPlugin(new Plugins.Label_H1_OHMA(this));
    this.registerPlugin(new Plugins.Label_H1_WRN(this));
    this.registerPlugin(new Plugins.Label_H1(this));
    this.registerPlugin(new Plugins.Label_H1_Slash(this));
    this.registerPlugin(new Plugins.Label_H1_StarPOS(this));
    this.registerPlugin(new Plugins.Label_HX(this));
    this.registerPlugin(new Plugins.Label_58(this));
    this.registerPlugin(new Plugins.Label_80(this));
    this.registerPlugin(new Plugins.Label_83(this));
    this.registerPlugin(new Plugins.Label_8E(this));
    this.registerPlugin(new Plugins.Label_1M_Slash(this));
    this.registerPlugin(new Plugins.Label_MA(this));
    this.registerPlugin(new Plugins.Label_SQ(this));
    this.registerPlugin(new Plugins.Label_QP(this));
    this.registerPlugin(new Plugins.Label_QQ(this));
    this.registerPlugin(new Plugins.Label_QR(this));
    this.registerPlugin(new Plugins.Label_QS(this));
  }

  registerPlugin(plugin: DecoderPluginInterface): boolean {
    // plugin.onRegister(this.store);
    this.plugins.push(plugin);
    return true;
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const usablePlugins = this.plugins.filter((plugin) => {
      const qualifiers = plugin.qualifiers();

      if (
        qualifiers.labels.includes(message.label) ||
        (qualifiers.labels.length === 1 && qualifiers.labels[0] === '*')
      ) {
        if (qualifiers.preambles && qualifiers.preambles.length > 0) {
          const matching = qualifiers.preambles.filter((preamble: string) => {
            // console.log(message.text.substring(0, preamble.length));
            // console.log(preamble);
            return message.text.substring(0, preamble.length) === preamble;
          });
          return matching.length >= 1;
        } else {
          return true;
        }
      }

      return false;
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

    // for-in is not happy. doing it the old way
    for (let i = 0; i < usablePlugins.length; i++) {
      const plugin = usablePlugins[i];
      result = plugin.decode(message);
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
