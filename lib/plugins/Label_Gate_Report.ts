import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { splitAgmHeader } from '../utils/agm_header';
import {
  addDeltaCrewGate,
  addRouteGate,
  addUnreadLines,
  cutMatch,
  findRouteGate,
  GATE_STOP_LINE,
  GATE_TOKEN,
  gateLines,
  UsedLines,
} from '../utils/gate_report';
import { ResultFormatter } from '../utils/result_formatter';

// Hawaiian, label 3T: "ARR GATE MSG" then "804 ARR GATE 69A".
const HAWAIIAN_ARR = new RegExp(
  `^(\\d{1,4})\\s+ARR GATE\\s+${GATE_TOKEN}\\s*$`,
);
// Hawaiian, label 40: "HA0805 AT GATE A6".
const HAWAIIAN_AT_GATE = new RegExp(
  `^(HA\\d{1,4})\\s+AT GATE\\s+${GATE_TOKEN}\\s*$`,
);
// Envoy, label 40: "FLT 4258   ARRIVING DCA" then
// "ARRIVAL GATE D43A  BAG CLAIM AREA 9".
const ENVOY_ARRIVING = /^FLT\s+(\d{1,4})\s+ARRIVING\s+([A-Z]{3})\b/;
const ENVOY_GATE = new RegExp(`^ARRIVAL GATE\\s+${GATE_TOKEN}(?=\\s|$)`);
// JetBlue in-range, labels 41 and 42: "INR,221156,  GATE:514", the gate on
// the first line or a later one.
const JETBLUE_INR = /^INR,\d{6}\b/;
const JETBLUE_GATE = new RegExp(`GATE:\\s*${GATE_TOKEN}\\s*$`);
// Jetstar, label C1: "ARRIVAL GATE THIS FLT:43".
const JETSTAR = new RegExp(`^ARRIVAL GATE THIS FLT:\\s*${GATE_TOKEN}\\s*$`);
// Jazz, label C1: "- JZA GATE DATA UPLINK", "FLIGHT: 8063/22Nov26/YYC/YVR",
// "PLANNED ARRIVAL GATE IS C42".
// The dash line is gone when an AGM header was split off.
const JAZZ_HEADER = /^(?:-\s{1,2})?JZA GATE DATA UPLINK/;
const JAZZ_FLIGHT =
  /^FLIGHT:\s*(\d{1,4})\/(\d{2})[A-Za-z]{3}\d{2}\/([A-Z]{3})\/([A-Z]{3})/;
const JAZZ_PLANNED = new RegExp(
  `^PLANNED ARRIVAL GATE IS\\s+${GATE_TOKEN}\\s*$`,
);
// Jetstar gate change, label C1: "JQ782/22 Nov MEL-ADL", "GATE CHANGE
// MESSAGE - ARRIVAL", "PREVIOUS GATE: 25", "NEW GATE: 23".
const JETSTAR_CHANGE_HEADER = 'GATE CHANGE MESSAGE - ARRIVAL';
const JETSTAR_ROUTE =
  /^([A-Z0-9]{2}\d{1,4})\/(\d{2}) [A-Za-z]{3} ([A-Z]{3})-([A-Z]{3})\b/;
// Jazz flight data, label C1: "DEP YVR/06:20Z/GTE C40" and
// "ARR YYC/07:48Z/GTE A17", the departure and the arrival gate.
const JAZZ_DEP = new RegExp(
  `^DEP ([A-Z]{3})/[0-9:]+Z/GTE\\s+${GATE_TOKEN}\\s*$`,
);
const JAZZ_ARR = new RegExp(
  `^ARR ([A-Z]{3})/[0-9:]+Z/GTE\\s+${GATE_TOKEN}\\s*$`,
);
// Virgin Australia, label 3M: "VA1007, BAY: 45A".
const VIRGIN_BAY = new RegExp(`^(VA\\d{1,4}), BAY:\\s*${GATE_TOKEN}\\s*$`);
// PSA crew acknowledgement, label 5Z, first line: "/ACKFLT GATE F1".
const PSA_ACK = new RegExp(`^/ACKFLT GATE\\s+${GATE_TOKEN}\\s*$`);
// Alaska, label 21: "GATE CHANGE IN LAX" / "AS1636" / "NEW GATE: 210A".
const ALASKA_CHANGE = /^GATE CHANGE IN ([A-Z]{3})$/;
const ALASKA_FLIGHT = /^(AS\d{1,4})$/;
const NEW_GATE = new RegExp(`^NEW GATE:\\s*${GATE_TOKEN}\\s*$`);

