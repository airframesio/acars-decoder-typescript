import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

// United "GATE ASSIGN" / "GATE CHANGE" uplinks. The first line is the
// routing header followed by the title; field lines are often indented with
// a tab, and a gate change repeats "GATE ASSIGN" inside a crew alert, so the
// text is read line by line.
const UNITED_HEADER = /^[A-Z0-9~.]*?\s*GATE (?:ASSIGN|CHANGE)\b/;
const UNITED_FLIGHT =
  /^([A-Z]{2})(\d{1,4})\/(\d{2})\s+([A-Z0-9]{4})\s+([A-Z0-9]{4})\b/;
const UNITED_SENT = /^SENT:\s*(\d{2}):(\d{2}):(\d{2})Z/;
// A gate always has a digit, which tells it apart from "GATE ASSIGN" and
// "GATE CHANGE" lines.
const UNITED_GATE = /^GATE\s+([A-Z]{0,3}\d+[A-Z]?)(?:\s+([A-Z]+))?$/;
const UNITED_FREQ = /^(RAMP|OPS) FREQ(?:\s+(\d+\.\d+))?$/;
const UNITED_EON = /^EON\s+(\d{4})Z$/;
const UNITED_GROUND_POWER = /^GROUND PWR AVAIL\s+-([A-Z]+)-$/;
const UNITED_GROUND_TIME_TITLE = /^PLANNED GROUND TIME$/;
const UNITED_GROUND_TIME = /^IS\s+(\d{2}:\d{2})$/;
// "CREW ALERT" banners and the repeated "GATE ASSIGN / HAS CHANGED" lines of
// a gate change carry nothing to decode.
const UNITED_NOISE = /^(?:\*+ CREW ALERT \*+|GATE ASSIGN|HAS CHANGED)$/;

// Republic: "RPA N401YX YX4450 ORD MSN ETA = 0542 GATE = 16" is gate 16 at
// MSN (IATA codes).
const REPUBLIC =
  /\b(?:(N[0-9A-Z]{1,5})\s+)?([A-Z0-9]{2})(\d{1,4})\s+([A-Z]{3})\s+([A-Z]{3})\s+ETA\s*=\s*(\d{4})\s+GATE\s*=\s*([A-Z]{0,3}\d+[A-Z]?)\b/;

// SkyWest: "BFL ARRIVAL GATE 4" is gate 4 at BFL (IATA). What follows
// "NEXT FLIGHT INFORMATION" is about the aircraft's next flight.
const SKYWEST_GATE = /^([A-Z]{3}) ARRIVAL GATE\s+([A-Z]{0,3}\d+[A-Z]?)$/;
const SKYWEST_NEXT = /^NEXT FLIGHT INFORMATION/;

function lines(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim());
}

/**
 * Label RA arrival gate uplinks: United GATE ASSIGN / GATE CHANGE, Republic
 * ARRIVAL GATE and SkyWest ARR GATE INFO. Each names the gate at the
 * flight's arrival airport. Finnair CONNECTION INFO lists other flights'
 * departure gates and is not decoded here.
 */
export class Label_RA_Gate extends DecoderPlugin {
  name = 'label-ra-gate';

