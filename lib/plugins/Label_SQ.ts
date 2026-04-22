import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

/**
 * Label SQ — Ground Station Squitter
 *
 * ACARS label SQ denotes a "squitter" — an ID and uplink test message
 * transmitted at regular intervals from ACARS ground stations. It is a
 * ground-to-air BROADCAST (not a downlink from an aircraft), announcing
 * the ground station's presence, position, and VDL-2 capability to any
 * aircraft in range.
 *
 * Extended squitter (version 02) format:
 *
 *   0 2 X A YVR CYVR 1 4911 N 12310 W V 136975 /ARINC
 *   | | | | |   |    | |    | |     | | |      |
 *   | | | | |   |    | |    | |     | | |      └ Provider suffix: /ARINC or empty (SITA)
 *   | | | | |   |    | |    | |     | | └──────── VDL-2 frequency (kHz), 136975 → 136.975 MHz
 *   | | | | |   |    | |    | |     | └────────── Separator flag (often 'V' for VDL, but 'B'
 *   | | | | |   |    | |    | |     |             and other letters have been observed; the
 *   | | | | |   |    | |    | |     |             specific meaning is not documented)
 *   | | | | |   |    | |    | |     └──────────── Longitude hemisphere (E/W)
 *   | | | | |   |    | |    | └──────────────── Longitude (DDDMM) — deg + 2 digits min
 *   | | | | |   |    | |    └────────────────── Latitude hemisphere (N/S)
 *   | | | | |   |    | └─────────────────────── Latitude (DDMM) — deg + 2 digits min
 *   | | | | |   |    └───────────────────────── Ground station number (1-9)
 *   | | | | |   └────────────────────────────── ICAO airport code of the station (4 chars)
 *   | | | | └────────────────────────────────── IATA airport code of the station (3 chars)
 *   | | | └──────────────────────────────────── Provider ID: A = ARINC (RC), S = SITA
 *   | | └────────────────────────────────────── Category: X = ground-to-air uplink broadcast
 *   | └──────────────────────────────────────── Version: 2 = extended squitter with position + VDL-2
 *   └────────────────────────────────────────── Version digit 1 (always '0')
 *
 * Coordinate encoding: lat is 4 digits DDMM, lng is 5 digits DDDMM.
 * Example: 5109 N 00012 W → 51°09'N, 000°12'W → London Gatwick (EGKK).
 *
 * Real-world examples observed:
 *   0EYVRCYVR14911N12310WV136975/ARINC   ← Vancouver, V separator
 *   02XALGWEGKK15109N00012WB136975/ARINC ← Gatwick,   B separator
 */
export class Label_SQ extends DecoderPlugin {
  name = 'label-sq';

