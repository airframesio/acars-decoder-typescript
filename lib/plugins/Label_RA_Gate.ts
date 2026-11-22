import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import {
  addRouteGate,
  addUnreadLines,
  cutMatch,
  findRouteGate,
  GATE_STOP_LINE,
  GATE_TOKEN,
  UsedLines,
} from '../utils/gate_report';
import { ResultFormatter } from '../utils/result_formatter';

// A gate always has a digit (B47, 43, D10B, 164A, V166). This tells it apart
// from the "GATE ASSIGN" line a United crew alert repeats.
const GATE = '[A-Z]{0,3}\\d+[A-Z]?';

// United: "QUNDCULUA~1GATE ASSIGN" or "...GATE CHANGE" on the first line.
const UNITED_HEADER = /^[A-Z0-9~.]+?\s*GATE (ASSIGN|CHANGE)$/;
// "UA0942/21 KIAD LPPT": flight, day of month, ICAO origin and destination.
const UNITED_FLIGHT =
  /^([A-Z0-9]{2}\d{1,4})\/(\d{2})\s+([A-Z0-9]{4})\s+([A-Z0-9]{4})$/;
const UNITED_SENT = /^SENT:\s*(\d{2}):(\d{2}):(\d{2})Z$/;
// "GATE 43    OPEN" or "GATE G5    AVAIL 06:30"
const UNITED_GATE = new RegExp(`^GATE\\s+(${GATE})(?:\\s+(\\S.*))?$`);
// "RAMP FREQ  130.950" / "OPS FREQ   131.575", either may be blank.
const UNITED_FREQ = /^(RAMP|OPS) FREQ(?:\s+(\d+\.\d+))?$/;
// Expected on (touchdown) time at the arrival airport.
const UNITED_EON = /^EON\s+(\d{2})(\d{2})Z$/;
const UNITED_GROUND_POWER = /^GROUND PWR AVAIL\s+-([A-Z]+)-$/;
// "PLANNED GROUND TIME" then "IS 01:36" on the next line.
const UNITED_GROUND_TIME = /^IS\s+(\d{2}:\d{2})$/;
// The rest of the message is about the aircraft's next flight.
const UNITED_NEXT_FLIGHT = /^NEXT FLT\b/;

// Republic: "QUHDQDDRP~1ARRIVAL GATE" then "INFORMATION", then
// "RPA N401YX YX4450 ORD MSN ETA = 0542 GATE = 16" (IATA airports).
const REPUBLIC_HEADER = /^[A-Z0-9~.]+?ARRIVAL GATE$/;
const REPUBLIC_GATE = new RegExp(
  `^[A-Z]{3}\\s+([A-Z0-9]{2,6})\\s+([A-Z0-9]{2}\\d{1,4})\\s+([A-Z]{3})\\s+([A-Z]{3})\\s+ETA\\s*=\\s*(\\d{4})\\s+GATE\\s*=\\s*(${GATE})$`,
);

// SkyWest: "QUHDQITOO.1ARR GATE INFO" then "BFL ARRIVAL GATE 4" (IATA
// airport), sometimes on the header line itself. What follows is about the
// aircraft's next flight and crew.
const SKYWEST_HEADER = /^[A-Z0-9~.]+?ARR GATE INFO\b\s*(.*)$/;
const SKYWEST_GATE = new RegExp(`^([A-Z]{3}) ARRIVAL GATE\\s+(${GATE})$`);

// Headers of the formats above, and of Finnair connection lists (other
// flights' departure gates): the other formats are not tried on them.
const HANDLED_HEADER = /^(QUNDCULUA|QUHDQDDRP|QUHDQITOO|QUSILITOO|QUHELASAY)/;

