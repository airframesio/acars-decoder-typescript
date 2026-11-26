import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { splitAgmHeader } from '../utils/agm_header';
import { Loadsheet, LoadsheetStatus, parseLoadsheet } from '../utils/loadsheet';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label C1 "LOAD INFO" uplinks (Swiss and other Lufthansa group airlines):
 * the load figures sent to the crew before the IATA loadsheet.
 *
 *   .FRAGDLH 190925
 *   AGM
 *   AN HB-JVA/MA 277A
 *   -  PRELIMINARY LOAD INFO 11:25
 *   ZFW 37329
 *   TOW 43129
 *   LAW 40629
 *   PAX C/Y 6/84
 *   MACTOW 16.8
 *   SI ZRH-WRO
 *   NOTOC: NO
 *   SALEABLE CONFIGURATION 9C/104Y
 *   FUEL IN TANKS 6000
 *   PREPARED BY ...
 *   END
 *
 * IATA AHM 517 loadsheets ("LOADSHEET FINAL ...") are decoded on every
 * label by the Loadsheet plugin, which runs first; this plugin only reads
 * the LOAD INFO layout and reports it in the same `raw.loadsheet` shape, so
 * consumers see one format for both. The preparer's name is not decoded.
 *
 * Contributed by @thepacket in #416, reworked to reuse the loadsheet output.
 */

const HEADER = /^(PRELIMINARY|FINAL) LOAD INFO(?:\s+(.*))?$/;
const CLOCK = /^([01]?\d|2[0-3]):?([0-5]\d)Z?$/;
const WEIGHT = /^(ZFW|TOW|LAW|TOF|DOW) (\d+)$/;
// "PAX C/Y 6/84", "PAX 90", "PAX/6/84"
const PAX = /^PAX(?: ([A-Z](?:\/[A-Z])*))?[ /](\d+(?:\/\d+)*)$/;
const MAC_TOW = /^MACTOW (\d+(?:[.,]\d+)?)$/;
const DOI = /^DOI (-?\d+(?:[.,]\d+)?)$/;
// "SI ZRH-WRO", optionally followed by free text
const ROUTE = /^SI ([A-Z]{3,4})[-/]([A-Z]{3,4})(?:\s+(.*))?$/;
const NOTOC = /^NOTOC ?: ?(YES|NO)$/;
const CONFIG = /^SALEABLE CONFIGURATION (\S+)$/;
const FUEL = /^FUEL IN TANKS (\d+)$/;
const PREPARED = /^PREPARED BY\b/;
const DTG = /^(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])([0-5]\d)$/;

function stripDash(line: string): string {
  return line.trim().replace(/^-\s*/, '');
}

const WEIGHT_KEYS: Record<string, 'zfw' | 'tow' | 'law' | 'tof' | 'dow'> = {
  ZFW: 'zfw',
  TOW: 'tow',
  LAW: 'law',
  TOF: 'tof',
  DOW: 'dow',
};

export class Label_C1_LoadInfo extends DecoderPlugin {
  name = 'label-c1-load-info';

