import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 81 — MVA (Aircraft-Initiated Movement Message)
 *
 * An APAC / Jetstar-originated airline free-text ACARS label carrying an
 * IATA AHM 780 **MVA** payload — a machine-generated arrival / departure /
 * delay movement report transmitted automatically.
 *
 * Wire format (arrival variant observed):
 *
 *   MVA
 *   JST0122/20.VHOYR.MEL
 *   AA0945/0950
 *   SI FB  37
 *
 * Lines:
 *   1. Message type identifier (MVA / MVT)
 *   2. <carrier><flight>/<day>.<registration>.<airport-of-movement-IATA>
 *   3. Movement times:
 *        AA <touchdown-HHMM> / <on-blocks-HHMM>   (arrival)
 *        AD <off-blocks-HHMM> / <takeoff-HHMM>    (departure — analogous)
 *   4. Optional supplementary information:
 *        SI <tag> <value>   e.g. `SI FB 37` = Fuel on Board 37 (units per op)
 */
export class Label_81_MVA extends DecoderPlugin {
  name = 'label-81-mva';

  qualifiers() {
    return {
      labels: ['81'],
      preambles: ['MVA', 'MVT'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Aircraft-Initiated Movement Message (MVA)',
    );

    const text = (message.text || '').replace(/\r/g, '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const lines = text.split(/\n+/).map((l) => l.trim()).filter((l) => l);
    if (lines.length < 2) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Line 1: message type — MVA or MVT
    const msgType = lines[0];
    if (!/^(MVA|MVT)$/.test(msgType)) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }
    decodeResult.raw.mva_type = msgType;

    // Line 2: <carrier><flight>/<day>.<tail>.<airport>
    const idRe =
      /^(?<carrier>[A-Z]{2,3})(?<flight>\d{1,5}[A-Z]?)\/(?<day>\d{1,2})\.(?<tail>[A-Z0-9-]{3,10})\.(?<airport>[A-Z]{3,4})$/;
    const idm = lines[1].match(idRe);
    if (!idm?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }
    const { carrier, flight, day, tail, airport } = idm.groups;
    const fullFlight = `${carrier}${flight}`;
    decodeResult.raw.carrier = carrier;
    decodeResult.raw.flight_number = fullFlight;
    decodeResult.raw.day = Number(day);
    decodeResult.raw.tail = tail;
    decodeResult.raw.airport = airport;
    ResultFormatter.flightNumber(decodeResult, fullFlight);
    ResultFormatter.tail(decodeResult, tail);

    // Line 3 (optional): AA <touchdown> / <on-blocks>   or AD <off-blocks> / <takeoff>
    let aaTouchdown = '';
    let aaOnBlocks = '';
    let adOffBlocks = '';
    let adTakeoff = '';
    if (lines[2]) {
      const aa = lines[2].match(/^AA(?<t1>\d{4})(?:\/(?<t2>\d{4}))?$/);
      const ad = !aa
        ? lines[2].match(/^AD(?<t1>\d{4})(?:\/(?<t2>\d{4}))?$/)
        : null;
      if (aa?.groups) {
        aaTouchdown = aa.groups.t1;
        aaOnBlocks = aa.groups.t2 || '';
        decodeResult.raw.actual_touchdown = `${aaTouchdown.substring(0, 2)}:${aaTouchdown.substring(2, 4)}`;
        if (aaOnBlocks) {
          decodeResult.raw.actual_on_blocks = `${aaOnBlocks.substring(0, 2)}:${aaOnBlocks.substring(2, 4)}`;
        }
        ResultFormatter.arrivalAirport(decodeResult, airport);
        ResultFormatter.timestamp(
          decodeResult,
          DateTimeUtils.convertHHMMSSToTod(aaTouchdown + '00'),
        );
      } else if (ad?.groups) {
        adOffBlocks = ad.groups.t1;
        adTakeoff = ad.groups.t2 || '';
        decodeResult.raw.actual_off_blocks = `${adOffBlocks.substring(0, 2)}:${adOffBlocks.substring(2, 4)}`;
        if (adTakeoff) {
          decodeResult.raw.actual_takeoff = `${adTakeoff.substring(0, 2)}:${adTakeoff.substring(2, 4)}`;
        }
        ResultFormatter.departureAirport(decodeResult, airport);
        ResultFormatter.timestamp(
          decodeResult,
          DateTimeUtils.convertHHMMSSToTod(adOffBlocks + '00'),
        );
      }
    }

    // Line 4 (optional): SI <tag> <value>  — e.g. "SI FB  37"
    let siTag = '';
    let siValue = '';
    if (lines[3]) {
      const si = lines[3].match(/^SI\s+([A-Z]{1,4})\s+([A-Z0-9.\-]+)\s*$/);
      if (si) {
        siTag = si[1];
        siValue = si[2];
        decodeResult.raw.supplementary_tag = siTag;
        decodeResult.raw.supplementary_value = siValue;
      }
    }

    // ── formatted output ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value:
          msgType === 'MVA'
            ? 'Aircraft-Initiated Movement Message (MVA)'
            : 'Movement Message (MVT)',
      },
      {
        type: 'mva_type',
        code: 'MVATYPE',
        label: 'MVA/MVT Indicator',
        value: msgType,
      },
    );

    decodeResult.formatted.items.push(
      {
        type: 'carrier',
        code: 'CARRIER',
        label: 'Carrier Code',
        value: carrier,
      },
      {
        type: 'day',
        code: 'DAY',
        label: 'Day of Month',
        value: day,
      },
      {
        type: 'airport',
        code: 'APT',
        label: 'Airport of Movement',
        value: airport,
      },
    );

    if (aaTouchdown) {
      decodeResult.formatted.items.push({
        type: 'actual_touchdown',
        code: 'AAT',
        label: 'Actual Touchdown (UTC)',
        value: `${aaTouchdown.substring(0, 2)}:${aaTouchdown.substring(2, 4)}`,
      });
    }
    if (aaOnBlocks) {
      decodeResult.formatted.items.push({
        type: 'actual_on_blocks',
        code: 'AAB',
        label: 'Actual On Blocks (UTC)',
        value: `${aaOnBlocks.substring(0, 2)}:${aaOnBlocks.substring(2, 4)}`,
      });
    }
    if (adOffBlocks) {
      decodeResult.formatted.items.push({
        type: 'actual_off_blocks',
        code: 'ADB',
        label: 'Actual Off Blocks (UTC)',
        value: `${adOffBlocks.substring(0, 2)}:${adOffBlocks.substring(2, 4)}`,
      });
    }
    if (adTakeoff) {
      decodeResult.formatted.items.push({
        type: 'actual_takeoff',
        code: 'ADT',
        label: 'Actual Takeoff (UTC)',
        value: `${adTakeoff.substring(0, 2)}:${adTakeoff.substring(2, 4)}`,
      });
    }

    if (siTag) {
      const siLabelMap: Record<string, string> = {
        FB: 'Fuel on Board',
      };
      const siLabel = siLabelMap[siTag]
        ? `${siTag} (${siLabelMap[siTag]})`
        : siTag;
      decodeResult.formatted.items.push({
        type: 'supplementary',
        code: 'SI',
        label: 'Supplementary Info',
        value: `${siLabel}: ${siValue}`,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
