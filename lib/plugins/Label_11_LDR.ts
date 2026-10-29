import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { RunwayLandingData } from '../types/runway_landing_data';
import { ResultFormatter } from '../utils/result_formatter';

/** HHMM as seconds of the day, or undefined when out of range. */
function tod(hours: string, minutes: string): number | undefined {
  const h = Number(hours);
  const m = Number(minutes);
  return h <= 23 && m <= 59 ? h * 3600 + m * 60 : undefined;
}

/** Weights are sent in thousands of pounds. */
function pounds(value: string): number {
  return Math.round(Number(value) * 1000);
}

// The header is two columns of labels over values; runways the card covers sit at the right.
const HEADER = [
  /^LDR01,(\w{4}) LANDING DATA,FLT(?:\s+METAR-(\d{2})(\d{2})Z)?\s*$/,
  /^(\d{1,4})\s+WIND\s+LDW\s*$/,
  /^TIME\s+(\d{3}|VRB)\/(\d{2,3})G(\d{2,3}|--)\s+(\d+\.\d)\s*$/,
  /^(\d{2})(\d{2})Z\s+OAT\/DEW\s*(\S*)\s*$/,
  /^\s+(-?\d{2,3})\/(-?\d{2,3})\s*(\S*)\s*$/,
  /^\s+QNH\s*(\S*)\s*$/,
  // QNH in inches of mercury, or hectopascals outside the US
  /^\s+(\d{2}\.\d{2}|\d{4})\s*(\S*)\s*$/,
];

// One block per runway: runway and length (feet), flaps, wind components, speeds and the
// AB2 stopping margin, MRLW and the AB3 margin, LDW and the ABM margin. `-` fills what the
// card could not work out.
// an unavailable runway is sent with length 0
const RUNWAY = /^(\d{1,2}[LRC]?(?:\/\S+)?(?: -\S+)?)\s+(\d{1,5})\s*$/;
// a runway heading, whole or cut off by the end of the message
const RUNWAY_START = /^\d{1,2}[LRC]?(?:\/\S+)?(?: -\S+)?(?:\s{2,}\d*)?\s*$/;
const BLOCK = [
  /^FLAPS (\d{2}|--)\s*$/,
  /^VREF\/VTGT\s+(?:(\d{2})([HT])\/(\d{2})([LR])|---\/---)\s*$/,
  /^\s*(?:(\d{3})\/(\d{3}) ([+-]\d+)|---\/---)\s+(AB\d)\s+(\d+|----)\s*$/,
  /^MRLW (\d+\.\d\/\S|-+\/-)\s+(AB\d)\s+(\d+|----)\s*$/,
  /^\s*LDW (\d+\.\d)\s+(ABM)\s+(\d+|----)\s*$/,
];

/**
 * Southwest Airlines landing data card, the uplink that answers the label 10 LDR01 request.
 */
export class Label_11_LDR extends DecoderPlugin {
  name = 'label-11-ldr';