  qualifiers() {
    return {
      labels: ['C1'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Load Info');
    const text = message.text || '';

    // Loadsheet.ts owns IATA loadsheets; never decode one twice.
    if (!text.includes('LOAD INFO') || parseLoadsheet(text)) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    let lines = splitAgmHeader(text, decodeResult);
    if (!lines) {
      lines = text.split(/\r\n|\r|\n/);
      // Header written one field per line: ".FRAGDLH", "190925", "AGM", "AN ..."
      while (lines.length && !HEADER.test(stripDash(lines[0]))) {
        const line = lines.shift()!.trim();
        const dtg = DTG.exec(line);
        if (/^\.[A-Z0-9]{7}$/.test(line)) {
          ResultFormatter.groundAddress(decodeResult, line.substring(1));
        } else if (dtg) {
          this.dayTime(decodeResult, dtg);
        } else if (line.startsWith('AN ')) {
          this.anFields(decodeResult, line.substring(3));
        } else if (line && line !== 'AGM') {
          ResultFormatter.unknown(decodeResult, line);
        }
      }
    }
    lines = lines.map(stripDash).filter((l) => l);

    const header = lines.length ? HEADER.exec(lines[0]) : null;
    if (!header) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const ls: Loadsheet = {
      kind: 'loadsheet',
      status: (header[1] === 'FINAL' ? 'final' : 'prelim') as LoadsheetStatus,
    };
    const issued = header[2]?.trim();
    if (issued) {
      const clock = CLOCK.exec(issued);
      if (clock) ls.time = clock[1].padStart(2, '0') + clock[2];
      else ResultFormatter.unknown(decodeResult, issued, '\n');
    }

    let fuelInTanks: number | undefined;
    let config: string | undefined;
    let afterPreparer = false;
    for (const line of lines.slice(1)) {
      // Preparer's name, and the licence number on the line after it: not
      // decoded and not kept.
      if (PREPARED.test(line)) {
        afterPreparer = true;
        continue;
      }
      const licence = afterPreparer && /^\d{5,}$/.test(line);
      afterPreparer = false;
      if (licence) continue;

      let m: RegExpExecArray | null;
      if ((m = WEIGHT.exec(line))) {
        ls[WEIGHT_KEYS[m[1]]] = Number(m[2]);
      } else if ((m = PAX.exec(line))) {
        const counts = m[2].split('/').map(Number);
        ls.pax_total = counts.reduce((a, b) => a + b, 0);
        ls.pax_breakdown = m[1] ? `${m[1]} ${m[2]}` : m[2];
      } else if ((m = MAC_TOW.exec(line))) {
        ls.mac_tow = Number(m[1].replace(',', '.'));
      } else if ((m = DOI.exec(line))) {
        ls.doi = Number(m[1].replace(',', '.'));
      } else if ((m = ROUTE.exec(line))) {
        ls.departure = m[1];
        ls.arrival = m[2];
        if (m[3]) ResultFormatter.unknown(decodeResult, m[3], '\n');
      } else if ((m = NOTOC.exec(line))) {
        ls.notoc = m[1] === 'YES';
      } else if ((m = CONFIG.exec(line))) {
        config = m[1];
      } else if ((m = FUEL.exec(line))) {
        fuelInTanks = Number(m[1]);
      } else if (line !== 'END') {
        ResultFormatter.unknown(decodeResult, line, '\n');
      }
    }

    const weights = ['zfw', 'tow', 'law', 'tof', 'dow'] as const;
    if (!weights.some((k) => ls[k] !== undefined)) {
      // Not the text: it may hold the preparer's name.
      this.debug(options, 'Load info without weights');
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    if (ls.departure)
      ResultFormatter.departureAirport(
        decodeResult,
        ls.departure,
        ls.departure.length === 4 ? 'ICAO' : 'IATA',
      );
    if (ls.arrival)
      ResultFormatter.arrivalAirport(
        decodeResult,
        ls.arrival,
        ls.arrival.length === 4 ? 'ICAO' : 'IATA',
      );
    ResultFormatter.loadsheet(decodeResult, ls);
    if (fuelInTanks !== undefined)
      ResultFormatter.currentFuel(decodeResult, fuelInTanks);
    if (config)
      ResultFormatter.raw(
        decodeResult,
        'cabin_configuration',
        'CABCFG',
        'Saleable Configuration',
        config,
      );

    this.setDecodeLevel(
      decodeResult,
      true,
      decodeResult.remaining.text ? 'partial' : 'full',
    );
    return decodeResult;
  }

  // The AN line's '/' fields, read like splitAgmHeader does.
  private anFields(decodeResult: DecodeResult, value: string) {
    for (const field of value.trim().split('/')) {
      if (field.startsWith('FI ')) {
        ResultFormatter.flightNumber(decodeResult, field.substring(3).trim());
      } else if (/^[A-Z0-9-]{3,8}$/.test(field)) {
        ResultFormatter.tail(decodeResult, field);
      } else if (field) {
        ResultFormatter.unknown(decodeResult, field, '/');
      }
    }
  }

  private dayTime(decodeResult: DecodeResult, m: RegExpExecArray) {
    ResultFormatter.day(decodeResult, Number(m[1]));
    ResultFormatter.timestamp(
      decodeResult,
      DateTimeUtils.convertHHMMSSToTod(m[2] + m[3]),
    );
  }
}
