import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

const POS_REGEX = /^(?<latd>[NS])(?<lat>.+)(?<lngd>[EW])(?<lng>.+)/;
const WS_REGEX = /\s+/;
const NEWLINE_REGEX = /\r?\n/;
const OOOI_REPORT_REGEX = /\b(OUTRP|OFFRP|ONRP|INRP|SUMMRY)\b/;
const CLOCK_REGEX = /^([01]\d|2[0-3])[0-5]\d([0-5]\d)?$/;
// JetBlue prefixes the header with '/FB 0123/AD KDTW/<position>,' where the
// position is 'N4222.1,W07101.1' (degrees and decimal minutes) or
// 'N 42.371,W 71.006' (decimal degrees)
const PREFIX_POSITION_REGEX =
  /^(?<tags>.*\/)(?<latd>[NS]) ?(?<lat>\d+\.\d+),(?<lngd>[EW]) ?(?<lng>\d+\.\d+),(?<header>.*)$/;

// The same airline-defined layout carries the OOOI reports on other labels
// (e.g. 30 OUT, 31 OFF, 32 ON, 33 IN, 82 OUT, 8D IN), mixed with unrelated
// messages, so on those labels only the OOOI report types are decoded.
const OOOI_REPORT_DESCRIPTIONS: Record<string, string> = {
  OUTRP: 'Out of Gate Report',
  OFFRP: 'Takeoff Report',
  ONRP: 'Landing Report',
  INRP: 'In Gate Report',
  SUMMRY: 'Flight Summary Report',
};

// Other report types of the same layout that some airlines send on other
// labels: Horizon in range reports on 28, Avianca position reports on 83
// and GOL 'ETA RPT\r\nETA 0912' on 33.
const OTHER_LABEL_REPORTS: Record<string, RegExp> = {
  '28': /^\d[0-9A-Z]\d{2} INRANG /,
  '83': /^\d[0-9A-Z]\d{2} POSRPT /,
  '33': /^ETA ?RPT$/,
};
const REPORT_DESCRIPTIONS: Record<string, string> = {
  INRANG: 'In Range Report',
  DEPDLY: 'Departure Delay Report',
};
const REPORT_TYPE_REGEX = /^\S+ (INRANG|DEPDLY)\b/;
// 'ETA0551': the ETA tag without the space
const ETA_NO_SPACE_REGEX = /^ETA(\d{4})$/;
// '3N01 POSRPT/1665/ORGDATE0437/15 LTAJ/EDDL .TC-CPD' (Pegasus)
const ORGDATE_HEADER_REGEX =
  /^(\S+ [A-Z]+)\/([A-Z0-9]+)\/(ORGDATE\d{4})\/(.*)$/;
const ICAO_REGEX = /^[A-Z][A-Z0-9]{3}$/;
// degrees 0-90 / 0-180, minutes and seconds 0-59
function validDms(m: RegExpExecArray): boolean {
  const n = m.slice(2).map(Number);
  return (
    n[0] <= 90 &&
    n[1] < 60 &&
    n[2] < 60 &&
    n[4] <= 180 &&
    n[5] < 60 &&
    n[6] < 60
  );
}
const DMS_POS_REGEX =
  /^([NS])(\d{2})(\d{2})(\d{2})([EW])(\d{3})(\d{2})(\d{2})$/;

// Airline Defined
// 3N01 POSRPT
export class Label_80 extends DecoderPlugin {
  name = 'label-80';

  qualifiers() {
    return {
      labels: ['80', '30', '31', '32', '33', '82', '8D', '28', '83'],
      preambles: [],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Airline Defined Position Report',
    );

    const lines = message.text.split(NEWLINE_REGEX);
    const reportType = OOOI_REPORT_REGEX.exec(lines[0])?.[1];
    if (reportType) {
      decodeResult.formatted.description = OOOI_REPORT_DESCRIPTIONS[reportType];
    } else if (
      message.label !== '80' &&
      !OTHER_LABEL_REPORTS[message.label]?.test(lines[0].trim())
    ) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }
    const otherType = REPORT_TYPE_REGEX.exec(lines[0])?.[1];
    if (otherType) {
      decodeResult.formatted.description = REPORT_DESCRIPTIONS[otherType];
    }

