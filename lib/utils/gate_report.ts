import { DecodeResult } from '../DecoderPluginInterface';
import { ResultFormatter } from './result_formatter';

// Gate assignments in free-text uplinks, shared by the label plugins that
// read them (Label_Gate_Report, Label_RA_Gate, Label_B3_PDC). The formats
// come from a day of production messages that mention a gate.

/**
 * A gate as airlines write it: 4, 43, D21, D43A, 210A, A4C, S113, SEC9,
 * 221R. It needs a digit, so words like OPEN or OCCUPIED never match.
 */
export const GATE_TOKEN = '([A-Z]{0,3}\\d{1,4}[A-Z]?)';

/**
 * Where a message moves on to other flights (connections, the aircraft's
 * next flight). Gate lines after it are not this flight's.
 */
export const GATE_STOP_LINE =
  /^(CREW CONNECTING|CONNECTING GATE\b|NEXT FLT|NEXT FLIGHT|NEXT LEG|NEXT SECTOR|NXM\b|- NEXT FLIGHT|ON STAND-|CREW DEPT|TURN FLT|CREW CONNECTIONS|PAX CONNECTIONS|AC TURN|END$)/;

/**
 * Lines that were read: the line's index and what is left of it ('' when
 * all of it was read). The rest goes to remaining.text.
 */
export type UsedLines = Map<number, string>;

/**
 * Splits the text into trimmed lines. A bare CR ends a line too: Piedmont
 * and Air Europa end lines that way.
 */
export function gateLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim());
}

/** The line without the part `m` matched. */
export function cutMatch(line: string, m: RegExpExecArray): string {
  return joinParts(line.slice(0, m.index), line.slice(m.index + m[0].length));
}

function joinParts(...parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter((p) => p !== '')
    .join(' ');
}

/** Puts the lines (and parts of lines) not read in remaining.text. */
export function addUnreadLines(
  decodeResult: DecodeResult,
  lines: string[],
  used: UsedLines,
): void {
  const rest = lines.map((l, i) => used.get(i) ?? l).filter((l) => l !== '');
  if (rest.length > 0) {
    ResultFormatter.unknown(decodeResult, rest.join('\n'), '\n');
  }
}

// FLT 1658/22 AUS-DFW (American, Envoy, PSA, GoJet, Piedmont). The line can
// follow an RA header or a dash ("QUSBYDDPT~1FLT 5966 SYR-PHL",
// "- FLT 0174 RDU-LHR"), and Piedmont runs the gate into the route line:
// "FLT 5966 SYR-PHLGATE F37 ETA 707L". The flight can carry the airline
// (Republic "FLT YX4704 RDU-LGA").
const ROUTE_LINE =
  /^(-\s*|[A-Z0-9]{9}[~.]\d)?FLT\s+((?:[A-Z]{2}|[A-Z]\d|\d[A-Z])?\d{1,4})(?:\/(\d{2}))?\s+([A-Z]{3})-([A-Z]{3})/;
const INLINE_GATE = new RegExp(`GATE\\s+${GATE_TOKEN}(?=\\s|$)`);
// GATE D21 AVAILABILITY PLN ETA 0721, GATE D43APCA Y ELEC Y, GATE 9
const LEADING_GATE = new RegExp(`^GATE\\s+${GATE_TOKEN}(?=\\s|PCA|$)`);
// NEW ARRIVAL GATE NBR IS  C33
const NEW_ARRIVAL_GATE = new RegExp(
  `^NEW ARRIVAL GATE NBR IS\\s+${GATE_TOKEN}\\s*$`,
);

export interface RouteGate {
  flight: string;
  day?: number;
  departure: string;
  arrival: string;
  gate: string;
  /** True for "NEW ARRIVAL GATE NBR IS", a changed gate. */
  changed: boolean;
  used: UsedLines;
}

/**
 * Reads "FLT 1658/22 AUS-DFW" and the first gate line after it, before the
 * message moves on to connections or the next flight. Airports are IATA.
 */
