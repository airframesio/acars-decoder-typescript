import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
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

/**
 * Label RA gate uplinks that name the gate at the arrival airport: United
 * GATE ASSIGN / GATE CHANGE, Republic ARRIVAL GATE and SkyWest ARR GATE INFO.
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
      this.decodeSkyWest(message, lines);
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
    const used = new Set<number>([0]);
    for (let i = 1; i < lines.length; i++) {
      if (!flight) {
        flight = UNITED_FLIGHT.exec(lines[i]);
        if (flight) used.add(i);
        continue;
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