// United Express (Air Wisconsin): "FLT 4940 IAD GATE A4C".
const FLT_AIRPORT_GATE = new RegExp(
  `^FLT\\s+(\\d{1,4})\\s+([A-Z]{3})\\s+GATE\\s+${GATE_TOKEN}\\s*$`,
);
// Frontier: "FROM PHL OPS", ..., "GATE  E8", "GATE AVAIL AT ARRIVAL  Y".
const FRONTIER_FROM = /^FROM ([A-Z]{3}) OPS$/;
const FRONTIER_GATE = new RegExp(`^GATE\\s+${GATE_TOKEN}$`);
const FRONTIER_AVAIL = 'GATE AVAIL AT ARRIVAL';
// WestJet: "WS 345 YXE-YYC" then "YYC GATE D80/OPS" (the gate's airport) or
// "ARR GATE IS NOW C26/OPS" (at the destination).
const WESTJET_ROUTE = /^(WS)\s+(\d{1,4})\s+([A-Z]{3})-([A-Z]{3})\b/;
const WESTJET_GATE = new RegExp(`^([A-Z]{3}) GATE\\s+${GATE_TOKEN}/OPS`);
const WESTJET_ARR_GATE = new RegExp(`^ARR GATE IS NOW\\s+${GATE_TOKEN}/OPS`);
// Shandong and others: "CURRENT FLIGHT:", "SC8402 ARR:ZSJN", "GATE:10".
const ARR_ICAO = /^([A-Z0-9]{2}\d{1,4}) ARR:([A-Z]{4})$/;
const COLON_GATE = new RegExp(`^GATE:\\s*${GATE_TOKEN}\\s*$`);
// LATAM: "GATE ASSIGNMENT", then "PPOS:602L" (parking position).
const LATAM_HEADER = 'GATE ASSIGNMENT';
const LATAM_PPOS = new RegExp(`^PPOS:\\s*${GATE_TOKEN}\\s*$`);

/**
 * Label RA uplinks that name the gate at the arrival airport: United
 * GATE ASSIGN / GATE CHANGE, Republic ARRIVAL GATE, SkyWest ARR GATE INFO,
 * "FLT 1658/22 AUS-DFW" + "GATE D21" (American, GoJet, Piedmont), Air
 * Wisconsin "FLT 4940 IAD GATE A4C", Frontier "FROM PHL OPS" ... "GATE E8",
 * WestJet "YYC GATE D80/OPS", "SC8402 ARR:ZSJN" + "GATE:10" and LATAM
 * "GATE ASSIGNMENT" + "PPOS:602L".
 *
 * Other airlines' RA messages that mention gates are not read here: Finnair
 * connection lists, for example, give the departure gates of other flights.
 */
export class Label_RA_Gate extends DecoderPlugin {
  name = 'label-ra-gate';

