import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label 16 — POSA1 Position Report
 *
 * Aircraft position report (most commonly Boeing). Eleven comma-separated
 * fields following the `POSA1` preamble:
 *
 *   POSA1 N43920W 89636 , HILRO  , 021110 , 349 , GRB    , 022339 , , -46 ,  68 , 1198 , 831
 *   |     |        |     |         |        |     |        |        | |     |     |      |
 *   |     |        |     |         |        |     |        |        | |     |     |      └ trailing unknown (wild guess — ignored)
 *   |     |        |     |         |        |     |        |        | |     |     └──────── trailing unknown (wild guess — ignored)
 *   |     |        |     |         |        |     |        |        | |     └────────────── trailing unknown (wild guess — ignored)
 *   |     |        |     |         |        |     |        |        | └──────────────────── OAT (°C, may be negative)
 *   |     |        |     |         |        |     |        |        └────────────────────── empty placeholder field
 *   |     |        |     |         |        |     |        └─────────────────────────────── ETA at next waypoint, HHMMSS UTC
 *   |     |        |     |         |        |     └──────────────────────────────────────── Next waypoint / fix (6 chars, space-padded)
 *   |     |        |     |         |        └────────────────────────────────────────────── Ground track / heading (degrees)
 *   |     |        |     |         └─────────────────────────────────────────────────────── Time at current waypoint, HHMMSS UTC
 *   |     |        |     └───────────────────────────────────────────────────────────────── Current / overhead waypoint (6 chars, space-padded)
 *   |     |        └─────────────────────────────────────────────────────────────────────── Longitude (deg + decimal-as-integer; N/S/E/W encoded)
 *   |     └──────────────────────────────────────────────────────────────────────────────── Latitude  (same encoding)
 *   └────────────────────────────────────────────────────────────────────────────────────── POSA1 preamble
 *
 * Coordinate encoding: `N43920` → N 43.920°, `W 89636` → W 89.636°
 * (leading space is padding to align longitude widths ≥100°).
 *
 * Per the analyst's "ignore wild-guesses" guidance, the three trailing
 * unknown numeric fields (e.g. `68, 1198, 831`) and the empty placeholder
 * field are NOT surfaced as labelled rows — they have no documented
 * semantics and speculation would be misleading.
 */
export class Label_16_POSA1 extends DecoderPlugin {
  name = 'label-16-posa1';

  qualifiers() {
    return {
      labels: ['16'],
      preambles: ['POSA1'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Position Report');

    const fields = message.text.split(',');
    if (fields.length !== 11 || !fields[0].startsWith('POSA1')) {
      return this.failUnknown(decodeResult, message.text, options);
    }

    // Field 0: POSA1 + coordinates
    ResultFormatter.position(
      decodeResult,
      CoordinateUtils.decodeStringCoordinates(fields[0].substring(5)),
    );

    // Field 1: current / overhead waypoint
    const waypoint = fields[1].trim();

    // Field 2: time at current waypoint (HHMMSS UTC)
    const time = DateTimeUtils.convertHHMMSSToTod(fields[2]);
    ResultFormatter.timestamp(decodeResult, time);

    // Field 3: ground track / heading (degrees)
    const trackRaw = fields[3].trim();
    if (/^\d{1,3}$/.test(trackRaw)) {
      const track = Number(trackRaw);
      decodeResult.raw.track = track;
      decodeResult.formatted.items.push({
        type: 'track',
        code: 'TRK',
        label: 'Ground Track',
        value: `${track}°`,
      });
    }

    // Field 4: next waypoint
    const nextWaypoint = fields[4].trim();

    // Field 5: ETA at next waypoint (HHMMSS UTC)
    const nextTime = DateTimeUtils.convertHHMMSSToTod(fields[5]);
    if (nextTime) {
      ResultFormatter.eta(decodeResult, nextTime);
    }

    // Field 6: empty placeholder — ignored.
    // Field 7: OAT (°C, possibly negative)
    const oatRaw = fields[7].trim();
    if (/^-?\d{1,3}$/.test(oatRaw)) {
      ResultFormatter.temperature(decodeResult, oatRaw);
    }

    // Fields 8, 9, 10 (e.g. " 68", "1198", "831"): undocumented — ignored
    // per the analyst's "wild guess" classification.

    // Route (current + next waypoints)
    ResultFormatter.route(decodeResult, {
      waypoints: [
        { name: waypoint, time: time },
        { name: nextWaypoint, time: nextTime },
      ],
    });

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