/**
 * Arrival gates in airline messages on labels 40, 41, 42, C1, 21, 3T, 5Z,
 * 25 and 3M:
 *
 * - "FLT 1658/22 AUS-DFW" then "GATE D21 ..." or "NEW ARRIVAL GATE NBR IS
 *   C33" (American, Envoy, PSA, GoJet, Piedmont; labels 40, 41, C1)
 * - Envoy "FLT 4258 ARRIVING DCA" / "ARRIVAL GATE D43A" (40)
 * - Hawaiian "804 ARR GATE 69A" (3T) and "HA0805 AT GATE A6" (40)
 * - JetBlue in-range "INR,221156,  GATE:514" (41, 42)
 * - Jetstar "ARRIVAL GATE THIS FLT:43" and gate change "NEW GATE: 23" (C1)
 * - Jazz "JZA GATE DATA UPLINK" / "PLANNED ARRIVAL GATE IS C42" (C1)
 * - Jazz flight data "DEP YVR/06:20Z/GTE C40" / "ARR YYC/07:48Z/GTE A17",
 *   both gates (C1)
 * - PSA crew acknowledgement "/ACKFLT GATE F1" (5Z)
 * - Delta crew P/F "ARR ATL GTE E15" (25)
 * - Virgin Australia "VA1007, BAY: 45A" (3M)
 * - Alaska "GATE CHANGE IN LAX" / "NEW GATE: 210A" (21)
 *
 * Each format is read only on the labels it was seen on, and reading stops
 * where the message moves on to connections or the next flight, whose gates
 * are other flights'. It is registered after the other plugins on these
 * labels, so it only sees what they leave undecoded.
 */
export class Label_Gate_Report extends DecoderPlugin {
  name = 'label-gate-report';

