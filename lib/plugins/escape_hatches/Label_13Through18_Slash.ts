import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';
import {
  CoordinateUtils,
  DateTimeUtils,
  ResultFormatter,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin decode hatch for Label_13Through18_Slash (OOOI Reports).
 *
 * The first line is '/'-split. parts[1][0:2] holds the numeric label
 * (13..18) which selects the OOOI variant and the formatted description.
 * Labels 13..17 need 4 parts; label 18 needs 7.
 *
 * Body fields: parts[2] is space-split into [_, depICAO, arrICAO, day,
 * HHMM time]. Time goes to out/off/on/in based on label. For label 18,
 * parts[4..] are appended as unknown.
 *
 * Subsequent lines may carry '/LOC' entries: comma-separated coordinate
 * pairs in three formats — signed decimal, or DDMMSS-packed for lat (7
 * chars: dir + DD + MM + SS) and DDDMMSS for lon (8 chars: dir + DDD +
 * MM + SS), parsed via dmsToDecimalDegrees.
 */
export function label_13_18_slash_decode(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const lines = message.text.split('\r\n');
  const parts = lines[0].split('/');
  const labelNumber = Number(parts[1].substring(0, 2));
  result.formatted.description = getMsgType(labelNumber);

  if (
    (labelNumber !== 18 && parts.length !== 4) ||
    (labelNumber === 18 && parts.length !== 7)
  ) {
    if (options?.debug) {
      console.log(`Decoder: Unknown OOOI message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
    return result;
  }

  const data = parts[2].split(' ');
  ResultFormatter.departureAirport(result, data[1]);
  ResultFormatter.arrivalAirport(result, data[2]);
  result.raw.day = Number(data[3]);
  const time = DateTimeUtils.convertHHMMSSToTod(data[4]);
  if (labelNumber === 13) {
    ResultFormatter.out(result, time);
  } else if (labelNumber === 14) {
    ResultFormatter.off(result, time);
  } else if (labelNumber === 15) {
    ResultFormatter.on(result, time);
  } else if (labelNumber === 16) {
    ResultFormatter.in(result, time);
  }

  if (parts.length === 7) {
    ResultFormatter.unknownArr(result, parts.slice(4), '/');
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith('/LOC')) {
      const location = lines[i].substring(5).split(',');
      let position;
      if (location[0].startsWith('+') || location[0].startsWith('-')) {
        position = {
          latitude: Number(location[0]),
          longitude: Number(location[1]),
        };
      } else {
        position = {
          latitude:
            CoordinateUtils.getDirection(location[0][0]) *
            CoordinateUtils.dmsToDecimalDegrees(
              Number(location[0].substring(1, 3)),
              Number(location[0].substring(3, 5)),
              Number(location[0].substring(5, 7)),
            ),
          longitude:
            CoordinateUtils.getDirection(location[1][0]) *
            CoordinateUtils.dmsToDecimalDegrees(
              Number(location[1].substring(1, 4)),
              Number(location[1].substring(4, 6)),
              Number(location[1].substring(6, 8)),
            ),
        };
      }
      ResultFormatter.position(result, position);
    } else {
      ResultFormatter.unknown(result, lines[i], '\r\n');
    }
  }

  result.decoded = true;
  result.decoder.decodeLevel = result.remaining.text ? 'partial' : 'full';
  return result;
}

function getMsgType(labelNumber: number): string {
  if (labelNumber === 13) return 'Out of Gate Report';
  if (labelNumber === 14) return 'Takeoff Report';
  if (labelNumber === 15) return 'On Ground Report';
  if (labelNumber === 16) return 'In Gate Report';
  if (labelNumber === 17) return 'Post Report';
  if (labelNumber === 18) return 'Post Times Report';
  return 'Unknown';
}