export function findRouteGate(lines: string[]): RouteGate | undefined {
  for (let i = 0; i < lines.length; i++) {
    const m = ROUTE_LINE.exec(lines[i]);
    if (!m) {
      continue;
    }
    const route = {
      flight: m[2],
      day: m[3] ? Number(m[3]) : undefined,
      departure: m[4],
      arrival: m[5],
    };
    // An RA header before FLT stays unread; a leading dash is dropped.
    const prefix = m[1] && !m[1].startsWith('-') ? m[1] : '';
    const after = lines[i].slice(m[0].length);
    const used: UsedLines = new Map();

    const inline = INLINE_GATE.exec(after);
    if (inline) {
      used.set(i, joinParts(prefix, cutMatch(after, inline)));
      return { ...route, gate: inline[1], changed: false, used };
    }
    used.set(i, joinParts(prefix, after));

    for (let j = i + 1; j < lines.length; j++) {
      if (GATE_STOP_LINE.test(lines[j])) {
        break;
      }
      const g = LEADING_GATE.exec(lines[j]);
      if (g) {
        used.set(j, cutMatch(lines[j], g));
        return { ...route, gate: g[1], changed: false, used };
      }
      const n = NEW_ARRIVAL_GATE.exec(lines[j]);
      if (n) {
        used.set(j, '');
        return { ...route, gate: n[1], changed: true, used };
      }
    }
    return undefined;
  }
  return undefined;
}

/** Adds a route gate to the result: flight, day, IATA airports and gate. */
export function addRouteGate(
  decodeResult: DecodeResult,
  r: RouteGate,
  withFlight: boolean = true,
): void {
  if (withFlight) {
    ResultFormatter.flightNumber(decodeResult, r.flight);
  }
  if (r.day !== undefined) {
    ResultFormatter.day(decodeResult, r.day);
  }
  ResultFormatter.departureAirport(decodeResult, r.departure, 'IATA');
  ResultFormatter.arrivalAirport(decodeResult, r.arrival, 'IATA');
  ResultFormatter.arrivalGate(decodeResult, r.gate);
}

// Delta crew P/F (labels RA and 25): "CREW P/F" or "PART  1 OF" lines, and
// "ARR ATL GTE E15". The crew list after it is left unread.
const DELTA_ARR = new RegExp(`^ARR ([A-Z]{3}) GTE\\s+${GATE_TOKEN}\\s*$`);

/** Reads the arrival gate of a Delta crew P/F message. */
export function addDeltaCrewGate(
  decodeResult: DecodeResult,
  lines: string[],
): UsedLines | undefined {
  if (
    !lines.some((l) => l.startsWith('CREW P/F') || l.startsWith('PART  1 OF'))
  ) {
    return undefined;
  }
  for (let i = 0; i < lines.length; i++) {
    const m = DELTA_ARR.exec(lines[i]);
    if (m) {
      decodeResult.formatted.description = 'Crew P/F Report';
      ResultFormatter.arrivalAirport(decodeResult, m[1], 'IATA');
      ResultFormatter.arrivalGate(decodeResult, m[2]);
      return new Map([[i, '']]);
    }
  }
  return undefined;
}

// Finnair (RA under QUHELASAY, and 3E): "AY1074 22NOV26" then "ARRIVING
// STAND 131 ELDT 12:53", or a weight and balance message's boarding gate
// "AY230    19NOV  TKU STD0600  BOARD 0540 GATE 2" (a departure gate). The
// connection lists give other flights' gates and are not read.
const FINNAIR_BOARD = new RegExp(
  `^(AY\\d{1,4})\\s+(\\d{2})[A-Z]{3}\\s+([A-Z]{3})\\s+STD\\d{4}\\s+(?:ETD\\d{4}\\s+)?BOARD\\s+\\d{4}\\s+GATE\\s+${GATE_TOKEN}(?=\\s|$)`,
);
const FINNAIR_FLIGHT = /^(AY\d{1,4})\s+(\d{2})[A-Z]{3}\d{2}$/;
const FINNAIR_STAND = new RegExp(`^ARRIVING STAND\\s+${GATE_TOKEN}(?=\\s|$)`);