  qualifiers() {
    return {
      labels: ['SQ'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Ground Station Squitter (ID / Uplink Test — ground-to-air broadcast)'
    );

    decodeResult.raw.preamble = message.text.substring(0, 4);
    decodeResult.raw.version = Number(message.text.substring(1, 2));
    decodeResult.raw.network = message.text.substring(3, 4);
    // Category char (typically 'X' for uplink broadcast)
    decodeResult.raw.category = message.text.substring(2, 3);

    if (decodeResult.raw.version === 2) {
      // Lat is 4 digits (DDMM), lng is 5 digits (DDDMM). Separator before
      // frequency is typically 'V' but 'B' (and possibly others) have been
      // observed; capture as a raw flag rather than constraining to 'V'.
      const regex =
        /0(\d)(?<cat>[A-Z])(?<org>[A-Z])(?<iata>\w{3})(?<icao>\w{4})(?<station>\d)(?<lat>\d{4})(?<latd>[NS])(?<lng>\d{5})(?<lngd>[EW])(?<sep>[A-Z])(?<vfreq>\d+)(?:\/(?<suffix>\w*))?/;
      const result = message.text.match(regex);

      if (result?.groups && result.length >= 8) {
        decodeResult.raw.category = result.groups.cat;
        decodeResult.raw.network = result.groups.org;

        // DDMM → decimal degrees (deg + min/60), signed by hemisphere
        const latRaw = result.groups.lat;
        const lngRaw = result.groups.lng;
        const latDeg = Math.floor(Number(latRaw) / 100);
        const latMin = Number(latRaw) % 100;
        const lngDeg = Math.floor(Number(lngRaw) / 100);
        const lngMin = Number(lngRaw) % 100;
        const latitude =
          (latDeg + latMin / 60) * (result.groups.latd === 'S' ? -1 : 1);
        const longitude =
          (lngDeg + lngMin / 60) * (result.groups.lngd === 'W' ? -1 : 1);

        decodeResult.raw.groundStation = {
          number: result.groups.station,
          iataCode: result.groups.iata,
          icaoCode: result.groups.icao,
          coordinates: {
            latitude: Math.round(latitude * 1e6) / 1e6,
            longitude: Math.round(longitude * 1e6) / 1e6,
          },
        };
        decodeResult.raw.vdlFrequency = Number(result.groups.vfreq) / 1000.0;
        decodeResult.raw.separator = result.groups.sep;
        if (result.groups.suffix) {
          decodeResult.raw.providerSuffix = result.groups.suffix;
        }
      }
    }

    var formattedNetwork = 'Unknown';
    if (decodeResult.raw.network === 'A') {
      formattedNetwork = 'ARINC';
    } else if (decodeResult.raw.network === 'S') {
      formattedNetwork = 'SITA';
    }
    var formattedCategory = String(decodeResult.raw.category || '');
    if (formattedCategory === 'X') {
      formattedCategory = 'X (ground-to-air uplink broadcast)';
    }

    decodeResult.formatted.items = [
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Squitter (ID / Uplink Test — ground-to-air broadcast)',
      },
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
        value: String(decodeResult.raw.version),
      },
      {
        type: 'category',
        code: 'CAT',
        label: 'Category',
        value: formattedCategory,
      },
    ];

    if (decodeResult.raw.groundStation) {
      if (
        decodeResult.raw.groundStation.icaoCode &&
        decodeResult.raw.groundStation.number
      ) {
        decodeResult.formatted.items.push({
          type: 'ground_station',
          code: 'GNDSTN',
          label: 'Ground Station',
          value: `${decodeResult.raw.groundStation.icaoCode}${decodeResult.raw.groundStation.number}`,
        });
      }
      if (decodeResult.raw.groundStation.iataCode) {
        decodeResult.formatted.items.push({
          type: 'iataCode',
          code: 'IATA',
          label: 'IATA',
          value: decodeResult.raw.groundStation.iataCode,
        });
      }
      if (decodeResult.raw.groundStation.icaoCode) {
        decodeResult.formatted.items.push({
          type: 'icaoCode',
          code: 'ICAO',
          label: 'ICAO',
          value: decodeResult.raw.groundStation.icaoCode,
        });
      }
      if (decodeResult.raw.groundStation.coordinates.latitude) {
        decodeResult.formatted.items.push({
          type: 'coordinates',
          code: 'COORD',
          label: 'Ground Station Location',
          value: `${decodeResult.raw.groundStation.coordinates.latitude}, ${decodeResult.raw.groundStation.coordinates.longitude}`,
        });
      }
      if (decodeResult.raw.groundStation.airport) {
        decodeResult.formatted.items.push({
          type: 'airport',
          code: 'APT',
          label: 'Airport',
          value: `${decodeResult.raw.groundStation.airport.name} (${decodeResult.raw.groundStation.airport.icao}) in ${decodeResult.raw.groundStation.airport.location}`,
        });
      }
    }

    if (decodeResult.raw.vdlFrequency) {
      decodeResult.formatted.items.push({
        type: 'vdlFrequency',
        code: 'VDLFRQ',
        label: 'VDL Frequency',
        value: `${decodeResult.raw.vdlFrequency} MHz`,
      });
    }

    if (decodeResult.raw.separator) {
      decodeResult.formatted.items.push({
        type: 'separator',
        code: 'SEP',
        label: 'Separator Flag',
        value: String(decodeResult.raw.separator),
      });
    }

    if (decodeResult.raw.providerSuffix) {
      decodeResult.formatted.items.push({
        type: 'provider_suffix',
        code: 'PROVSFX',
        label: 'Provider Suffix',
        value: `/${decodeResult.raw.providerSuffix}`,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');

    return decodeResult;
  }
}
