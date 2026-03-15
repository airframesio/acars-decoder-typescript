import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_H1_Paren extends DecoderPlugin {
  name = 'label-h1-paren';
  qualifiers() {
    return {
      labels: ['H1'],
      preambles: ['('],
    };
  }

  decode(message: Message): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    if (!message.text || !message.text.startsWith('(')) {
      decodeResult.decoded = false;
      return decodeResult;
    }

    const regex =
      /^\(POS-(?<flight>\w+)\s+(?<lat>-?\d{4,5}[NS])(?<lon>\d{5}[EW])\/(?<timestamp>\d{6})\s+F(?<alt>\d{3})\r?\nRMK\/FUEL\s+(?<fuel>\d{2,3}\.\d)\s+M(?<mach>\d\.\d{2})\)/;

    const match = message.text.match(regex);
    if (match && match.groups) {
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
      decodeResult.formatted.description = 'Position Report';

      ResultFormatter.flightNumber(decodeResult, match.groups.flight);
      ResultFormatter.position(decodeResult, {
        latitude: parseLat(match.groups.lat),
        longitude: parseLon(match.groups.lon),
      });
      ResultFormatter.timestamp(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(match.groups.timestamp),
      );
      ResultFormatter.altitude(
        decodeResult,
        parseInt(match.groups.alt, 10) * 100,
      );
      ResultFormatter.currentFuel(decodeResult, parseFloat(match.groups.fuel));
      ResultFormatter.mach(decodeResult, parseFloat(match.groups.mach));
      ResultFormatter.unknown(decodeResult, 'RMK');
    }
    return decodeResult;
  }
}

function parseLat(latStr: string): number {
  const match = latStr.match(/(-?)(\d{2})(\d{2})([NS])/);
  if (!match) return NaN;
  let deg = parseInt(match[2]);
  let min = parseInt(match[3]);
  let sign = match[4] === 'S' ? -1 : 1;
  return sign * (deg + min / 60);
}

function parseLon(lonStr: string): number {
  const match = lonStr.match(/(\d{3})(\d{2})([EW])/);
  if (!match) return NaN;
  let deg = parseInt(match[1]);
  let min = parseInt(match[2]);
  let sign = match[3] === 'W' ? -1 : 1;
  return sign * (deg + min / 60);
}
