import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';
import { DateTimeUtils } from '../DateTimeUtils';

/**
 * Label 5Z — Airline Designated Downlink, AA / US Airways "Variant 1"
 *
 * No leading `/` preamble (that variant is handled by Label_5Z_Slash).
 * Used by American Airlines and US Airways for Operational Status (OS)
 * downlinks reporting in-range / clearance / similar arrival advisories.
 *
 * Wire format:
 *
 *   OS  KMSN  / IR  KMSN 2209
 *   |   |       |    |    |
 *   |   |       |    |    └── Optional 4-digit time HHMM (UTC) — typ. estimated arrival
 *   |   |       |    └─────── Optional repeated airport ICAO
 *   |   |       └──────────── Sub-command (IR = In Range, CLR = Clear, ...)
 *   |   └──────────────────── Reference / destination airport ICAO
 *   └──────────────────────── Command (OS = Out-Safe / Operational Status)
 *
 * Documented examples:
 *   OS KPHX /CLR
 *   OS KSFO /IR KSFO0312
 *   OS KMSN /IR KMSN2209
 */
export class Label_5Z_AA extends DecoderPlugin {
  name = 'label-5z-aa';

  private readonly commandDescriptions: Record<string, string> = {
    OS: 'Operational Status (Out-Safe)',
  };

  private readonly subCommandDescriptions: Record<string, string> = {
    IR: 'In Range',
    CLR: 'Clear',
    OUT: 'Out of Gate',
    OFF: 'Off (departed)',
    ON: 'On (touchdown)',
    IN: 'In Gate',
    FTM: 'Free-Text Message',
    ALT: 'Altimeter / Arrival Data',
  };

  qualifiers() {
    return {
      labels: ['5Z'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Airline Designated Downlink (AA / US Airways Variant 1)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Reject 5Z messages that begin with `/` — those are the United Airlines
    // sub-format and are handled by Label_5Z_Slash.
    if (text.startsWith('/')) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Pattern: <CMD> <ICAO> /<SUBCMD>[ <ICAO><HHMM>] followed by optional
    // free-text body (newline-separated) — e.g. FTM messages carry crew
    // requests / dispatcher notes after the subcommand.
    const normalized = text.replace(/\r/g, '');
    const header = normalized.split('\n')[0].trim();
    const bodyLines = normalized
      .split('\n')
      .slice(1)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Accepted header trailer shapes after `/<SUBCMD>`:
    //   (a) (empty)                               — e.g. `OS KPHX /CLR`
    //   (b) <ICAO><HHMM>                          — e.g. `OS KMSN /IR KMSN2209`
    //   (c) <altimeter:4-digit><HHMM>             — e.g. `OS KDFW/ALT00001930`
    //                                               (ALT sub-code — altimeter + ETA)
    const regex =
      /^(?<cmd>[A-Z]{1,3})\s+(?<icao>[A-Z]{3,4})\s*\/(?<sub>[A-Z]{1,4})(?:\s*(?:(?<altIcao>[A-Z]{3,4})(?<timeA>\d{4})|(?<altimeter>\d{4})(?<timeB>\d{4})))?\s*$/;
    const m = header.match(regex);
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { cmd, icao, sub, altIcao, timeA, altimeter, timeB } = m.groups;
    const time = timeA || timeB;
    const freeText = bodyLines.join('\n');

    decodeResult.raw.airline = 'American Airlines / US Airways';
    decodeResult.raw.command = cmd;
    decodeResult.raw.subcommand = sub;
    ResultFormatter.arrivalAirport(decodeResult, icao);

    if (altIcao) decodeResult.raw.alternate_icao = altIcao;
    if (altimeter && altimeter !== '0000') {
      // Documentation notes the altimeter 4-digit prefix may be obsolete /
      // padding; only surface it when it carries a non-zero value.
      decodeResult.raw.altimeter_raw = altimeter;
    }
    if (time) {
      decodeResult.raw.estimated_arrival_time = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
      ResultFormatter.eta(
        decodeResult,
        DateTimeUtils.convertHHMMSSToTod(time + '00'),
      );
    }

    // ── Formatted output (one row per field) ──
    decodeResult.formatted.items.unshift(
      {
        type: 'airline',
        code: 'AIRLINE',
        label: 'Airline',
        value: 'American Airlines / US Airways',
      },
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Airline Designated Downlink (AA Variant 1)',
      },
    );
    const cmdLabel = this.commandDescriptions[cmd]
      ? `${cmd} (${this.commandDescriptions[cmd]})`
      : cmd;
    decodeResult.formatted.items.push(
      {
        type: 'command',
        code: 'CMD',
        label: 'Command',
        value: cmdLabel,
      },
      {
        type: 'subcommand',
        code: 'SUBCMD',
        label: 'Sub-command',
        value: this.subCommandDescriptions[sub]
          ? `${sub} (${this.subCommandDescriptions[sub]})`
          : sub,
      },
    );
    if (altIcao && altIcao !== icao) {
      decodeResult.formatted.items.push({
        type: 'alt_icao',
        code: 'ALTICAO',
        label: 'Repeated ICAO',
        value: altIcao,
      });
    }
    if (altimeter && altimeter !== '0000') {
      decodeResult.formatted.items.push({
        type: 'altimeter',
        code: 'ALTIM',
        label: 'Altimeter (raw)',
        value: altimeter,
      });
    }
    if (freeText) {
      decodeResult.raw.free_text = freeText;
      decodeResult.formatted.items.push({
        type: 'free_text',
        code: 'FTEXT',
        label: 'Free Text',
        value: freeText,
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
