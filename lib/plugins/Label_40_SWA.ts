import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import {
  decodeSwaLabel40,
  isSwaType,
  SWA_UNREAD,
} from '../utils/swa_compressed';
import {
  SWA_LAYOUTS,
  SwaFieldWriter,
  swaFields,
  swaMatchesLayout,
} from '../utils/swa_fields';

// By type; the two digits are the type's version.
const DESCRIPTIONS: Record<string, string> = {
  ASR01: 'Approach Stability Report',
  DVP01: 'Divert Plan',
  FTX01: 'Dispatch Free Text',
  GAR03: 'Gate Assignment Response',
  GEN01: 'Company Message',
  PIC01: 'Part 117 Duty Extension Request',
  POS01: 'Position Report Request',
  WFC01: 'Field Condition Report',
};

// ASR01 fields, in order.
const ASR01: [string, string, string][] = [
  [
    'reverser_distance',
    'REVDIST',
    'Threshold to Thrust Reverser Deployment (feet)',
  ],
  ['max_ias', 'MAXIAS', 'Highest IAS, 1000 feet to Touchdown (knots)'],
  ['min_ias', 'MINIAS', 'Lowest IAS, to Touchdown (knots)'],
  ['touchdown_distance', 'TDDIST', 'Threshold to Touchdown (feet)'],
  ['glideslope_above', 'GSHIGH', 'Largest Deviation Above Glideslope (dots)'],
  ['glideslope_below', 'GSLOW', 'Largest Deviation Below Glideslope (dots)'],
  ['max_pitch', 'MAXPITCH', 'Highest Pitch, Flare and Landing (degrees)'],
  ['tailstrike_pitch', 'TSPITCH', 'Tail Strike Pitch Limit (degrees)'],
];

/**
 * Southwest Airlines label 40 uplinks: `TYPE,` in clear, a two-digit table code, then the body in
 * that table. See utils/swa_compressed.ts.
 */
export class Label_40_SWA extends DecoderPlugin {
  name = 'label-40-swa';

  qualifiers() {
    return {
      labels: ['40'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    const d = decodeSwaLabel40(message.text);
    if (!d || !isSwaType(d.type, '40')) {
      if (options.debug) {
        console.log(`Decoder: Unknown 40 message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.formatted.description = 'Unknown';
      return decodeResult;
    }

    decodeResult.decoded = true;
    decodeResult.formatted.description =
      DESCRIPTIONS[d.type] ?? 'Southwest Message';
    decodeResult.raw.preamble = d.type;

    if (d.type === 'POS01') {
      const m = d.text.match(/^POS01,Y,(\d{2})$/);
      if (m) {
        ResultFormatter.raw(
          decodeResult,
          'report_interval',
          'RPTINT',
          'Position Report Interval',
          `${Number(m[1])} minutes`,
          Number(m[1]),
        );
        decodeResult.decoder.decodeLevel = 'full';
      } else {
        ResultFormatter.unknown(decodeResult, d.text);
        decodeResult.decoder.decodeLevel = 'partial';
      }
      return decodeResult;
    }

    const text = d.text;
    const fields = swaFields(text);
    const layouts = SWA_LAYOUTS[d.type];
    const clean = !text.includes(SWA_UNREAD);
    if (clean && layouts && swaMatchesLayout(fields, layouts)) {
      const w = new SwaFieldWriter(decodeResult, fields);
      if (d.type === 'ASR01') {
        ASR01.forEach(([key, code, label], i) => {
          const v = fields[i].trim();
          // XX.X: no glideslope flown
          if (v !== 'XX.X') w.item(i, key, code, label, v);
          else w.use(i);
        });
      } else if (d.type === 'GAR03') {
        // gate, five Y/N flags (meaning not established), ramp frequency
        // GAR03 answers the in-flight GAM02 gate request, so this is the arrival gate.
        ResultFormatter.arrivalGate(decodeResult, w.use(0).trim());
        if (fields[6] !== '999.999') {
          w.item(
            6,
            'ramp_frequency',
            'RAMPFREQ',
            'Ramp Frequency',
            `${fields[6]} MHz`,
          );
        } else {
          w.use(6);
        }
      }
      const rest = w.finish();
      decodeResult.decoder.decodeLevel = rest === 0 ? 'full' : 'partial';
      return decodeResult;
    }

    ResultFormatter.text(decodeResult, text.split('|').join('\n'));
    decodeResult.decoder.decodeLevel = clean && !layouts ? 'full' : 'partial';
    return decodeResult;
  }
}