/** Reads a Finnair boarding gate (departure) or arriving stand. */
export function addFinnairGate(
  decodeResult: DecodeResult,
  lines: string[],
): UsedLines | undefined {
  for (let i = 0; i < lines.length; i++) {
    const m = FINNAIR_BOARD.exec(lines[i]);
    if (m) {
      decodeResult.formatted.description = 'Departure Gate';
      ResultFormatter.flightNumber(decodeResult, m[1]);
      ResultFormatter.day(decodeResult, Number(m[2]));
      ResultFormatter.departureAirport(decodeResult, m[3], 'IATA');
      ResultFormatter.departureGate(decodeResult, m[4]);
      return new Map([[i, cutMatch(lines[i], m)]]);
    }
  }

  let flight: RegExpExecArray | null = null;
  let flightIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    // The connection lists name other flights' gates.
    if (lines[i].startsWith('CONNECTION INFO')) {
      return undefined;
    }
    const f = FINNAIR_FLIGHT.exec(lines[i]);
    if (f) {
      flight = f;
      flightIdx = i;
      continue;
    }
    const m = FINNAIR_STAND.exec(lines[i]);
    if (m) {
      decodeResult.formatted.description = 'Arrival Stand';
      const used: UsedLines = new Map([[i, cutMatch(lines[i], m)]]);
      if (flight) {
        ResultFormatter.flightNumber(decodeResult, flight[1]);
        ResultFormatter.day(decodeResult, Number(flight[2]));
        used.set(flightIdx, '');
      }
      ResultFormatter.arrivalGate(decodeResult, m[1]);
      return used;
    }
  }
  return undefined;
}

// WestJet (RA, and WestJet Encore on 41): "WS 345 YXE-YYC" (Encore:
// "FTX01,WS 3564 YVR-YLW") then "YYC GATE D80/OPS" (the gate's airport) or
// "ARR GATE IS NOW C26/OPS" (at the destination).
const WESTJET_ROUTE =
  /^(?:FTX\d{2},)?(WS)\s+(\d{1,4})\s+([A-Z]{3})-([A-Z]{3})\b/;
const WESTJET_GATE = new RegExp(`^([A-Z]{3}) GATE\\s+${GATE_TOKEN}/OPS`);
const WESTJET_ARR_GATE = new RegExp(`^ARR GATE IS NOW\\s+${GATE_TOKEN}/OPS`);

/** Reads a WestJet ops gate. */
export function addWestJetGate(
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

/** Alaska flight line: "AS1636". */
export const ALASKA_FLIGHT = /^(AS\d{1,4})$/;
// Alaska ETA acknowledgement (labels 21 and RA): "FROM:LAX OPS" / "AS1831"
// / "ARRIVAL GATE:65B".
const ALASKA_FROM = /^FROM:\s*([A-Z]{3}) OPS$/;
const ALASKA_ACK_LINE = /^ETA ACK$/;
const ALASKA_ARR_GATE = new RegExp(`^ARRIVAL GATE:\\s*${GATE_TOKEN}\\s*$`);

/**
 * Reads an Alaska ETA acknowledgement: the airport, flight and gate. The
 * gate line alone is not enough (Horizon sends a bare "ARRIVAL GATE:B9"):
 * the message must also have an "ETA ACK", "FROM:<IATA> OPS" or AS flight
 * line before the next flight.
 */
export function addAlaskaEtaAck(
  decodeResult: DecodeResult,
  lines: string[],
): UsedLines | undefined {
  let airport: string | undefined;
  let flight: string | undefined;
  let ack = false;
  let gate: string | undefined;
  const used: UsedLines = new Map();
  for (let i = 0; i < lines.length; i++) {
    if (GATE_STOP_LINE.test(lines[i])) {
      break;
    }
    if (ALASKA_ACK_LINE.test(lines[i])) {
      ack = true;
      continue;
    }
    const a = ALASKA_FROM.exec(lines[i]);
    if (a) {
      airport = a[1];
      used.set(i, '');
      continue;
    }
    const f = ALASKA_FLIGHT.exec(lines[i]);
    if (f) {
      flight = f[1];
      used.set(i, '');
      continue;
    }
    const g = gate === undefined ? ALASKA_ARR_GATE.exec(lines[i]) : null;
    if (g) {
      gate = g[1];
      used.set(i, '');
    }
  }
  if (gate === undefined || !(ack || airport || flight)) {
    return undefined;
  }
  decodeResult.formatted.description = 'ETA Acknowledgement';
  if (flight) ResultFormatter.flightNumber(decodeResult, flight);
  if (airport) {
    ResultFormatter.arrivalAirport(decodeResult, airport, 'IATA');
  }
  ResultFormatter.arrivalGate(decodeResult, gate);
  return used;
}