  qualifiers() {
    return {
      labels: ['RA'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const text = message.text;
    if (text.includes('GATE ASSIGN') || text.includes('GATE CHANGE')) {
      const united = this.decodeUnited(message);
      if (united) return united;
    }
    if (text.includes('ARRIVAL GATE')) {
      const republic = this.decodeRepublic(message);
      if (republic) return republic;
    }
    if (text.includes('ARR GATE INFO')) {
      const skywest = this.decodeSkyWest(message);
      if (skywest) return skywest;
    }

    const result = this.initResult(message, 'Unknown');
    this.debug(options, `Unknown RA gate message: ${text}`);
    this.setDecodeLevel(result, false);
    return result;
  }

  private decodeUnited(message: Message): DecodeResult | undefined {
    const all = lines(message.text);
    if (!UNITED_HEADER.test(all[0])) return undefined;
    const title = /GATE CHANGE/.test(all[0])
      ? 'Gate Change'
      : 'Gate Assignment';

    let flight: RegExpMatchArray | null = null;
    let sent: RegExpMatchArray | null = null;
    let gate: RegExpMatchArray | null = null;
    let eon: RegExpMatchArray | null = null;
    let groundPower: RegExpMatchArray | null = null;
    let groundTime: RegExpMatchArray | null = null;
    const freqs: Record<string, string> = {};
    const unknown: string[] = [];

    for (let i = 1; i < all.length; i++) {
      const l = all[i];
      if (l === '') continue;
      if (!flight) {
        flight = l.match(UNITED_FLIGHT);
        if (!flight) unknown.push(l);
        continue;
      }
      let m: RegExpMatchArray | null;
      if (!sent && (m = l.match(UNITED_SENT))) {
        sent = m;
      } else if ((m = l.match(UNITED_GATE))) {
        // A gate change can name the gate more than once; the last wins.
        gate = m;
      } else if ((m = l.match(UNITED_FREQ))) {
        if (m[2]) freqs[m[1]] = m[2];
      } else if ((m = l.match(UNITED_EON))) {
        eon = m;
      } else if ((m = l.match(UNITED_GROUND_POWER))) {
        groundPower = m;
      } else if (UNITED_GROUND_TIME_TITLE.test(l)) {
        const next = all[i + 1]?.match(UNITED_GROUND_TIME);
        if (next) {
          groundTime = next;
          i++;
        } else {
          unknown.push(l);
        }
      } else if (!UNITED_NOISE.test(l)) {
        unknown.push(l);
      }
    }
    if (!flight || !gate) return undefined;

    const result = this.initResult(message, title);
    ResultFormatter.flightNumber(result, flight[1] + flight[2]);
    ResultFormatter.day(result, Number(flight[3]));
    ResultFormatter.departureAirport(result, flight[4]);
    ResultFormatter.arrivalAirport(result, flight[5]);
    if (sent) {
      ResultFormatter.timestamp(
        result,
        DateTimeUtils.convertHHMMSSToTod(sent[1] + sent[2] + sent[3]),
      );
    }
    ResultFormatter.arrivalGate(result, gate[1]);
    if (gate[2]) {
      ResultFormatter.raw(
        result,
        'gate_status',
        'GSTAT',
        'Gate Status',
        gate[2],
      );
    }
    if (eon) {
      const tod = DateTimeUtils.convertHHMMSSToTod(eon[1]);
      ResultFormatter.raw(
        result,
        'eon_time',
        'EON',
        'Estimated On Time',
        DateTimeUtils.timestampToString(tod),
        tod,
      );
    }
    if (freqs.RAMP) {
      ResultFormatter.raw(
        result,
        'ramp_frequency',
        'RAMPFREQ',
        'Ramp Frequency',
        `${freqs.RAMP} MHz`,
        Number(freqs.RAMP),
      );
    }
    if (freqs.OPS) {
      ResultFormatter.raw(
        result,
        'ops_frequency',
        'OPSFREQ',
        'Operations Frequency',
        `${freqs.OPS} MHz`,
        Number(freqs.OPS),
      );
    }
    if (groundPower) {
      ResultFormatter.raw(
        result,
        'ground_power',
        'GPU',
        'Ground Power Available',
        groundPower[1],
      );
    }
    if (groundTime) {
      ResultFormatter.raw(
        result,
        'planned_ground_time',
        'GNDTIME',
        'Planned Ground Time',
        groundTime[1],
      );
    }
    if (unknown.length > 0) ResultFormatter.unknownArr(result, unknown, '\n');
    this.setDecodeLevel(result, true);
    return result;
  }

  private decodeRepublic(message: Message): DecodeResult | undefined {
    const m = message.text.match(REPUBLIC);
    if (!m) return undefined;

    const result = this.initResult(message, 'Arrival Gate');
    const [, tail, airline, number, dep, arr, eta, gate] = m;
    if (tail) ResultFormatter.tail(result, tail);
    ResultFormatter.flightNumber(result, airline + number);
    ResultFormatter.departureAirport(result, dep, 'IATA');
    ResultFormatter.arrivalAirport(result, arr, 'IATA');
    ResultFormatter.eta(result, DateTimeUtils.convertHHMMSSToTod(eta));
    ResultFormatter.arrivalGate(result, gate);

    // The rest of the gate line is the sender's code ("RPA").
    const rest = lines(message.text)
      .slice(1)
      .filter(
        (l) => l !== '' && l !== 'INFORMATION' && !l.includes(m[0].trim()),
      );
    if (rest.length > 0) ResultFormatter.unknownArr(result, rest, '\n');
    this.setDecodeLevel(result, true);
    return result;
  }

  private decodeSkyWest(message: Message): DecodeResult | undefined {
    const all = lines(message.text);
    const unknown: string[] = [];
    let gate: RegExpMatchArray | null = null;
    for (let i = 1; i < all.length; i++) {
      const l = all[i];
      if (SKYWEST_NEXT.test(l)) {
        // The rest is about the next flight.
        unknown.push(...all.slice(i).filter((x) => x !== ''));
        break;
      }
      const m = l.match(SKYWEST_GATE);
      if (m && !gate) gate = m;
      else if (l !== '') unknown.push(l);
    }
    if (!gate) return undefined;

    const result = this.initResult(message, 'Arrival Gate');
    ResultFormatter.arrivalAirport(result, gate[1], 'IATA');
    ResultFormatter.arrivalGate(result, gate[2]);
    if (unknown.length > 0) ResultFormatter.unknownArr(result, unknown, '\n');
    this.setDecodeLevel(result, true);
    return result;
  }
}
