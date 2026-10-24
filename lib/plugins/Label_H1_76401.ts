import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { Waypoint } from '../types/waypoint';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_H1_76401 extends DecoderPlugin {
  name = 'label-h1-76401';

  qualifiers() {
    return {
      labels: ['H1'],
      preambles: ['76401\r\n'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Position Report');

    const lines = message.text.split('\r\n');

    if (lines.length < 3) {
      return decodeResult;
    }

    ResultFormatter.unknown(decodeResult, lines[0], '\r\n');

    ResultFormatter.unknown(decodeResult, lines[1].substring(0, 5), '\r\n');
    ResultFormatter.departureAirport(decodeResult, lines[1].substring(5, 9));
    ResultFormatter.arrivalAirport(decodeResult, lines[1].substring(9, 13));
    ResultFormatter.unknown(decodeResult, lines[1].substring(13), ''); // should have nothing left on line 1

    const waypoints: Waypoint[] = [];
    for (const line of lines.slice(2)) {
      const position = CoordinateUtils.decodeStringCoordinates(
        line.substring(0, 13),
      );
      if (position) {
        waypoints.push({
          name: line.substring(0, 13),
          latitude: position.latitude,
          longitude: position.longitude,
          time: DateTimeUtils.convertHHMMSSToTod(line.substring(13, 19)),
        });
      } else {
        ResultFormatter.unknown(decodeResult, line.substring(0, 19), '');
      }
      ResultFormatter.unknown(decodeResult, line.substring(19), '\r\n');
    }

    ResultFormatter.route(decodeResult, { waypoints: waypoints });
    // add position from the last waypoint for fun mapping
    if (waypoints.length > 0) {
      const lastWaypoint = waypoints[waypoints.length - 1];
      // should be true, making typescript happy
      if (
        lastWaypoint.latitude !== undefined &&
        lastWaypoint.longitude !== undefined
      ) {
        ResultFormatter.position(decodeResult, {
          latitude: lastWaypoint.latitude,
          longitude: lastWaypoint.longitude,
        });
      }

      // should be true, making typescript happy
      if (lastWaypoint.time !== undefined) {
        ResultFormatter.timestamp(decodeResult, lastWaypoint.time);
      }
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'partial';

    return decodeResult;
  }
}
