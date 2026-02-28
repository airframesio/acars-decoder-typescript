import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_16_AUTPOS extends DecoderPlugin {
  name = 'label-16-autpos';
  qualifiers() {
    return {
      labels: ['16'],
      preambles: [''],
    };
  }

  decode(message: Message): DecodeResult {
    let decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;
    decodeResult.message = message;

    // Regex to match the AUTPOS message
    const regex =
      /^(\d{6})\/AUTPOS\/LLD (N|S)(\d{2})(\d{2})(\d{2}) (E|W)(\d{3})(\d{2})(\d{2})\s*\r?\n\/ALT (\d+)\/SAT ([*\-\d]{4})\r?\n\/WND ([*\d]{3})([\*\d]{3})\/TAT ([*\-\d]{4})\/TAS ([*\d]{3,4})\/CRZ ([*\d]{3,4})\r?\n\/FOB (\d{6})\r?\n\/DAT (\d{6})\/TIM (\d{6})/;
    const match = regex.exec(message.text);
    if (!match) {
      decodeResult.decoded = false;
      return decodeResult;
    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';
    decodeResult.formatted.description = 'Position Report';

    // Extract fields
    const [
      ,
      flight,
      latHem,
      latDeg,
      latMin,
      latSec,
      lonHem,
      lonDeg,
      lonMin,
      lonSec,
      altitude,
      sat,
      windDir,
      windSpd,
      tat,
      tas,
      crz,
      fob,
      dat,
      tim,
    ] = match;

    ResultFormatter.day(decodeResult, parseInt(flight.slice(0, 2), 10));
    ResultFormatter.flightNumber(decodeResult, flight.slice(2));
    // Use hemisphere indicators for coordinates
    let latitude = CoordinateUtils.dmsToDecimalDegrees(
      parseInt(latDeg, 10),
      parseInt(latMin, 10),
      parseInt(latSec, 10),
    );
    if (latHem === 'S') latitude = -latitude;
    let longitude = CoordinateUtils.dmsToDecimalDegrees(
      parseInt(lonDeg, 10),
      parseInt(lonMin, 10),
      parseInt(lonSec, 10),
    );
    if (lonHem === 'W') longitude = -longitude;
    ResultFormatter.position(decodeResult, {
      latitude,
      longitude,
    });
    const alt = parseInt(altitude, 10);
    ResultFormatter.altitude(decodeResult, alt);

    // Parse wind
    if (!windSpd.includes('*') && !windDir.includes('*')) {
      ResultFormatter.windData(decodeResult, [
        {
          waypoint: {
            name: 'POSITION',
          },
          flightLevel: Math.round(alt / 100),
          windDirection: parseInt(windDir, 10),
          windSpeed: parseInt(windSpd, 10),
        },
      ]);
    }

    if (!tat.includes('*')) {
      ResultFormatter.totalAirTemp(decodeResult, tat);
    }
    if (!tas.includes('*')) {
      ResultFormatter.airspeed(decodeResult, parseInt(tas, 10));
    }
    if (!sat.includes('*')) {
      ResultFormatter.temperature(decodeResult, sat);
    }
    if (!crz.includes('*')) {
      ResultFormatter.mach(decodeResult, parseInt(crz, 10) / 1000);
    }

    if (!fob.includes('*')) {
      ResultFormatter.currentFuel(decodeResult, parseInt(fob, 10));
    }

    if (!dat.includes('*') && !tim.includes('*')) {
      // DAT is DDMMYY, TIM is HHMMSS
      // DateTimeUtils.convertDateTimeToEpoch expects MMDDYY
      const yy = dat.slice(0, 2);
      const mm = dat.slice(2, 4);
      const dd = dat.slice(4, 6);
      const mmddyy = `${mm}${dd}${yy}`;
      ResultFormatter.timestamp(
        decodeResult,
        DateTimeUtils.convertDateTimeToEpoch(tim, mmddyy),
      );
    }
    return decodeResult;
  }
}
