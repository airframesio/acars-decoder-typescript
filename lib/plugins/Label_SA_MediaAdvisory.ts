import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label SA — Media Advisory
 *
 * A periodic status / advisory message broadcast by the aircraft ACARS
 * system, typically thought to indicate media or connectivity link state.
 *
 * Wire format observed in the wild:
 *
 *   0 E V 221908 V
 *   | | | |      |
 *   | | | |      └── Suffix flag (one of: V, 2, VS, V/, 2S/)
 *   | | | └───────── UTC time, HHMMSS
 *   | | └─────────── Prefix byte 3 (typ. V when byte 2 is E)
 *   | └───────────── Prefix byte 2 (typ. E)
 *   └─────────────── Prefix byte 1 (almost always 0)
 *
 * Examples observed: 0EV232437V, 0EV233702V/, 0EV233817V, 0EV221908V
 *
 * The semantic meaning of the prefix/suffix codes is undocumented and
 * is therefore exposed as raw characters without interpretation, per
 * the analyst's "ignore wild-guesses" guidance.
 */
export class Label_SA_MediaAdvisory extends DecoderPlugin {
  name = 'label-sa-media-advisory';

  qualifiers() {
    return {
      labels: ['SA'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Media Advisory (link/connectivity status)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Pattern: 3-char prefix + 6-digit HHMMSS + 1–3-char suffix flag
    const regex =
      /^(?<prefix>[A-Z0-9]{3})(?<time>\d{6})(?<suffix>[A-Z0-9/]{1,3})$/;
    const m = text.match(regex);
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { prefix, time, suffix } = m.groups;
    const hh = time.substring(0, 2);
    const mm = time.substring(2, 4);
    const ss = time.substring(4, 6);

    decodeResult.raw.prefix = prefix;
    decodeResult.raw.suffix = suffix;
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(time),
    );

    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Media Advisory (link/connectivity status)',
      },
      {
        type: 'prefix',
        code: 'PREFIX',
        label: 'Prefix Code',
        value: prefix,
      },
    );
    decodeResult.formatted.items.push(
      {
        type: 'time',
        code: 'TIME',
        label: 'Time (UTC)',
        value: `${hh}:${mm}:${ss}`,
      },
      {
        type: 'suffix',
        code: 'SUFFIX',
        label: 'Suffix Flag',
        value: suffix,
      },
    );

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
