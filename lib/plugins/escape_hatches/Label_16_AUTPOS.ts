// Escape-hatch port of lib/plugins/Label_16_AUTPOS.ts
// Called from generated plugin lib/plugins/generated/Label_16_AUTPOS.ts.

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

export function label_16_autpos_decode(
  plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  // Regex to match the AUTPOS message
  const regex =
    /^(\d{6})\/AUTPOS\/LLD (N|S)(\d{2})(\d{2})(\d{2}) (E|W)(\d{3})(\d{2})(\d{2})\s*\r?\n\/ALT (\d+)\/SAT ([*\-\d]{4})\r?\n\/WND ([*\d]{3})([\*\d]{3})\/TAT ([*\-\d]{4})\/TAS ([*\d]{3,4})\/CRZ ([*\d]{3,4})\r?\n\/FOB (\d{6})\r?\n\/DAT (\d{6})\/TIM (\d{6})/;
  const match = regex.exec(message.text);
  if (!match) {
    result.decoded = false;
    return result;
  }

  result.decoded = true;
  result.decoder.decodeLevel = 'full';
  result.formatted.description = 'Position Report';

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

  ResultFormatter.day(result, parseInt(flight.slice(0, 2), 10));
  ResultFormatter.flightNumber(result, flight.slice(2));
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
  ResultFormatter.position(result, {
    latitude,
    longitude,
  });
  const alt = parseInt(altitude, 10);
  ResultFormatter.altitude(result, alt);

  // Parse wind
  if (!windSpd.includes('*') && !windDir.includes('*')) {
    ResultFormatter.windData(result, [
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
    ResultFormatter.totalAirTemp(result, tat);
  }
  if (!tas.includes('*')) {
    ResultFormatter.airspeed(result, parseInt(tas, 10));
  }
  if (!sat.includes('*')) {
    ResultFormatter.temperature(result, sat);
  }
  if (!crz.includes('*')) {
    ResultFormatter.mach(result, parseInt(crz, 10) / 1000);
  }

  if (!fob.includes('*')) {
    ResultFormatter.currentFuel(result, parseInt(fob, 10));
  }

  if (!dat.includes('*') && !tim.includes('*')) {
    const yy = dat.slice(0, 2);
    const mm = dat.slice(2, 4);
    const dd = dat.slice(4, 6);
    const ddmmyy = `${dd}${mm}${yy}`;
    ResultFormatter.timestamp(
      result,
      DateTimeUtils.convertDateTimeToEpoch(tim, ddmmyy),
    );
  }
  void plugin;
  return result;
}

export function label_16_autpos_format(_result: DecodeResult): void {
  // No-op.
}
