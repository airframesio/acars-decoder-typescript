import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// '-------------------OUT REPORT\r\nDEP RCKU,OUT 1118,FOB 106'
// or 'M55AZH9110------------INNRPT\n\tDES ZGSZ,...',
// optionally preceded by a multi-block header such as 'M77ASC4873'
const REPORT_REGEX =
  /^(?<prefix>M\d{2}A[A-Z0-9]{6})?-*(?<event>OUT|OFF|ONN?|INN?) ?(?:REPORT|RPT)[\s,]+(?<body>[\s\S]*)$/;
const TIME_REGEX = /^\d{4}(\d{2})?$/;

const DESCRIPTIONS: Record<string, string> = {
  OUT: 'OUT Report',
  OFF: 'OFF Report',
  ON: 'ON Report',
  IN: 'IN Report',
};

// Text OOOI reports sent on the Q-series OOOI labels
// (QE OUT, QF OFF, QC ON, QD IN)
export class Label_QE_Report extends DecoderPlugin {
  name = 'label-qe-report';

  qualifiers() {
    return {
      labels: ['QE', 'QF', 'QC', 'QD'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'OOOI Report');

    const match = REPORT_REGEX.exec(message.text.trim());
    if (!match?.groups) {
      this.debug(options, `Unknown OOOI report: ${message.text}`);
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.formatted.description =
      DESCRIPTIONS[match.groups.event.replace(/NN$/, 'N')];
    if (match.groups.prefix) {
      ResultFormatter.unknown(decodeResult, match.groups.prefix);
    }

    for (const field of match.groups.body.split(',')) {
      this.parseField(decodeResult, field.trim());
    }

    if (
      decodeResult.raw.out_time === undefined &&
      decodeResult.raw.off_time === undefined &&
      decodeResult.raw.on_time === undefined &&
      decodeResult.raw.in_time === undefined
    ) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }

  private parseField(decodeResult: DecodeResult, field: string) {
    if (!field) {
      return;
    }
    const [key, ...rest] = field.split(' ');
    const value = rest.join(' ').trim();

    switch (key) {
      case 'DEP':
        ResultFormatter.departureAirport(decodeResult, value);
        return;
      case 'DES':
        ResultFormatter.arrivalAirport(decodeResult, value);
        return;
      case 'OUT':
      case 'OFF':
      case 'ON':
      case 'IN': {
        if (!TIME_REGEX.test(value)) {
          break;
        }
        const tod = DateTimeUtils.convertHHMMSSToTod(value);
        if (key === 'OUT') ResultFormatter.out(decodeResult, tod);
        else if (key === 'OFF') ResultFormatter.off(decodeResult, tod);
        else if (key === 'ON') ResultFormatter.on(decodeResult, tod);
        else ResultFormatter.in(decodeResult, tod);
        return;
      }
      case 'ETA':
        if (TIME_REGEX.test(value)) {
          ResultFormatter.eta(
            decodeResult,
            DateTimeUtils.convertHHMMSSToTod(value),
          );
          return;
        }
        break;
      case 'FOB':
        if (/^\d+$/.test(value)) {
          ResultFormatter.currentFuel(decodeResult, Number(value));
          return;
        }
        break;
    }
    ResultFormatter.unknown(decodeResult, field, ',');
  }
}
