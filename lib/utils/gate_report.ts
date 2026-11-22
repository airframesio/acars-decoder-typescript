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
  /^(CREW CONNECTING|CONNECTING GATE|NEXT FLT|NEXT FLIGHT|NEXT LEG|NEXT SECTOR|TURN FLT|CREW CONNECTIONS|PAX CONNECTIONS|AC TURN|END$)/;

/**
 * Lines that were read: the line's index and what is left of it ('' when
 * all of it was read). The rest goes to remaining.text.
 */
export type UsedLines = Map<number, string>;

/** Splits the text into trimmed lines. A bare CR does not end a line. */
export function gateLines(text: string): string[] {
  return text
    .replace(/\r/g, '')
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
// "FLT 5966 SYR-PHLGATE F37 ETA 707L".
const ROUTE_LINE =
  /^(-\s*|[A-Z0-9]{9}[~.]\d)?FLT\s+(\d{1,4})(?:\/(\d{2}))?\s+([A-Z]{3})-([A-Z]{3})/;
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