  qualifiers() {
    return {
      labels: ['11'],
      preambles: ['LDR01,'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Landing Data');

    const nl = message.text.includes('\r\n') ? '\r\n' : '\n';
    const lines = message.text.split(/\r?\n/);
    const first = lines[0].match(HEADER[0]);
    if (!first) {
      return this.failUnknown(decodeResult, message.text, options);
    }

    const unknown: string[] = [];
    ResultFormatter.landingAirport(decodeResult, first[1]);
    const metar = first[2] === undefined ? undefined : tod(first[2], first[3]);
    if (first[2] !== undefined && metar === undefined) {
      unknown.push(`METAR-${first[2]}${first[3]}Z`);
    }
    if (metar !== undefined) {
      ResultFormatter.raw(
        decodeResult,
        'metar_time',
        'METAR',
        'METAR Time',
        DateTimeUtils.timestampToString(metar),
        metar,
      );
    }

    const runways: string[] = [];
    let i = 1;
    for (; i < HEADER.length && i < lines.length; i++) {
      const m = lines[i].match(HEADER[i]);
      if (!m) break;
      if (i === 1) {
        ResultFormatter.flightNumber(decodeResult, m[1]);
      } else if (i === 2) {
        if (m[1] === 'VRB') {
          ResultFormatter.variableWind(decodeResult, Number(m[2]));
        } else {
          ResultFormatter.wind(decodeResult, Number(m[1]), Number(m[2]));
        }
        if (m[3] !== '--') {
          ResultFormatter.raw(
            decodeResult,
            'wind_gust',
            'GUST',
            'Wind Gust',
            `${Number(m[3])} knots`,
            Number(m[3]),
          );
        }
        ResultFormatter.raw(
          decodeResult,
          'landing_weight',
          'LDW',
          'Landing Weight',
          `${pounds(m[4])} pounds`,
          pounds(m[4]),
        );
      } else if (i === 3) {
        const time = tod(m[1], m[2]);
        if (time === undefined) {
          unknown.push(`${m[1]}${m[2]}Z`);
        } else {
          ResultFormatter.timestamp(decodeResult, time);
        }
        runways.push(m[3]);
      } else if (i === 4) {
        ResultFormatter.temperature(decodeResult, `${Number(m[1])}`);
        ResultFormatter.raw(
          decodeResult,
          'dew_point',
          'DEWPT',
          'Dew Point (C)',
          `${Number(m[2])} degrees`,
          Number(m[2]),
        );
        runways.push(m[3]);
      } else if (i === 5) {
        runways.push(m[1]);
      } else {
        ResultFormatter.raw(
          decodeResult,
          'altimeter',
          'ALTIM',
          'Altimeter',
          `${m[1]} ${m[1].includes('.') ? 'inHg' : 'hPa'}`,
          Number(m[1]),
        );
        runways.push(m[2]);
      }
    }
    const listed = runways.filter((r) => r !== '');
    if (listed.length > 0) {
      ResultFormatter.raw(
        decodeResult,
        'runways',
        'RWYS',
        'Runways',
        listed.join(', '),
        listed,
      );
    }

    const rest = lines.slice(i);
    let at = 0;
    if (rest[0]?.trim() === 'REMARKS') {
      const remarks: string[] = [];
      for (at = 1; at < rest.length && !RUNWAY_START.test(rest[at]); at++) {
        if (rest[at].trim() !== '') remarks.push(rest[at].trim());
      }
      if (remarks.length > 0) {
        ResultFormatter.raw(
          decodeResult,
          'remarks',
          'RMK',
          'Remarks',
          remarks.join(' '),
        );
      }
    }

    const blocks: RunwayLandingData[] = [];
    while (at < rest.length) {
      const block = this.runwayBlock(rest.slice(at, at + 1 + BLOCK.length));
      if (block) {
        blocks.push(block);
        at += 1 + BLOCK.length;
        continue;
      }
      const line = rest[at];
      const head = line.match(RUNWAY);
      const next = rest.slice(at + 1).find((l) => l.trim() !== '');
      if (
        head &&
        next !== undefined &&
        !next.startsWith('FLAPS') &&
        !RUNWAY_START.test(next)
      ) {
        // a runway sent with notes instead of figures, e.g. MQTW 148.0 EXCEEDED
        blocks.push({
          runway: head[1],
          length: Number(head[2]),
          stoppingMargins: {},
        });
        at++;
        continue;
      }
      const last = blocks[blocks.length - 1];
      if (line.trim() !== '') {
        if (last && !RUNWAY_START.test(line)) {
          // a note under a runway, e.g. 20KT TAILGUST >10 LIMIT
          last.notes = [...(last.notes ?? []), line.trim()];
        } else {
          // a runway block cut off by the end of the message
          unknown.push(...rest.slice(at).filter((l) => l.trim() !== ''));
          break;
        }
      }
      at++;
    }
    for (const block of blocks) {
      ResultFormatter.runwayLandingData(decodeResult, block);
    }
    if (unknown.length > 0) {
      ResultFormatter.unknown(decodeResult, unknown.join(nl), nl);
    }

    // a card cut off inside its header leaves nothing unknown, but it is not whole
    this.setDecodeLevel(
      decodeResult,
      true,
      i < HEADER.length ? 'partial' : undefined,
    );
    return decodeResult;
  }

  /** The six lines of one runway, or undefined if they are not a whole block. */
  private runwayBlock(lines: string[]): RunwayLandingData | undefined {
    const head = lines[0]?.match(RUNWAY);
    if (!head || lines.length < 1 + BLOCK.length) return undefined;
    const m = BLOCK.map((re, n) => lines[n + 1].match(re));
    if (m.some((x) => !x)) return undefined;
    const [flaps, wind, speeds, mrlw, ldw] = m as RegExpMatchArray[];

    const data: RunwayLandingData = {
      runway: head[1],
      length: Number(head[2]),
      stoppingMargins: {},
    };
    if (flaps[1] !== '--') data.flaps = Number(flaps[1]);
    if (wind[1] !== undefined) {
      data.headwind = Number(wind[1]) * (wind[2] === 'T' ? -1 : 1);
      data.crosswind = Number(wind[3]);
      data.crosswindSide = wind[4] as 'L' | 'R';
    }
    if (speeds[1] !== undefined) {
      data.vref = Number(speeds[1]);
      data.vtarget = Number(speeds[2]);
      data.additive = Number(speeds[3]);
    }
    if (!mrlw[1].startsWith('-')) data.maxLandingWeight = mrlw[1];
    data.landingWeight = pounds(ldw[1]);
    for (const [setting, feet] of [
      [speeds[4], speeds[5]],
      [mrlw[2], mrlw[3]],
      [ldw[2], ldw[3]],
    ]) {
      if (feet !== '----') data.stoppingMargins[setting] = Number(feet);
    }
    return data;
  }
}
