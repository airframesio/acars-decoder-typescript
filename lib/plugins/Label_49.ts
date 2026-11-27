import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { DateTimeUtils } from '../DateTimeUtils';
import { ResultFormatter } from '../utils/result_formatter';

// Segment codes observed in label 49. TO/IC/CL/ER/DC/AP are documented by
// airframesio/acars-message-documentation; GA and the ground codes are observed
// and their phases are supported by ADS-B, but their names are not documented.
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
    // Both letters are in the observed segment alphabet. This does not assert
    // what they mean: only TO/IC/CL/ER/DC/AP are documented.
    result.raw.segment_code_known =
      isPair && KNOWN_SEGMENTS.has(previous) && KNOWN_SEGMENTS.has(next);

    const callsign = callsignField.trim();
    if (callsign && !isSwap && !/^\*+$/.test(callsign)) {
      ResultFormatter.callsign(result, callsign);
    }

    if (/^[0-9]{6}$/.test(time)) {
      const day = Number(time.slice(0, 2));
      const hour = Number(time.slice(2, 4));
      const minute = Number(time.slice(4, 6));
      if (day >= 1 && day <= 31 && hour <= 23 && minute <= 59) {
        const tod = DateTimeUtils.convertHHMMSSToTod(time.slice(2));
        result.raw.day = day;
        result.raw.message_timestamp = tod;
        // For OUT/OFF/ON/IN the header time is the event time, so it also
        // feeds the raw.*_time field that the other OOOI plugins publish and
        // downstream consumers already read.
        if (isOOOI) {
          this.formatOOOITime(result, reportCode, tod);
        }
      }
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
      ResultFormatter.state_change(result, previous, next);
    } else {
      result.raw.event = isSwap ? 'SWAPINITIALIZE' : reportCode;
      if (isSwap) {
        result.raw.event_detail = callsign;
      }
    }

    // Strip formatting whitespace before a signed value (the AJL body starts
    // with a tab), but keep the leading space of the unsigned layout: it is a
    // field position, not formatting.
    const bodyLine = lines[1].replace(/^[\t ]*([+-])/, '$1').trimEnd();
    const body = this.parseBody(bodyLine);
    if (!body) {
      return this.failUnknown(result, message.text, options);
    }

    const trailing = lines
      .slice(2)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

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
    if (trailing) {
      ResultFormatter.unknown(result, trailing, '\n');
    }

    const parsed = [body.altitude, body.ias, body.tat].filter(
      (value) => value !== undefined,
    ).length;
    this.setDecodeLevel(
      result,
      true,
      parsed === 3 && !body.extra && !trailing ? 'full' : 'partial',
    );

    this.debug(options, reportCode, previous, next, body);
    return result;
  }

  /**
   * Publishes the header time of an OOOI report as its event time.
   *
   * @param result decode result being built; `raw.<event>_time` and a `time`
   *   formatted item are added to it
   * @param reportCode report code from the header; must be one of OUT, OFF,
   *   ON or IN (guaranteed by the caller's `isOOOI` check)
   * @param tod time of day of the event, in seconds since midnight
   *   (0-86399), as returned by `DateTimeUtils.convertHHMMSSToTod`
   * @throws Error if `reportCode` is not an OOOI code, which would mean the
   *   caller broke the `OOOI` set invariant
   */
  private formatOOOITime(
    result: DecodeResult,
    reportCode: string,
    tod: number,
  ): void {
    switch (reportCode) {
      case 'OUT':
        ResultFormatter.out(result, tod);
        return;
      case 'OFF':
        ResultFormatter.off(result, tod);
        return;
      case 'ON':
        ResultFormatter.on(result, tod);
        return;
      case 'IN':
        ResultFormatter.in(result, tod);
        return;
      default:
        throw new Error(`not an OOOI report code: ${reportCode}`);
    }
  }

  private parseBody(body: string): BodyFields | undefined {
    if (body.length < 17) {
      return undefined;
    }

    const core = body.slice(0, 17);
    const extra = body.slice(17);

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

    // Signed layout: "+31994297.4- 11.1". A masked altitude sign
    // ("******297.4- 11.1") hides core[0], but the TAT sign at index 11 still
    // identifies this layout.
    if (
      core[0] === '+' ||
      core[0] === '-' ||
      core[11] === '+' ||
      core[11] === '-'
    ) {
      const altitude = num(core.slice(1, 6));
      const ias = num(core.slice(6, 11));
      const tat = num(core.slice(12, 17));
      const altitudeSign =
        core[0] === '-' ? -1 : core[0] === '+' ? 1 : undefined;
      return {
        altitude:
          altitude === undefined || altitudeSign === undefined
            ? undefined
            : altitude * altitudeSign,
        ias,
        tat:
          tat === undefined || (core[11] !== '+' && core[11] !== '-')
            ? undefined
            : tat * (core[11] === '-' ? -1 : 1),
        extra: extra || undefined,
      };
    }

    // Unsigned layout (Qatar): "34946 283.1 -13.6". When the altitude sign is
    // masked and index 11 is not a sign, the two layouts cannot be told apart:
    // leave the TAT unknown rather than guess its sign. A field that is
    // neither a number nor masked means the body is not this layout either.
    const masked = (value: string): boolean => /^[*. ]*$/.test(value);
    const slots = [core.slice(0, 5), core.slice(6, 11), core.slice(12, 17)];
    if (slots.some((slot) => !masked(slot) && numSigned(slot) === undefined)) {
      return undefined;
    }
    return {
      altitude: num(core.slice(0, 5)),
      ias: num(core.slice(6, 11)),
      tat: core[0] === '*' ? undefined : numSigned(core.slice(12, 17)),
      extra: extra || undefined,
    };
  }
}
