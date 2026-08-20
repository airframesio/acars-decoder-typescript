import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

/**
 * Label C1 — Loadsheet / Load Info (uplink, ground → aircraft)
 *
 * Carries airborne fuel requests and load/weight information for the
 * next sector. Two common variants are observed in the wild:
 *
 *   1. PRELIMINARY LOAD INFO — transmitted before departure with best-
 *      available estimates; subject to change until the final sheet.
 *   2. LOADSHEET FINAL       — authoritative values used for takeoff
 *      performance calculations.
 *
 * Typical message body (line-separated, order may vary slightly):
 *
 *   .FRAGDLH                              header / sender routing token
 *   190925                                day-of-month + HHMM UTC
 *   AGM                                   Air-Ground Message marker
 *   AN HB-JVA/MA 277A                     aircraft registration + msg-address qualifier + seq
 *   PRELIMINARY LOAD INFO 11:25           variant ("PRELIMINARY"/"FINAL") + reference time
 *   ZFW 37329                             Zero Fuel Weight (kg)
 *   TOW 43129                             Takeoff Weight (kg)
 *   LAW 40629                             Landing Weight (kg)
 *   PAX C/Y 6/84                          passenger count per cabin class
 *   MACTOW 16.8                           CG at takeoff as % of Mean Aerodynamic Chord
 *   SI ZRH-WRO                            Supplementary Info (route, free text)
 *   NOTOC: NO                             Notification to Captain — dangerous goods (YES/NO/text)
 *   SALEABLE CONFIGURATION 9C/104Y        seat capacity per class
 *   FUEL IN TANKS 6000                    fuel loaded (kg)
 *   PREPARED BY ROMAN/KOSTENKO 41 76      preparer name + licence fragment
 *   6952441                               loadsheet licence / reference number
 *   END                                   terminator
 *
 * The plugin tolerates missing fields and is line-order agnostic. Every
 * recognized field populates both `raw{}` and `formatted.items[]`; any
 * unrecognised lines are kept in `remaining.text`.
 */
export class Label_C1_Loadsheet extends DecoderPlugin {
  name = 'label-c1-loadsheet';