    if (!reportType && lines.length === 1 && lines[0].includes(',')) {
      this.parseCsvFormat(lines[0], decodeResult);
    } else {
      let header = lines[0].trim();
      const prefix = reportType
        ? PREFIX_POSITION_REGEX.exec(header)?.groups
        : undefined;
      if (prefix) {
        for (const tag of prefix.tags.split('/')) {
          if (tag.trim()) this.parseTags(tag.trim(), decodeResult);
        }
        ResultFormatter.position(decodeResult, {
          latitude:
            (prefix.latd === 'S' ? -1 : 1) * this.prefixCoordinate(prefix.lat),
          longitude:
            (prefix.lngd === 'W' ? -1 : 1) * this.prefixCoordinate(prefix.lng),
        });
        header = prefix.header.trim();
      }
      const headerParts = header.split(',');
      for (let i = 0; i < headerParts.length - 1; i++) {
        const moreFields = headerParts[i].split('/');
        for (const more of moreFields) {
          this.parseTags(more.trim(), decodeResult);
        }
      }

      this.parseHeader(
        headerParts[headerParts.length - 1].trim(),
        decodeResult,
      );

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('/');
        for (const part of parts) {
          this.parseTags(part.trim(), decodeResult);
        }
      }
    }

    if (decodeResult.formatted.items.length > 0) {
      this.setDecodeLevel(decodeResult, true);
    }

    return decodeResult;
  }

  private parseHeader(header: string, results: DecodeResult) {
    //3N01 POSRPT 0581/27 KIAD/MSLP .N962AV/04H 11:02
    const orgDate = ORGDATE_HEADER_REGEX.exec(header);
    if (orgDate) {
      ResultFormatter.unknown(results, orgDate[3], '/');
      header = `${orgDate[1]} ${orgDate[2]}/${orgDate[4]}`;
    }
    const fields = header.split('/');
    if (fields.length < 3) {
      ResultFormatter.unknown(results, header, '/');
      return;
    }
    const msgInfo = fields[0].trim().split(WS_REGEX);
    if (msgInfo.length === 3) {
      ResultFormatter.unknownArr(results, msgInfo.slice(0, 2), ' ');
      ResultFormatter.flightNumber(results, msgInfo[2]);
    } else {
      ResultFormatter.unknown(results, header, '/');
      return;
    }

    const otherInfo1 = fields[1].split(WS_REGEX);
    if (otherInfo1.length === 2) {
      ResultFormatter.day(results, parseInt(otherInfo1[0], 10));
      ResultFormatter.departureAirport(results, otherInfo1[1]);
    } else if (otherInfo1.length === 1 && ICAO_REGEX.test(otherInfo1[0])) {
      // Avianca leaves the day out: '3N01 POSRPT 0054/SKBO/LFPG .N786AV/03A04:38'
      ResultFormatter.departureAirport(results, otherInfo1[0]);
    } else {
      ResultFormatter.unknownArr(results, otherInfo1, ' ');
    }

    const otherInfo2 = fields[2].trim().split(WS_REGEX);
    if (otherInfo2.length === 2) {
      ResultFormatter.arrivalAirport(results, otherInfo2[0]);
      ResultFormatter.tail(results, otherInfo2[1].replace('.', ''));
    } else {
      ResultFormatter.unknownArr(results, otherInfo2, ' ');
    }

    // single-line reports carry their tags after the header,
    // e.g. '1001 OUTRP 1925/21 KBOS/MMGL .XA-VSX/OUT 1245/FOB  171'
    for (let i = 3; i < fields.length; i++) {
      this.parseTags(fields[i].trim(), results);
    }
  }

  private parseTags(part: string, results: DecodeResult) {
    const etaNoSpace = ETA_NO_SPACE_REGEX.exec(part);
    if (etaNoSpace) {
      if (CLOCK_REGEX.test(etaNoSpace[1])) {
        ResultFormatter.eta(
          results,
          DateTimeUtils.convertHHMMSSToTod(etaNoSpace[1]),
        );
      } else {
        ResultFormatter.unknown(results, part, '/');
      }
      return;
    }
    const kvPair = part.split(WS_REGEX);
    if (kvPair.length < 2) {
      ResultFormatter.unknown(results, part, '/');
      return;
    }
    const tag = kvPair[0];
    const val = kvPair.slice(1).join(' ');

    switch (tag) {
      case 'POS': {
        // Emirates sends degrees, minutes and seconds: 'N224617E0553655'
        const dms = DMS_POS_REGEX.exec(val);
        if (dms && !validDms(dms)) {
          ResultFormatter.unknown(results, part, '/');
          break;
        }
        if (dms) {
          const deg = (d: string, m: string, sec: string) =>
            Number(
              (Number(d) + Number(m) / 60 + Number(sec) / 3600).toFixed(4),
            );
          ResultFormatter.position(results, {
            latitude: (dms[1] === 'S' ? -1 : 1) * deg(dms[2], dms[3], dms[4]),
            longitude: (dms[5] === 'W' ? -1 : 1) * deg(dms[6], dms[7], dms[8]),
          });
          break;
        }
        // don't use decodeStringCoordinates because of different position format
        const posResult = POS_REGEX.exec(val);
        const lat =
          Number(posResult?.groups?.lat) *
          (posResult?.groups?.latd === 'S' ? -1 : 1);
        const lon =
          Number(posResult?.groups?.lng) *
          (posResult?.groups?.lngd === 'W' ? -1 : 1);
        if (!posResult || isNaN(lat) || isNaN(lon)) {
          // Pegasus 'POS -----': not reported
          ResultFormatter.unknown(results, part, '/');
          break;
        }
        const position = {
          latitude: Number.isInteger(lat) ? lat / 1000 : lat / 100,
          longitude: Number.isInteger(lon) ? lon / 1000 : lon / 100,
        };
        ResultFormatter.position(results, position);
        break;
      }
      case 'OUT':
      case 'OFF':
      case 'ON':
      case 'IN': {
        if (!CLOCK_REGEX.test(val)) {
          ResultFormatter.unknown(results, part, '/');
          break;
        }
        const tod = DateTimeUtils.convertHHMMSSToTod(val);
        if (tag === 'OUT') ResultFormatter.out(results, tod);
        else if (tag === 'OFF') ResultFormatter.off(results, tod);
        else if (tag === 'ON') ResultFormatter.on(results, tod);
        else ResultFormatter.in(results, tod);
        break;
      }
      case 'ATD':
        // departure delay report: 'ATD 0713/ETD 0705/ETO 0733/FOB 13297'
        if (!CLOCK_REGEX.test(val)) {
          ResultFormatter.unknown(results, part, '/');
          break;
        }
        ResultFormatter.out(results, DateTimeUtils.convertHHMMSSToTod(val));
        break;
      case 'ETD':
        if (!CLOCK_REGEX.test(val)) {
          ResultFormatter.unknown(results, part, '/');
          break;
        }
        ResultFormatter.etd(results, DateTimeUtils.convertHHMMSSToTod(val));
        break;
      case 'ALT': {
        // feet ('ALT +35001', 'ALT 01386'), or a flight level when under
        // 1000 like FL below (Emirates 'ALT 319' next to 'TAS 506')
        if (!/^[+-]?\d+$/.test(val)) {
          ResultFormatter.unknown(results, part, '/');
          break;
        }
        const alt = parseInt(val.replace('+', ''), 10);
        ResultFormatter.altitude(results, alt >= 1000 ? alt : alt * 100);
        break;
      }
      case 'FL': {
        // "FL 360", or feet: Avianca "FL 40001"
        const fl = parseInt(val, 10);
        ResultFormatter.altitude(results, fl >= 1000 ? fl : fl * 100);
        break;
      }
      case 'MCH':
        if (/^\.\d{2,3}$/.test(val)) {
          // Avianca 'MCH    .86'
          ResultFormatter.mach(results, Number(val));
        } else if (/^\d{3}$/.test(val) && Number(val) >= 100) {
          // 'MCH 782' is Mach 0.782
          ResultFormatter.mach(results, Number(val) / 1000);
        } else {
          // Emirates 'MCH 001' is not a Mach number
          ResultFormatter.unknown(results, part, '/');
        }
        break;
      case 'SPD':
        ResultFormatter.groundspeed(results, parseInt(val, 10));
        break;
      case 'TAS':
        ResultFormatter.airspeed(results, parseInt(val, 10));
        break;
      case 'SAT':
        // Avianca pads the sign: 'SAT - 52'
        ResultFormatter.temperature(results, val.replace(/\s+/g, ''));
        break;
      case 'FB':
        // ignoring, assuming FOB and avoiding duplicates.
        break;
      case 'FOB': {
        // Strip non-numeric like 'N' in 'N009414'; '----' means not reported
        const fuel = parseInt(val.replace(/\D/g, ''), 10);
        if (!isNaN(fuel)) {
          // a SUMMRY carries one figure per event; keep the last one only
          if (results.raw.fuel_on_board !== undefined) {
            results.formatted.items = results.formatted.items.filter(
              (item) => item.code !== 'FOB',
            );
          }
          ResultFormatter.currentFuel(results, fuel);
        }
        break;
      }
      case 'UTC':
        ResultFormatter.timestamp(
          results,
          DateTimeUtils.convertHHMMSSToTod(val),
        );
        break;
      case 'ETA': {
        const hhmm = val.split('.')[0].replace(':', '');
        if (!CLOCK_REGEX.test(hhmm)) {
          ResultFormatter.unknown(results, part, '/');
          break;
        }
        ResultFormatter.eta(results, DateTimeUtils.convertHHMMSSToTod(hhmm));
        break;
      }
      case 'HDG':
        if (!/^\d+(\.\d+)?$/.test(val)) {
          ResultFormatter.unknown(results, part, '/');
          break;
        }
        // Avianca 'HDG  76.81'
        ResultFormatter.heading(results, Number(val));
        break;
      case 'NWYP':
        results.raw.next_waypoint = val;
        break;
      case 'SWN':
        // wind speed, do nothing for
        ResultFormatter.unknown(results, part, '/');
        break;
      case 'DWN':
        // wind direction, do nothing for now
        ResultFormatter.unknown(results, part, '/');
        break;
      case 'AD':
        // do nothing, as it shows in the header
        break;
      default:
        ResultFormatter.unknown(results, part, '/');
    }
  }
  // 'DDMM.m' / 'DDDMM.m' when the whole part has 4 or more digits,
  // decimal degrees otherwise
  private prefixCoordinate(value: string): number {
    const whole = value.split('.')[0];
    const n = Number(value);
    if (whole.length < 4) {
      return n;
    }
    const degrees = Math.floor(n / 100);
    return Number((degrees + (n - degrees * 100) / 60).toFixed(4));
  }

  private parseCsvFormat(text: string, results: DecodeResult) {
    const csvParts = text.split(',');
    if (csvParts.length !== 9) {
      return;
    }
    const header = csvParts[0].trim().split(WS_REGEX);
    ResultFormatter.unknown(results, header[0], ' ');
    ResultFormatter.unknown(results, header[1], ' ');
    ResultFormatter.position(
      results,
      CoordinateUtils.decodeStringCoordinates(header[2]),
    );
    ResultFormatter.unknown(results, csvParts[1]);
    ResultFormatter.timestamp(
      results,
      DateTimeUtils.convertHHMMSSToTod(csvParts[2]),
    );
    ResultFormatter.unknownArr(results, csvParts.slice(4, 6), ',');
    ResultFormatter.temperature(
      results,
      (
        (csvParts[6].charAt(0) === 'M' ? -1 : 1) *
        parseInt(csvParts[6].slice(1), 10)
      ).toString(),
    );
    ResultFormatter.airspeed(results, parseInt(csvParts[7], 10));
    ResultFormatter.currentFuel(results, parseInt(csvParts[8], 10));
  }
}
