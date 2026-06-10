import type {
  DecodeResult,
  DecoderPlugin,
  Message,
  Options,
} from '@airframes/ads-runtime-ts';

/**
 * Whole-plugin parse hatch for Label_SQ (Ground Station Squitter).
 *
 * preamble = text[0:4]; version = Number(text[1:2]); network = text[3:4].
 * For version 2 messages, a regex pulls out organization/IATA/ICAO/station
 * number/coords/VDL frequency. Network is mapped A→ARINC, S→SITA,
 * else Unknown.
 *
 * formatted.items is built from scratch (replacing the empty array
 * initialized by the plugin's initResult) with NETT and VER, then any
 * optional fields (GNDSTN, IATA, ICAO, COORD, APT, VDLFRQ) appended only
 * when their source value is present.
 */
export function label_sq_dispatch(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  _options: Options,
): DecodeResult {
  result.raw.preamble = message.text.substring(0, 4);
  result.raw.version = Number(message.text.substring(1, 2));
  result.raw.network = message.text.substring(3, 4);

  if (result.raw.version === 2) {
    const regex =
      /0(\d)X(?<org>\w)(?<iata>\w\w\w)(?<icao>\w\w\w\w)(?<station>\d)(?<lat>\d+)(?<latd>[NS])(?<lng>\d+)(?<lngd>[EW])V(?<vfreq>\d+)\/.*/;
    const match = message.text.match(regex);

    if (match?.groups && match.length >= 8) {
      result.raw.groundStation = {
        number: match.groups.station,
        iataCode: match.groups.iata,
        icaoCode: match.groups.icao,
        coordinates: {
          latitude:
            (Number(match.groups.lat) / 100) *
            (match.groups.latd === 'S' ? -1 : 1),
          longitude:
            (Number(match.groups.lng) / 100) *
            (match.groups.lngd === 'W' ? -1 : 1),
        },
      };
      result.raw.vdlFrequency = Number(match.groups.vfreq) / 1000.0;
    }
  }

  let formattedNetwork = 'Unknown';
  if (result.raw.network === 'A') {
    formattedNetwork = 'ARINC';
  } else if (result.raw.network === 'S') {
    formattedNetwork = 'SITA';
  }
  result.formatted.items = [
    {
      type: 'network',
      code: 'NETT',
      label: 'Network',
      value: formattedNetwork,
    },
    {
      type: 'version',
      code: 'VER',
      label: 'Version',
      value: String(result.raw.version),
    },
  ];

  if (result.raw.groundStation) {
    const gs = result.raw.groundStation as {
      number?: string;
      iataCode?: string;
      icaoCode?: string;
      coordinates: { latitude?: number; longitude?: number };
      airport?: { name: string; icao: string; location: string };
    };
    if (gs.icaoCode && gs.number) {
      result.formatted.items.push({
        type: 'ground_station',
        code: 'GNDSTN',
        label: 'Ground Station',
        value: `${gs.icaoCode}${gs.number}`,
      });
    }
    if (gs.iataCode) {
      result.formatted.items.push({
        type: 'iataCode',
        code: 'IATA',
        label: 'IATA',
        value: gs.iataCode,
      });
    }
    if (gs.icaoCode) {
      result.formatted.items.push({
        type: 'icaoCode',
        code: 'ICAO',
        label: 'ICAO',
        value: gs.icaoCode,
      });
    }
    if (gs.coordinates.latitude) {
      result.formatted.items.push({
        type: 'coordinates',
        code: 'COORD',
        label: 'Ground Station Location',
        value: `${gs.coordinates.latitude}, ${gs.coordinates.longitude}`,
      });
    }
    if (gs.airport) {
      result.formatted.items.push({
        type: 'airport',
        code: 'APT',
        label: 'Airport',
        value: `${gs.airport.name} (${gs.airport.icao}) in ${gs.airport.location}`,
      });
    }
  }

  if (result.raw.vdlFrequency) {
    result.formatted.items.push({
      type: 'vdlFrequency',
      code: 'VDLFRQ',
      label: 'VDL Frequency',
      value: `${result.raw.vdlFrequency} MHz`,
    });
  }
  result.decoded = true;
  result.decoder.decodeLevel = 'full';
  return result;
}