  qualifiers() {
    return {
      labels: ['C1'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Loadsheet / Load Info (ground-to-air uplink)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Normalize: split on newlines AND on known field-boundary markers so
    // the decoder also works against single-line messages.
    const normalized = text
      .replace(/\r/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    const lines = this.splitIntoFields(normalized);

    let anyMatched = false;
    const remaining: string[] = [];

    decodeResult.formatted.items.push({
      type: 'message_type',
      code: 'MSGTYP',
      label: 'Message Type',
      value: 'Loadsheet / Load Info — ground-to-air uplink',
    });

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      // Sender routing token: .FRAGDLH — leading dot + alpha station ID
      let m = line.match(/^\.([A-Z0-9]+)$/);
      if (m) {
        decodeResult.raw.sender_token = m[1];
        // Conventional first 3 chars = originating IATA/station code
        const station = m[1].substring(0, 3);
        decodeResult.raw.sender_station = station;
        decodeResult.formatted.items.push({
          type: 'sender',
          code: 'SENDER',
          label: 'Sender',
          value: `${m[1]} (station ${station})`,
        });
        anyMatched = true;
        continue;
      }

      // DTG: DDHHMM — 6 digits: day + hour + minute UTC
      m = line.match(/^(\d{2})(\d{2})(\d{2})$/);
      if (m) {
        const [_, dd, hh, mm] = m;
        decodeResult.raw.day = Number(dd);
        decodeResult.raw.message_time_utc = `${hh}:${mm}`;
        decodeResult.formatted.items.push({
          type: 'timestamp',
          code: 'DTG',
          label: 'Date/Time (UTC)',
          value: `Day ${dd} @ ${hh}:${mm}Z`,
        });
        anyMatched = true;
        continue;
      }

      // AGM marker
      if (line === 'AGM') {
        decodeResult.raw.is_agm = true;
        decodeResult.formatted.items.push({
          type: 'marker',
          code: 'AGM',
          label: 'Marker',
          value: 'AGM (Air-Ground Message)',
        });
        anyMatched = true;
        continue;
      }

      // Aircraft registration + address qualifier + seq: "AN HB-JVA/MA 277A"
      m = line.match(/^AN\s+([A-Z0-9-]+)\/([A-Z]{1,3})\s+(\S+)$/);
      if (m) {
        decodeResult.raw.tail = m[1];
        decodeResult.raw.address_qualifier = m[2];
        decodeResult.raw.message_sequence = m[3];
        decodeResult.formatted.items.push({
          type: 'tail',
          code: 'TAIL',
          label: 'Aircraft Registration',
          value: m[1],
        });
        decodeResult.formatted.items.push({
          type: 'address_qualifier',
          code: 'ADDRQ',
          label: 'Address Qualifier',
          value: m[2],
        });
        decodeResult.formatted.items.push({
          type: 'sequence',
          code: 'SEQ',
          label: 'Message Sequence',
          value: m[3],
        });
        anyMatched = true;
        continue;
      }

      // Variant: PRELIMINARY LOAD INFO / LOADSHEET FINAL / LOADSHEET PRELIMINARY etc
      m = line.match(
        /^(?:(PRELIMINARY|FINAL)\s+LOAD(?:\s+INFO|\s*SHEET)?|LOAD\s*SHEET\s+(PRELIMINARY|FINAL))(?:\s+(\S.*))?$/,
      );
      if (m) {
        const variant = (m[1] || m[2]).toUpperCase();
        decodeResult.raw.loadsheet_variant = variant;
        if (m[3]) decodeResult.raw.loadsheet_reference_time = m[3];
        decodeResult.formatted.items.push({
          type: 'loadsheet_variant',
          code: 'VARIANT',
          label: 'Loadsheet Type',
          value:
            variant === 'PRELIMINARY'
              ? 'Preliminary (pre-departure estimate)'
              : 'Final (authoritative for takeoff)',
        });
        if (m[3]) {
          decodeResult.formatted.items.push({
            type: 'reference_time',
            code: 'REFTIME',
            label: 'Reference Time',
            value: m[3],
          });
        }
        anyMatched = true;
        continue;
      }

      // ZFW / TOW / LAW / TOF etc — weights in kilograms
      m = line.match(/^(ZFW|TOW|LAW|TOF|DOW|MZFW|MTOW|MLAW)\s+([\d.]+)$/);
      if (m) {
        const code = m[1];
        const val = Number(m[2]);
        const keyMap: Record<string, string> = {
          ZFW: 'zero_fuel_weight_kg',
          TOW: 'takeoff_weight_kg',
          LAW: 'landing_weight_kg',
          TOF: 'takeoff_fuel_kg',
          DOW: 'dry_operating_weight_kg',
          MZFW: 'max_zero_fuel_weight_kg',
          MTOW: 'max_takeoff_weight_kg',
          MLAW: 'max_landing_weight_kg',
        };
        const labelMap: Record<string, string> = {
          ZFW: 'Zero Fuel Weight',
          TOW: 'Takeoff Weight',
          LAW: 'Landing Weight',
          TOF: 'Takeoff Fuel',
          DOW: 'Dry Operating Weight',
          MZFW: 'Max Zero Fuel Weight',
          MTOW: 'Max Takeoff Weight',
          MLAW: 'Max Landing Weight',
        };
        decodeResult.raw[keyMap[code]] = val;
        decodeResult.formatted.items.push({
          type: 'weight',
          code,
          label: labelMap[code],
          value: `${val.toLocaleString()} kg`,
        });
        anyMatched = true;
        continue;
      }

      // Passenger count: "PAX C/Y 6/84" or "PAX/18/204" (no class split)
      m = line.match(/^PAX(?:\s+([A-Z]+)\/([A-Z]+))?\s*\/?\s*(\d+)\/(\d+)(?:\/(\d+))?$/);
      if (m) {
        const classes = m[1] && m[2] ? [m[1], m[2]] : null;
        const counts = [Number(m[3]), Number(m[4])];
        if (m[5]) counts.push(Number(m[5]));
        const total = counts.reduce((s, n) => s + n, 0);
        decodeResult.raw.passenger_counts = classes
          ? Object.fromEntries(classes.map((c, i) => [c, counts[i]]))
          : counts;
        decodeResult.raw.passenger_total = total;
        const valueStr = classes
          ? classes.map((c, i) => `${counts[i]} ${this.classLabel(c)}`).join(', ') +
            ` (${total} total)`
          : counts.join('/') + ` (${total} total)`;
        decodeResult.formatted.items.push({
          type: 'passengers',
          code: 'PAX',
          label: 'Passengers',
          value: valueStr,
        });
        anyMatched = true;
        continue;
      }

      // MAC at TOW: "MACTOW 16.8"
      m = line.match(/^MACTOW\s+([\d.]+)$/);
      if (m) {
        decodeResult.raw.mac_tow_percent = Number(m[1]);
        decodeResult.formatted.items.push({
          type: 'mac',
          code: 'MACTOW',
          label: 'CG at Takeoff (% MAC)',
          value: `${m[1]}%`,
        });
        anyMatched = true;
        continue;
      }

      // Supplementary info: "SI ZRH-WRO" or longer free text
      m = line.match(/^SI\s+(\S.*)$/);
      if (m) {
        const si = m[1].trim();
        decodeResult.raw.supplementary_info = si;
        // If it looks like a route AAA-BBB, expose it as dep/dest too
        const route = si.match(/^([A-Z]{3,4})[-/]([A-Z]{3,4})$/);
        if (route) {
          decodeResult.raw.departure_iata = route[1];
          decodeResult.raw.arrival_iata = route[2];
          decodeResult.formatted.items.push({
            type: 'route',
            code: 'ROUTE',
            label: 'Route',
            value: `${route[1]} → ${route[2]}`,
          });
        } else {
          decodeResult.formatted.items.push({
            type: 'si',
            code: 'SI',
            label: 'Supplementary Info',
            value: si,
          });
        }
        anyMatched = true;
        continue;
      }

      // NOTOC: notification to captain (dangerous goods etc.)
      m = line.match(/^NOTOC\s*:\s*(\S.*)$/);
      if (m) {
        const val = m[1].trim();
        decodeResult.raw.notoc = val;
        decodeResult.formatted.items.push({
          type: 'notoc',
          code: 'NOTOC',
          label: 'NOTOC (Dangerous Goods)',
          value: /^NO$|^NONE$/i.test(val) ? 'None' : val,
        });
        anyMatched = true;
        continue;
      }

      // Cabin configuration: "SALEABLE CONFIGURATION 9C/104Y"
      m = line.match(/^SALEABLE\s+CONFIGURATION\s+(.+)$/);
      if (m) {
        decodeResult.raw.saleable_configuration = m[1].trim();
        decodeResult.formatted.items.push({
          type: 'cabin_config',
          code: 'CABIN',
          label: 'Saleable Configuration',
          value: m[1].trim(),
        });
        anyMatched = true;
        continue;
      }

      // Fuel in tanks: "FUEL IN TANKS 6000"
      m = line.match(/^FUEL\s+IN\s+TANKS\s+([\d.]+)$/);
      if (m) {
        decodeResult.raw.fuel_in_tanks_kg = Number(m[1]);
        decodeResult.formatted.items.push({
          type: 'fuel',
          code: 'FUEL',
          label: 'Fuel in Tanks',
          value: `${Number(m[1]).toLocaleString()} kg`,
        });
        anyMatched = true;
        continue;
      }

      // Preparer: "PREPARED BY ROMAN/KOSTENKO 41 76"
      m = line.match(/^PREPARED\s+BY\s+(.+)$/);
      if (m) {
        decodeResult.raw.prepared_by = m[1].trim();
        decodeResult.formatted.items.push({
          type: 'preparer',
          code: 'PREP',
          label: 'Prepared By',
          value: m[1].trim(),
        });
        anyMatched = true;
        continue;
      }

      // Standalone numeric reference (typ. licence number) on its own line
      m = line.match(/^(\d{6,})$/);
      if (m) {
        decodeResult.raw.reference_number = m[1];
        decodeResult.formatted.items.push({
          type: 'reference',
          code: 'REFNO',
          label: 'Reference / Licence',
          value: m[1],
        });
        anyMatched = true;
        continue;
      }

      if (line === 'END' || line === '-----END OF MESSAGE-----' || /^END\s*OF/.test(line)) {
        decodeResult.raw.end_marker = true;
        anyMatched = true;
        continue;
      }

      remaining.push(line);
    }

    if (remaining.length) {
      decodeResult.remaining.text = remaining.join('\n');
    }

    this.setDecodeLevel(decodeResult, anyMatched, remaining.length ? 'partial' : 'full');
    return decodeResult;
  }

  private classLabel(code: string): string {
    switch (code.toUpperCase()) {
      case 'F':
        return 'First';
      case 'C':
        return 'Business';
      case 'J':
        return 'Business';
      case 'W':
        return 'Premium Economy';
      case 'Y':
        return 'Economy';
      default:
        return code;
    }
  }

  /**
   * Split a message into field tokens. Works for line-separated bodies,
   * and also falls back to known-keyword segmentation when the body is
   * delivered as a single line.
   */
  private splitIntoFields(text: string): string[] {
    if (text.includes('\n')) return text.split(/\n+/);

    // Single-line fallback: insert newlines before well-known keywords
    // so the existing per-line matcher can still find each field.
    const keywords = [
      'AGM',
      'AN ',
      'PRELIMINARY LOAD INFO',
      'PRELIMINARY LOADSHEET',
      'FINAL LOAD INFO',
      'LOADSHEET FINAL',
      'LOADSHEET PRELIMINARY',
      'ZFW ',
      'TOW ',
      'LAW ',
      'TOF ',
      'DOW ',
      'MACTOW ',
      'PAX ',
      'PAX/',
      'SI ',
      'NOTOC',
      'SALEABLE CONFIGURATION',
      'FUEL IN TANKS',
      'PREPARED BY',
      'END',
    ];
    let split = text;
    for (const kw of keywords) {
      split = split.replace(new RegExp(`\\s+${this.escapeRegex(kw)}`, 'g'), '\n' + kw);
    }
    return split.split(/\n+/);
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