  qualifiers() {
    return {
      labels: ['40', '41', '42', 'C1', '21', '3T', '5Z', '25', '3M'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Arrival Gate');
    let lines: string[];
    if (message.label === 'C1') {
      // A C1 ground uplink header gives the aircraft and flight.
      const body = splitAgmHeader(message.text, decodeResult);
      lines = body ? body.map((l) => l.replace(/\r/g, '').trim()) : [];
      if (!body) {
        lines = gateLines(message.text);
      }
    } else {
      lines = gateLines(message.text);
    }

    let used: UsedLines | undefined;
    switch (message.label) {
      case '3T':
        used = this.hawaiianArrival(decodeResult, lines);
        break;
      case '21':
        used = this.alaskaGateChange(decodeResult, lines);
        break;
      case 'C1':
        used =
          this.jetstar(decodeResult, lines) ??
          this.jazz(decodeResult, lines) ??
          this.jazzFlightData(decodeResult, lines) ??
          this.jetstarChange(decodeResult, lines) ??
          this.routeGate(decodeResult, lines);
        break;
      case '41':
      case '42':
        used = JETBLUE_INR.test(lines[0])
          ? this.jetBlue(decodeResult, lines)
          : this.routeGate(decodeResult, lines);
        break;
      case '25':
        used = addDeltaCrewGate(decodeResult, lines);
        break;
      case '3M':
        used = this.virginBay(decodeResult, lines);
        break;
      case '5Z':
        used = this.psaAck(decodeResult, lines);
        break;
      case '40':
        used =
          this.hawaiianAtGate(decodeResult, lines) ??
          this.envoyArriving(decodeResult, lines) ??
          this.routeGate(decodeResult, lines);
        break;
    }

    if (!used) {
      const failed = this.initResult(message, 'Unknown');
      return this.failUnknown(failed, message.text, options);
    }
    addUnreadLines(decodeResult, lines, used);
    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
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
    // An AGM header has already given the full flight number (AA0174).
    addRouteGate(decodeResult, r, decodeResult.raw.flight_number === undefined);
    return r.used;
  }

  private hawaiianArrival(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    const header = lines.findIndex((l) => l.startsWith('ARR GATE MSG'));
    if (header < 0) {
      return undefined;
    }
    for (let i = 0; i < lines.length; i++) {
      const m = HAWAIIAN_ARR.exec(lines[i]);
      if (m) {
        ResultFormatter.flightNumber(decodeResult, m[1]);
        ResultFormatter.arrivalGate(decodeResult, m[2]);
        return new Map([
          [header, ''],
          [i, ''],
        ]);
      }
    }
    return undefined;
  }

  private hawaiianAtGate(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    for (let i = 0; i < lines.length; i++) {
      const m = HAWAIIAN_AT_GATE.exec(lines[i]);
      if (m) {
        ResultFormatter.flightNumber(decodeResult, m[1]);
        ResultFormatter.arrivalGate(decodeResult, m[2]);
        return new Map([[i, '']]);
      }
    }
    return undefined;
  }

  private envoyArriving(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    for (let i = 0; i < lines.length; i++) {
      const m = ENVOY_ARRIVING.exec(lines[i]);
      if (!m) {
        continue;
      }
      for (let j = i + 1; j < lines.length; j++) {
        if (GATE_STOP_LINE.test(lines[j])) {
          break;
        }
        const g = ENVOY_GATE.exec(lines[j]);
        if (g) {
          ResultFormatter.flightNumber(decodeResult, m[1]);
          ResultFormatter.arrivalAirport(decodeResult, m[2], 'IATA');
          ResultFormatter.arrivalGate(decodeResult, g[1]);
          return new Map([
            [i, cutMatch(lines[i], m)],
            [j, cutMatch(lines[j], g)],
          ]);
        }
      }
      return undefined;
    }
    return undefined;
  }

  private jetBlue(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    for (let i = 0; i < lines.length; i++) {
      if (GATE_STOP_LINE.test(lines[i])) {
        break;
      }
      const m = JETBLUE_GATE.exec(lines[i]);
      if (m) {
        ResultFormatter.arrivalGate(decodeResult, m[1]);
        return new Map([[i, cutMatch(lines[i], m)]]);
      }
    }
    return undefined;
  }

  private jetstar(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    for (let i = 0; i < lines.length; i++) {
      const m = JETSTAR.exec(lines[i]);
      if (m) {
        ResultFormatter.arrivalGate(decodeResult, m[1]);
        return new Map([[i, '']]);
      }
    }
    return undefined;
  }

  private jazzFlightData(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    let dep: RegExpExecArray | null = null;
    let depIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (GATE_STOP_LINE.test(lines[i])) {
        break;
      }
      const d = JAZZ_DEP.exec(lines[i]);
      if (d) {
        dep = d;
        depIdx = i;
        continue;
      }
      const a = JAZZ_ARR.exec(lines[i]);
      if (a) {
        decodeResult.formatted.description = 'Flight Data';
        const used: UsedLines = new Map([[i, '']]);
        if (dep) {
          ResultFormatter.departureAirport(decodeResult, dep[1], 'IATA');
          ResultFormatter.departureGate(decodeResult, dep[2]);
          used.set(depIdx, '');
        }
        ResultFormatter.arrivalAirport(decodeResult, a[1], 'IATA');
        ResultFormatter.arrivalGate(decodeResult, a[2]);
        return used;
      }
    }
    if (dep) {
      decodeResult.formatted.description = 'Flight Data';
      ResultFormatter.departureAirport(decodeResult, dep[1], 'IATA');
      ResultFormatter.departureGate(decodeResult, dep[2]);
      return new Map([[depIdx, '']]);
    }
    return undefined;
  }

  private virginBay(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    for (let i = 0; i < lines.length; i++) {
      const m = VIRGIN_BAY.exec(lines[i]);
      if (m) {
        ResultFormatter.flightNumber(decodeResult, m[1]);
        ResultFormatter.arrivalGate(decodeResult, m[2]);
        return new Map([[i, '']]);
      }
    }
    return undefined;
  }

  private psaAck(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    const m = PSA_ACK.exec(lines[0]);
    if (!m) {
      return undefined;
    }
    decodeResult.formatted.description = 'Arrival Gate Acknowledgement';
    ResultFormatter.arrivalGate(decodeResult, m[1]);
    return new Map([[0, '']]);
  }

  private jazz(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    const header = lines.findIndex((l) => JAZZ_HEADER.test(l));
    if (header < 0) {
      return undefined;
    }
    const used: UsedLines = new Map([[header, '']]);
    let flight: RegExpExecArray | null = null;
    for (let i = 0; i < lines.length; i++) {
      const f = JAZZ_FLIGHT.exec(lines[i]);
      if (f) {
        flight = f;
        used.set(i, cutMatch(lines[i], f));
        continue;
      }
      const g = JAZZ_PLANNED.exec(lines[i]);
      if (g) {
        used.set(i, '');
        if (flight) {
          if (decodeResult.raw.flight_number === undefined) {
            ResultFormatter.flightNumber(decodeResult, flight[1]);
          }
          ResultFormatter.day(decodeResult, Number(flight[2]));
          ResultFormatter.departureAirport(decodeResult, flight[3], 'IATA');
          ResultFormatter.arrivalAirport(decodeResult, flight[4], 'IATA');
        }
        ResultFormatter.arrivalGate(decodeResult, g[1]);
        return used;
      }
    }
    return undefined;
  }

  private jetstarChange(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    const header = lines.findIndex((l) => l.startsWith(JETSTAR_CHANGE_HEADER));
    if (header < 0) {
      return undefined;
    }
    const used: UsedLines = new Map([[header, '']]);
    let route: RegExpExecArray | null = null;
    for (let i = 0; i < lines.length; i++) {
      const r = JETSTAR_ROUTE.exec(lines[i]);
      if (r) {
        route = r;
        used.set(i, cutMatch(lines[i], r));
        continue;
      }
      const g = NEW_GATE.exec(lines[i]);
      if (g) {
        used.set(i, '');
        decodeResult.formatted.description = 'Arrival Gate Change';
        if (route) {
          // An AGM header may have given the flight already.
          if (decodeResult.raw.flight_number === undefined) {
            ResultFormatter.flightNumber(decodeResult, route[1]);
          }
          ResultFormatter.day(decodeResult, Number(route[2]));
          ResultFormatter.departureAirport(decodeResult, route[3], 'IATA');
          ResultFormatter.arrivalAirport(decodeResult, route[4], 'IATA');
        }
        ResultFormatter.arrivalGate(decodeResult, g[1]);
        return used;
      }
    }
    return undefined;
  }

  private alaskaGateChange(
    decodeResult: DecodeResult,
    lines: string[],
  ): UsedLines | undefined {
    let airport: string | undefined;
    let flight: string | undefined;
    const used: UsedLines = new Map();
    for (let i = 0; i < lines.length; i++) {
      if (airport === undefined) {
        const m = ALASKA_CHANGE.exec(lines[i]);
        if (m) {
          airport = m[1];
          used.set(i, '');
        }
        continue;
      }
      const f = ALASKA_FLIGHT.exec(lines[i]);
      if (f) {
        flight = f[1];
        used.set(i, '');
        continue;
      }
      const g = NEW_GATE.exec(lines[i]);
      if (g) {
        used.set(i, '');
        decodeResult.formatted.description = 'Arrival Gate Change';
        if (flight) ResultFormatter.flightNumber(decodeResult, flight);
        ResultFormatter.arrivalAirport(decodeResult, airport, 'IATA');
        ResultFormatter.arrivalGate(decodeResult, g[1]);
        return used;
      }
    }
    return undefined;
  }
}
