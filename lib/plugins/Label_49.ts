import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { DateTimeUtils } from '../DateTimeUtils';
import { ResultFormatter } from '../utils/result_formatter';
import { RouteUtils } from '../utils/route_utils';

// Segment codes observed in label 49. The airborne ones (TO, IC, CL, ER, DC,
// AP) are documented by airframesio/acars-message-documentation; GA and the
// ground codes are established by ADS-B phase correlation. Ground names are
// inferred, not documented.
const KNOWN_SEGMENTS = new Set([
  'TO',
  'IC',
  'CL',
  'ER',
  'DC',
  'AP',
  'GA',
  'FL',
  'RO',
  'TI',
  'SD',
  'PO',
  'ES',
  'TA',
]);

// Report codes seen in the corpus. EC, DV, RT and SW are intentionally not
// expanded: only the letters are known, not their meaning.
const KNOWN_CODES = new Set([
  'ERDC',
  'CLER',
  'ICCL',
  'DCAP',
  'TOIC',
  'TATO',
  'ROTI',
  'ESTA',
  'FLRO',
  'APFL',
  'TISD',
  'SDPO',
  'POES',
  'APGA',
  'ERCL',
  'DCER',
  'ECER',
  'TAES',
  'DVRT',
  'SWAP',
]);

const OOOI = new Set(['OUT', 'OFF', 'ON', 'IN']);

// 01 + report code + callsign (10, right-justified, then "/") + DDHHMM +
// origin ICAO + destination ICAO.
const STANDARD_HEADER =
  /^01([A-Z0-9 ]{4})([A-Z0-9 *]*?)\/([0-9*]{6})([A-Z*]{4})([A-Z*]{4})/;

// Some JAL messages prepend M##AJL and six digits, then the same core.
const AJL_HEADER =
  /^M[A-Z0-9]{2}AJL[0-9]{6}([A-Z0-9 ]{4})([A-Z0-9 *]*?)\/([0-9*]{6})([A-Z*]{4})([A-Z*]{4})/;

interface BodyFields {
  altitude?: number;
  ias?: number;
  tat?: number;
  extra?: string;
}

export class Label_49 extends DecoderPlugin {
  name = 'label-49';

  qualifiers() {
    return {
      labels: ['49'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, 'Flight Phase Transition');
    const lines = message.text.split(/\r?\n/);
    if (lines.length < 2) {
      return this.failUnknown(result, message.text, options);
    }

    const standard = STANDARD_HEADER.exec(lines[0]);
    const match = standard ?? AJL_HEADER.exec(lines[0]);
    if (!match) {
      return this.failUnknown(result, message.text, options);
    }

    const [, codeField, callsignField, time, origin, destination] = match;
    const reportCode = codeField.trim();
    const isOOOI = OOOI.has(reportCode);
    const isSwap = reportCode === 'SWAP';
    const isKeyword = isSwap || reportCode === 'INIT';
    const isPair = !isOOOI && !isKeyword;
    const previous = isPair ? reportCode.slice(0, 2) : '';
    const next = isPair ? reportCode.slice(2, 4) : '';

    result.raw.report_code = reportCode;
    result.raw.known_report_code =
      KNOWN_CODES.has(reportCode) || isOOOI || isKeyword;
    result.raw.variant = standard ? 'standard' : 'ajl';
    result.raw.segment_known =
      isPair && KNOWN_SEGMENTS.has(previous) && KNOWN_SEGMENTS.has(next);

    const callsign = callsignField.trim();
    if (callsign && !isSwap && !/^\*+$/.test(callsign)) {
      ResultFormatter.callsign(result, callsign);
    }

    if (/^[0-9]{6}$/.test(time)) {
      result.raw.day = Number(time.slice(0, 2));
      result.raw.message_timestamp = DateTimeUtils.convertHHMMSSToTod(
        time.slice(2),
      );
    }

    if (!isSwap && /^[A-Z]{4}$/.test(origin)) {
      ResultFormatter.departureAirport(result, origin);
    }
    if (!isSwap && /^[A-Z]{4}$/.test(destination)) {
      ResultFormatter.arrivalAirport(result, destination);
    }

    if (isPair) {
      result.raw.previous_segment = previous;
      result.raw.next_segment = next;
      this.formatStateChange(result, previous, next);
    } else {
      result.raw.event = isSwap ? 'SWAPINITIALIZE' : reportCode;
      if (isSwap) {
        result.raw.event_detail = callsign;
      }
    }

    const body = this.parseBody(lines[1].trim());
    if (!body) {
      return this.failUnknown(result, message.text, options);
    }

    if (body.altitude !== undefined) {
      ResultFormatter.altitude(result, body.altitude);
    }
    if (body.ias !== undefined) {
      ResultFormatter.indicatedAirspeed(result, body.ias);
    }
    if (body.tat !== undefined) {
      ResultFormatter.totalAirTemp(result, String(body.tat));
    }
    if (body.extra) {
      ResultFormatter.unknown(result, body.extra);
    }

    const parsed = [body.altitude, body.ias, body.tat].filter(
      (value) => value !== undefined,
    ).length;
    this.setDecodeLevel(
      result,
      true,
      parsed === 3 && !body.extra ? 'full' : 'partial',
    );

    this.debug(options, reportCode, previous, next, body);
    return result;
  }

  private formatStateChange(
    result: DecodeResult,
    previous: string,
    next: string,
  ): void {
    result.raw.state_change = { from: previous, to: next };
    // GA is inferred from the APGA sequence and is kept local: the shared
    // RouteUtils map only carries states that are documented.
    const label = (segment: string): string =>
      segment === 'GA' ? 'Go-Around' : RouteUtils.formatFlightState(segment);
    result.formatted.items.push({
      type: 'state_change',
      code: 'STATE_CHANGE',
      label: 'State Change',
      value: `${label(previous)} -> ${label(next)}`,
    });
  }

  private parseBody(body: string): BodyFields | undefined {
    if (body.length < 17) {
      return undefined;
    }

    const core = body.slice(0, 17);
    const extra = body.slice(17);
    if (extra && !/^[0-9*]+$/.test(extra)) {
      return undefined;
    }

    const num = (value: string): number | undefined => {
      const trimmed = value.trim();
      return /^[0-9]+(\.[0-9]+)?$/.test(trimmed) ? Number(trimmed) : undefined;
    };

    const numSigned = (value: string): number | undefined => {
      const trimmed = value.trim();
      return /^[+-]?[0-9]+(\.[0-9]+)?$/.test(trimmed)
        ? Number(trimmed)
        : undefined;
    };

    // Signed layout: "+31994297.4- 11.1".
    if (core[0] === '+' || core[0] === '-') {
      const altitude = num(core.slice(1, 6));
      const ias = num(core.slice(6, 11));
      const tat = num(core.slice(12, 17));
      return {
        altitude:
          altitude === undefined
            ? undefined
            : altitude * (core[0] === '-' ? -1 : 1),
        ias,
        tat: tat === undefined ? undefined : tat * (core[11] === '-' ? -1 : 1),
        extra: extra || undefined,
      };
    }

    // Unsigned layout (Qatar): "34946 283.1 -13.6".
    return {
      altitude: num(core.slice(0, 5)),
      ias: num(core.slice(6, 11)),
      tat: numSigned(core.slice(12, 17)),
      extra: extra || undefined,
    };
  }
}
