import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 41 — Airborne Maintenance / CMC Fault Report
 *
 * Downlink generated automatically by the aircraft's Central Maintenance
 * Computer (CMC) / ACMS when a system fault is detected in flight.
 * Observed on JetBlue (and likely other operators) with the `/FB`
 * sub-label prefix.
 *
 * Wire format:
 *
 *    /FB 0340 /AD MDST / N 39.321,W 74.146 , JBU837 , MCM03 , AIR PACK 1 REGUL FAULT ,,,,,,,,,
 *    |   |    |  |       |                   |        |        |                        |
 *    |   |    |  |       |                   |        |        |                        └ Reserved / unused fields (ignored)
 *    |   |    |  |       |                   |        |        └── Plain-English CMC maintenance message text
 *    |   |    |  |       |                   |        └─────────── CMC message / fault code (e.g. MCM03)
 *    |   |    |  |       |                   └──────────────────── ICAO flight identifier (callsign)
 *    |   |    |  |       └──────────────────────────────────────── Aircraft position at time of fault (N/S lat, E/W lon)
 *    |   |    |  └──────────────────────────────────────────────── Address destination (maintenance routing code)
 *    |   |    └─────────────────────────────────────────────────── Address field key
 *    |   └──────────────────────────────────────────────────────── Message time, HHMM UTC
 *    └──────────────────────────────────────────────────────────── `/FB` sub-label prefix
 *
 * The `/AD` routing token and the CMC message code are surfaced raw —
 * their exact semantics are operator-specific and not formally
 * documented, so they are presented without invented interpretation.
 */
export class Label_41_Fault extends DecoderPlugin {
  name = 'label-41-fault';

  qualifiers() {
    return {
      labels: ['41'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Airborne Maintenance / CMC Fault Report',
    );

    const text = (message.text || '').replace(/\r/g, '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // ── Header: /FB <HHMM> /AD <addr> /<rest-is-comma-separated> ──
    const headerRe =
      /^\/FB\s+(?<time>\d{4})\s*\/AD\s+(?<addr>[A-Z0-9]+)\s*\/(?<rest>.+)$/;
    const h = text.match(headerRe);
    if (!h?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }
    const { time, addr, rest } = h.groups;

    // HHMM range validation
    const hh = Number(time.substring(0, 2));
    const mm = Number(time.substring(2, 4));
    if (hh > 23 || mm > 59) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Parse comma-separated body fields after the leading `/`.
    const parts = rest.split(',').map((s) => s.trim());
    // Position is the first two comma-separated tokens (N 39.321, W 74.146)
    const posLat = parts[0] || '';
    const posLon = parts[1] || '';
    const flight = (parts[2] || '').trim();
    const mcmCode = (parts[3] || '').trim();
    const faultText = (parts[4] || '').trim();

    // Parse lat/lon tokens like "N 39.321" / "W 74.146"
    const latMatch = posLat.match(/^([NS])\s*(\d+(?:\.\d+)?)$/);
    const lonMatch = posLon.match(/^([EW])\s*(\d+(?:\.\d+)?)$/);

    // ── raw + standard formatters ──
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(time + '00'),
    );
    decodeResult.raw.report_time = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
    decodeResult.raw.ad_destination = addr;

    if (latMatch && lonMatch) {
      const lat =
        Number(latMatch[2]) * (latMatch[1] === 'S' ? -1 : 1);
      const lon =
        Number(lonMatch[2]) * (lonMatch[1] === 'W' ? -1 : 1);
      ResultFormatter.position(decodeResult, {
        latitude: lat,
        longitude: lon,
      });
    }

    if (/^[A-Z]{2,3}\d{1,5}[A-Z]?$/.test(flight)) {
      ResultFormatter.flightNumber(decodeResult, flight);
      decodeResult.raw.flight_id = flight;
    }
    if (mcmCode) decodeResult.raw.cmc_message_code = mcmCode;
    if (faultText) decodeResult.raw.fault_text = faultText;

    // ── formatted (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'CMC Maintenance Fault Report (Label 41)',
      },
      {
        type: 'sub_label',
        code: 'SUBLBL',
        label: 'Sub-Label',
        value: '/FB',
      },
    );
    decodeResult.formatted.items.push(
      {
        type: 'report_time',
        code: 'TIME',
        label: 'Fault Time (UTC, HHMM)',
        value: `${time.substring(0, 2)}:${time.substring(2, 4)}`,
      },
      {
        type: 'ad_destination',
        code: 'ADDR',
        label: 'Address (maintenance routing)',
        value: addr,
      },
    );
    if (mcmCode) {
      decodeResult.formatted.items.push({
        type: 'cmc_message_code',
        code: 'MCMCODE',
        label: 'CMC Message Code',
        value: mcmCode,
      });
    }
    if (faultText) {
      decodeResult.formatted.items.push({
        type: 'fault_text',
        code: 'FAULT',
        label: 'Fault Description',
        value: faultText,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
