import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 3L — Position Report (Jetstar variant)
 *
 * Compact in-flight position downlink: hemisphere-prefixed decimal-degree
 * latitude/longitude plus a UTC HHMM timestamp. No altitude, speed, or
 * heading is carried.
 *
 * Wire format:
 *
 *   S 21.940 / E 147.806  / UTC 2146
 *   | |        | |          |     |
 *   | |        | |          |     └─ Time, HHMM (UTC)
 *   | |        | |          └─────── Literal "UTC" tag (preceded by " /")
 *   | |        | └────────────────── Longitude in decimal degrees
 *   | |        └──────────────────── Longitude hemisphere (E/W)
 *   | └──────────────────────────── Latitude in decimal degrees
 *   └─────────────────────────────── Latitude hemisphere (N/S)
 *
 * The single space and the surrounding spaces around `/` are tolerated.
 */
export class Label_3L_Position extends DecoderPlugin {
  name = 'label-3l-position';

  qualifiers() {
    return {
      labels: ['3L'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Position Report');

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Hemisphere + decimal degrees + UTC HHMM
    const regex =
      /^(?<latH>[NS])\s*(?<lat>\d+(?:\.\d+)?)\s*\/\s*(?<lonH>[EW])\s*(?<lon>\d+(?:\.\d+)?)\s*\/\s*UTC\s+(?<time>\d{4})\s*$/;
    const m = text.match(regex);
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { latH, lat, lonH, lon, time } = m.groups;
    const latitude = Number(lat) * (latH === 'S' ? -1 : 1);
    const longitude = Number(lon) * (lonH === 'W' ? -1 : 1);
    const hh = time.substring(0, 2);
    const mm = time.substring(2, 4);

    // Use the standard position helper so the generic chip renderer
    // (and any downstream tooling that looks at raw.position) picks it up
    ResultFormatter.position(decodeResult, { latitude, longitude });
    decodeResult.raw.message_timestamp = DateTimeUtils.convertHHMMSSToTod(time + '00');

    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Position Report (Jetstar 3L — lat/lon + UTC)',
      },
      {
        type: 'direction',
        code: 'DIR',
        label: 'Direction',
        value: 'Downlink (aircraft → ground)',
      },
    );

    // Show the hemispheres explicitly for readability
    decodeResult.formatted.items.push(
      {
        type: 'lat_decoded',
        code: 'LAT',
        label: 'Latitude',
        value: `${lat}° ${latH === 'S' ? 'South' : 'North'} (${latitude})`,
      },
      {
        type: 'lon_decoded',
        code: 'LON',
        label: 'Longitude',
        value: `${lon}° ${lonH === 'W' ? 'West' : 'East'} (${longitude})`,
      },
      {
        type: 'time',
        code: 'TIME',
        label: 'Time (UTC)',
        value: `${hh}:${mm} UTC`,
      },
    );

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