  qualifiers() {
    return {
      labels: ['RA'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const lines = message.text
      .split('\n')
      .map((l) => l.replace(/\r/g, '').trim());

    const result =
      this.decodeUnited(message, lines) ??
      this.decodeRepublic(message, lines) ??
      this.decodeSkyWest(message, lines) ??
      this.decodeOther(message, lines);
    if (result) {
      return result;
    }

    const decodeResult = this.initResult(message, 'Unknown');
    return this.failUnknown(decodeResult, message.text, options);
  }

  private decodeUnited(
    message: Message,
    lines: string[],
  ): DecodeResult | undefined {
    const header = UNITED_HEADER.exec(lines[0]);
    if (!header) {
      return undefined;
    }

    // Field lines are often indented with a tab, and a gate change can name
    // the gate more than once, so read the lines one by one: the flight line
    // first, then the sent time and the gate. The last gate wins.
    let flight: RegExpExecArray | null = null;
    let sent: RegExpExecArray | null = null;
    let gate: RegExpExecArray | null = null;
    let gateIdx = -1;
    let eon: RegExpExecArray | null = null;
    let groundPower: RegExpExecArray | null = null;
    let groundTime: RegExpExecArray | null = null;
    const freqs: Record<string, string> = {};
    const used = new Set<number>([0]);
    for (let i = 1; i < lines.length; i++) {
      if (!flight) {
        flight = UNITED_FLIGHT.exec(lines[i]);
        if (flight) used.add(i);
        continue;
      }
      // The next flight can name its own gate: leave that block unread.
      if (UNITED_NEXT_FLIGHT.test(lines[i])) {
        break;
      }
      if (!sent) {
        sent = UNITED_SENT.exec(lines[i]);
        if (sent) {
          used.add(i);
          continue;
        }
      }
      const m = UNITED_GATE.exec(lines[i]);
      if (m) {
        gate = m;
        gateIdx = i;
        continue;
      }
      const f = UNITED_FREQ.exec(lines[i]);
      if (f) {
        if (f[2]) freqs[f[1]] = f[2];
        used.add(i);
        continue;
      }
      const e = UNITED_EON.exec(lines[i]);
      if (e) {
        eon = e;
        used.add(i);
        continue;
      }
      const p = UNITED_GROUND_POWER.exec(lines[i]);
      if (p) {
        groundPower = p;
        used.add(i);
        continue;
      }
      if (lines[i] === 'PLANNED GROUND TIME') {
        const t = UNITED_GROUND_TIME.exec(lines[i + 1] ?? '');
        if (t) {
          groundTime = t;
          used.add(i);
          used.add(i + 1);
          i++;
        }
      }
    }
    if (!flight || !gate) {
      return undefined;
    }
    used.add(gateIdx);

    const decodeResult = this.initResult(
      message,
      header[1] === 'CHANGE' ? 'Gate Change' : 'Gate Assignment',
    );
    ResultFormatter.flightNumber(decodeResult, flight[1]);
    ResultFormatter.day(decodeResult, Number(flight[2]));
    ResultFormatter.departureAirport(decodeResult, flight[3]);
    ResultFormatter.arrivalAirport(decodeResult, flight[4]);
    if (sent) {
      ResultFormatter.timestamp(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(sent[1] + sent[2] + sent[3]),
      );
    }
    ResultFormatter.arrivalGate(decodeResult, gate[1]);
    if (gate[2]) {
      ResultFormatter.raw(
        decodeResult,
        'gate_status',
        'GATESTAT',
        'Gate Status',
        gate[2].trim(),
      );
    }
    if (eon) {
      const tod = DateTimeUtils.convertHHMMSSToTod(eon[1] + eon[2]);
      ResultFormatter.raw(
        decodeResult,
        'eon_time',
        'EON',
        'Estimated On Time',
        DateTimeUtils.timestampToString(tod),
        tod,
      );
    }
    if (freqs.RAMP) {
      ResultFormatter.raw(
        decodeResult,
        'ramp_frequency',
        'RAMPFREQ',
        'Ramp Frequency',
        `${freqs.RAMP} MHz`,
        Number(freqs.RAMP),
      );
    }
    if (freqs.OPS) {
      ResultFormatter.raw(
        decodeResult,
        'ops_frequency',
        'OPSFREQ',
        'Operations Frequency',
        `${freqs.OPS} MHz`,
        Number(freqs.OPS),
      );
    }
    if (groundPower) {
      ResultFormatter.raw(
        decodeResult,
        'ground_power',
        'GNDPWR',
        'Ground Power Available',
        groundPower[1],
      );
    }
    if (groundTime) {
      ResultFormatter.raw(
        decodeResult,
        'planned_ground_time',
        'GNDTIME',
        'Planned Ground Time',
        groundTime[1],
      );
    }
    return this.finish(decodeResult, lines, used);
  }

  private decodeRepublic(
    message: Message,
    lines: string[],
  ): DecodeResult | undefined {
    if (!REPUBLIC_HEADER.test(lines[0])) {
      return undefined;
    }
    for (let i = 1; i < lines.length; i++) {
      const m = REPUBLIC_GATE.exec(lines[i]);
      if (!m) {
        continue;
      }
      const used = new Set<number>([0, i]);
      if (lines[1] === 'INFORMATION') used.add(1);

      const decodeResult = this.initResult(message, 'Arrival Gate');
      ResultFormatter.tail(decodeResult, m[1]);
      ResultFormatter.flightNumber(decodeResult, m[2]);
      ResultFormatter.departureAirport(decodeResult, m[3], 'IATA');
      ResultFormatter.arrivalAirport(decodeResult, m[4], 'IATA');
      ResultFormatter.eta(decodeResult, DateTimeUtils.convertHHMMSSToTod(m[5]));
      ResultFormatter.arrivalGate(decodeResult, m[6]);
      return this.finish(decodeResult, lines, used);
    }
    return undefined;
  }

  private decodeSkyWest(
    message: Message,
    lines: string[],
  ): DecodeResult | undefined {
    const header = SKYWEST_HEADER.exec(lines[0]);
    if (!header) {
      return undefined;
    }
    // The gate line follows the header, or is on the header line itself.
    const onHeader = header[1] !== '';
    const idx = onHeader ? 0 : 1;
    const m = SKYWEST_GATE.exec(onHeader ? header[1] : (lines[1] ?? ''));
    if (!m) {
      return undefined;
    }

    const decodeResult = this.initResult(message, 'Arrival Gate');
    ResultFormatter.arrivalAirport(decodeResult, m[1], 'IATA');
    ResultFormatter.arrivalGate(decodeResult, m[2]);
    return this.finish(decodeResult, lines, new Set<number>([0, idx]));
  }

  /** The formats of other airlines, tried in turn. */
  private decodeOther(
    message: Message,
    lines: string[],
  ): DecodeResult | undefined {
    if (HANDLED_HEADER.test(lines[0])) {
      return undefined;
    }
    const decodeResult = this.initResult(message, 'Arrival Gate');
    const used =
      this.flightAirportGate(decodeResult, lines) ??
      this.frontier(decodeResult, lines) ??
      this.routeGate(decodeResult, lines) ??
      this.westJet(decodeResult, lines) ??
      this.arrIcaoGate(decodeResult, lines) ??
      this.latam(decodeResult, lines);
    if (!used) {
      return undefined;
    }
    addUnreadLines(decodeResult, lines, used);
    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }

  private flightAirportGate(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    for (let i = 0; i < lines.length; i++) {
      const m = FLT_AIRPORT_GATE.exec(lines[i]);
      if (m) {
        ResultFormatter.flightNumber(decodeResult, m[1]);
        ResultFormatter.arrivalAirport(decodeResult, m[2], 'IATA');
        ResultFormatter.arrivalGate(decodeResult, m[3]);
        return new Map([[i, '']]);
      }
    }
    return undefined;
  }

  private frontier(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    const from = lines.findIndex((l) => FRONTIER_FROM.test(l));
    if (from < 0 || !lines.some((l) => l.startsWith(FRONTIER_AVAIL))) {
      return undefined;
    }
    for (let i = 0; i < lines.length; i++) {
      if (GATE_STOP_LINE.test(lines[i])) {
        break;
      }
      const m = FRONTIER_GATE.exec(lines[i]);
      if (m) {
        const airport = FRONTIER_FROM.exec(lines[from])![1];
        ResultFormatter.arrivalAirport(decodeResult, airport, 'IATA');
        ResultFormatter.arrivalGate(decodeResult, m[1]);
        return new Map([
          [from, ''],
          [i, ''],
        ]);
      }
    }
    return undefined;
  }

  private routeGate(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    const r = findRouteGate(lines);
    if (!r) {
      return undefined;
    }
    if (r.changed) {
      decodeResult.formatted.description = 'Arrival Gate Change';
    }
    addRouteGate(decodeResult, r);
    return r.used;
  }

  private westJet(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    let route: RegExpExecArray | null = null;
    let routeIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (!route) {
        route = WESTJET_ROUTE.exec(lines[i]);
        routeIdx = i;
        continue;
      }
      const g = WESTJET_GATE.exec(lines[i]);
      const a = g ? null : WESTJET_ARR_GATE.exec(lines[i]);
      if (!g && !a) {
        continue;
      }
      ResultFormatter.flightNumber(decodeResult, route[1] + route[2]);
      ResultFormatter.departureAirport(decodeResult, route[3], 'IATA');
      // "YYC GATE D80/OPS" names the gate's airport; otherwise it is the
      // destination.
      ResultFormatter.arrivalAirport(decodeResult, g ? g[1] : route[4], 'IATA');
      ResultFormatter.arrivalGate(decodeResult, g ? g[2] : a![1]);
      return new Map([
        [routeIdx, cutMatch(lines[routeIdx], route)],
        [i, cutMatch(lines[i], (g ?? a)!)],
      ]);
    }
    return undefined;
  }

  private arrIcaoGate(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    for (let i = 0; i < lines.length; i++) {
      const m = ARR_ICAO.exec(lines[i]);
      if (!m) {
        continue;
      }
      for (let j = i + 1; j < lines.length; j++) {
        if (GATE_STOP_LINE.test(lines[j])) {
          break;
        }
        const g = COLON_GATE.exec(lines[j]);
        if (g) {
          ResultFormatter.flightNumber(decodeResult, m[1]);
          ResultFormatter.arrivalAirport(decodeResult, m[2]);
          ResultFormatter.arrivalGate(decodeResult, g[1]);
          const used: UsedLines = new Map([
            [i, ''],
            [j, ''],
          ]);
          if (lines[i - 1] === 'CURRENT FLIGHT:') used.set(i - 1, '');
          return used;
        }
      }
      return undefined;
    }
    return undefined;
  }

  private latam(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    const header = lines.findIndex((l) => l.startsWith(LATAM_HEADER));
    if (header < 0) {
      return undefined;
    }
    for (let i = 0; i < lines.length; i++) {
      if (GATE_STOP_LINE.test(lines[i])) {
        break;
      }
      const m = LATAM_PPOS.exec(lines[i]);
      if (m) {
        decodeResult.formatted.description = 'Gate Assignment';
        ResultFormatter.arrivalGate(decodeResult, m[1]);
        return new Map([
          [header, ''],
          [i, ''],
        ]);
      }
    }
    return undefined;
  }

  /** Leaves the lines not read in remaining and sets the decode level. */
  private finish(
    decodeResult: DecodeResult,
    lines: string[],
    used: Set<number>,
  ): DecodeResult {
    const rest = lines.filter((l, i) => !used.has(i) && l !== '');
    if (rest.length > 0) {
      ResultFormatter.unknown(decodeResult, rest.join('\n'), '\n');
    }
    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }
}
