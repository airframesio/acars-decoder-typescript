import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label A9 — DAI (Deliver ATIS Information)
 *
 * Uplink (ground-to-air) message carrying D-ATIS content to the cockpit.
 * The automated airport/weather information normally heard on a recorded
 * radio loop (ATIS) is delivered as a digital text message instead,
 * pushed to the aircraft's printer or MCDU.
 *
 * Typical message body after any optional routing prefix:
 *
 *   CYYZ ARR ATIS A 0800Z
 *   28008KT 15SM SCT060 CIG OVC140
 *   04/M01 A2992
 *   APCH ILS RWY 23
 *   LDG AND DEP RWY 23
 *   ACFT ARRG CYYZ WITH PERMISSION TO LAND PRIOR TO 1030Z SHALL NTFY CYYZ ATC ON INITIAL CTC
 *   GOOSE/SMALL BIRD ACT IN THE CYYZ AREA
 *   INFORM CYYZ ATC INFO AB54B
 *
 * Optional leading routing token, e.g. `/ATSCIXA.TI2/`, is extracted and
 * stripped before parsing the ATIS body.
 *
 * The ATIS header identifies:
 *   - Airport ICAO (4-letter)
 *   - ATIS type: ARR (arrival), DEP (departure), or combined
 *   - Information identifier letter (A–Z, "Alpha" through "Zulu")
 *   - Valid time (UTC)
 *
 * Weather fields follow standard METAR encoding where present:
 *   - Wind: DDDFFKT or DDDFFGFFKT (gusts)
 *   - Visibility: NNSM (statute miles) or NNNN (meters)
 *   - Sky: FEW/SCT/BKN/OVC + 3-digit hundreds-of-feet AGL
 *   - Ceiling: CIG <layer>
 *   - Temp/Dew: TT/TT (M prefix = minus)
 *   - Altimeter: A + 4 digits (inHg × 100) or Q + 4 digits (hPa)
 */
export class Label_A9_DAI extends DecoderPlugin {
  name = 'label-a9-dai';

  qualifiers() {
    return {
      labels: ['A9'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Deliver ATIS Information (D-ATIS uplink)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      ResultFormatter.unknown(decodeResult, message.text || '');
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Strip optional leading routing token, e.g. "/ATSCIXA.TI2/"
    let body = text;
    const routingMatch = body.match(/^\/([A-Z0-9.]+)\/\s*/);
    if (routingMatch) {
      decodeResult.raw.routingPrefix = routingMatch[1];
      body = body.substring(routingMatch[0].length);
    }

    // ATIS header: <ICAO> [ARR|DEP|ARR/DEP|ATIS]* ATIS <letter> <HHMMZ>
    // Examples:
    //   "CYYZ ARR ATIS A 0800Z"
    //   "KJFK ATIS C 1455Z"
    //   "EGLL DEP ATIS B 0612Z"
    const headerRegex =
      /^([A-Z]{4})\s+(?:((?:ARR|DEP|ARR\/DEP)?)\s*ATIS|ATIS)\s+([A-Z])\s+(\d{4})Z\b/;
    const h = body.match(headerRegex);
    let remainingBody = body;
    if (h) {
      const airport = h[1];
      const atisType = (h[2] || '').trim() || 'COMBINED';
      const letter = h[3];
      const hhmmZ = h[4] + 'Z';

      decodeResult.raw.arrival_icao = airport;
      decodeResult.raw.atis_airport = airport;
      decodeResult.raw.atis_type = atisType;
      decodeResult.raw.atis_letter = letter;
      decodeResult.raw.atis_time = hhmmZ;

      decodeResult.formatted.items.push(
        {
          type: 'message_type',
          code: 'MSGTYP',
          label: 'Message Type',
          value: 'D-ATIS (Deliver ATIS Information) — ground-to-air uplink',
        },
        {
          type: 'icao',
          code: 'ATIS_ARPT',
          label: 'Airport',
          value: airport,
        },
        {
          type: 'atis_type',
          code: 'ATIS_TYPE',
          label: 'ATIS Type',
          value:
            atisType === 'ARR'
              ? 'Arrival'
              : atisType === 'DEP'
                ? 'Departure'
                : atisType === 'ARR/DEP'
                  ? 'Arrival/Departure'
                  : atisType === 'COMBINED'
                    ? 'Combined'
                    : atisType,
        },
        {
          type: 'atis_letter',
          code: 'ATIS_LETTER',
          label: 'Info ID',
          value: `${letter} (${this.phonetic(letter)})`,
        },
        {
          type: 'time',
          code: 'ATIS_TIME',
          label: 'Valid Time',
          value: hhmmZ,
        },
      );
      remainingBody = body.substring(h[0].length).trim();
    }

    // METAR-style weather extraction over the remainder
    this.parseWeather(remainingBody, decodeResult);

    // Taxiway/runway closure & tower-freq advisory extraction (NOTAM-style A9
    // bodies that don't carry a proper ATIS header — common for fragments and
    // continuation blocks).
    this.parseRestrictions(remainingBody, decodeResult);

    // Crew-instruction style A9 body (no ATIS header, just a short advisory
    // referencing the current ATIS letter and who to report it to):
    //   HPA=
    //   ACKNOWLEDGE INFO R ON FIRST CTC WITH DELIVERY
    //   .F465
    this.parseCrewInstruction(text, decodeResult);

    // Embedded "INFORM <ICAO> ATC INFO <letter + optional suffix>" acknowledgement token
    const informMatch = remainingBody.match(
      /INFORM\s+([A-Z]{4})\s+ATC\s+INFO\s+([A-Z])([A-Z0-9]*)/,
    );
    if (informMatch) {
      decodeResult.raw.atis_inform_airport = informMatch[1];
      decodeResult.raw.atis_inform_letter = informMatch[2];
      if (informMatch[3]) {
        decodeResult.raw.atis_inform_suffix = informMatch[3];
      }
      decodeResult.formatted.items.push({
        type: 'atis_acknowledge',
        code: 'ATIS_ACK',
        label: 'Acknowledge on Contact',
        value: `Inform ${informMatch[1]} ATC — Info ${informMatch[2]}${informMatch[3] ? ' (ref ' + informMatch[3] + ')' : ''}`,
      });
    }

    // Expose the full free-text ATIS content as a single field for readability
    if (remainingBody) {
      decodeResult.raw.atis_text = remainingBody;
      decodeResult.formatted.items.push({
        type: 'atis_text',
        code: 'ATIS_BODY',
        label: 'ATIS Text',
        value: remainingBody,
      });
    }

    const didDecode = !!(
      h ||
      decodeResult.raw.routingPrefix ||
      decodeResult.raw.taxiway_closures ||
      decodeResult.raw.runway_closures ||
      decodeResult.raw.tower_frequency ||
      decodeResult.raw.hazardous_wx_area ||
      decodeResult.raw.sub_label ||
      decodeResult.raw.acknowledge_atis_letter ||
      decodeResult.raw.acknowledge_contact ||
      decodeResult.raw.flight_id
    );
    this.setDecodeLevel(decodeResult, didDecode, didDecode ? 'full' : 'partial');

    return decodeResult;
  }

  private phonetic(letter: string): string {
    const names: Record<string, string> = {
      A: 'Alpha',
      B: 'Bravo',
      C: 'Charlie',
      D: 'Delta',
      E: 'Echo',
      F: 'Foxtrot',
      G: 'Golf',
      H: 'Hotel',
      I: 'India',
      J: 'Juliet',
      K: 'Kilo',
      L: 'Lima',
      M: 'Mike',
      N: 'November',
      O: 'Oscar',
      P: 'Papa',
      Q: 'Quebec',
      R: 'Romeo',
      S: 'Sierra',
      T: 'Tango',
      U: 'Uniform',
      V: 'Victor',
      W: 'Whiskey',
      X: 'X-ray',
      Y: 'Yankee',
      Z: 'Zulu',
    };
    return names[letter.toUpperCase()] || letter;
  }

  private parseWeather(text: string, decodeResult: DecodeResult): void {
    if (!text) return;

    // Wind: DDDFFKT, DDDFFGFFKT (with gusts), or VRBFFKT
    const wind = text.match(/\b(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT\b/);
    if (wind) {
      const dir = wind[1] === 'VRB' ? 'variable' : `${wind[1]}°`;
      const speed = Number(wind[2]);
      const gust = wind[3] ? Number(wind[3]) : null;
      decodeResult.raw.wind_direction = wind[1] === 'VRB' ? 'VRB' : Number(wind[1]);
      decodeResult.raw.wind_speed = speed;
      if (gust != null) decodeResult.raw.wind_gust = gust;
      decodeResult.formatted.items.push({
        type: 'wind',
        code: 'WIND',
        label: 'Wind',
        value: `${dir} @ ${speed} kt${gust != null ? ` (gust ${gust} kt)` : ''}`,
      });
    }

    // Visibility: NNSM (statute miles, possibly with fraction like "1 1/2SM" or "P6SM")
    const visSM = text.match(/\b(P?\d+(?:\s\d\/\d)?|\d\/\d)SM\b/);
    if (visSM) {
      decodeResult.raw.visibility_sm = visSM[1];
      decodeResult.formatted.items.push({
        type: 'visibility',
        code: 'VIS',
        label: 'Visibility',
        value: `${visSM[1]} SM`,
      });
    } else {
      const visM = text.match(/\b(\d{4})\s*(?:M|METRES?)?\b/);
      // Only take 4-digit meters if followed by typical METAR keywords to avoid misfires
      if (visM && /\b\d{4}\s+(?:NDV|[A-Z]{2}V|[A-Z])/.test(text)) {
        decodeResult.raw.visibility_m = Number(visM[1])
        decodeResult.formatted.items.push({
          type: 'visibility',
          code: 'VIS',
          label: 'Visibility',
          value: `${visM[1]} m`,
        });
      }
    }

    // Sky conditions: FEW/SCT/BKN/OVC + 3-digit hundreds of feet (may repeat, may have CB/TCU)
    const skyRegex = /\b(FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?\b/g;
    const sky: Array<{ cover: string; altFeet: number; type?: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = skyRegex.exec(text)) !== null) {
      sky.push({
        cover: m[1],
        altFeet: Number(m[2]) * 100,
        type: m[3] || undefined,
      });
    }
    if (sky.length) {
      decodeResult.raw.sky_conditions = sky;
      decodeResult.formatted.items.push({
        type: 'sky',
        code: 'SKY',
        label: 'Sky',
        value: sky
          .map(
            (s) =>
              `${this.coverName(s.cover)} ${s.altFeet.toLocaleString()} ft${s.type ? ' ' + s.type : ''}`,
          )
          .join(', '),
      });
    }

    // Explicit ceiling callout: "CIG OVC140" → overcast at 14,000 ft
    const cig = text.match(/\bCIG\s+(FEW|SCT|BKN|OVC)?\s*(\d{3})\b/);
    if (cig) {
      const ft = Number(cig[2]) * 100;
      decodeResult.raw.ceiling = { cover: cig[1] || '', altFeet: ft };
      decodeResult.formatted.items.push({
        type: 'ceiling',
        code: 'CIG',
        label: 'Ceiling',
        value: `${cig[1] ? this.coverName(cig[1]) + ' ' : ''}${ft.toLocaleString()} ft`,
      });
    }

    // Temperature / dewpoint: TT/TT where M prefix = negative
    const td = text.match(/\b(M?\d{1,2})\/(M?\d{1,2})\b(?!\d)/);
    if (td) {
      const parse = (s: string) =>
        s.startsWith('M') ? -Number(s.substring(1)) : Number(s);
      const t = parse(td[1]);
      const d = parse(td[2]);
      decodeResult.raw.temperature_c = t;
      decodeResult.raw.dewpoint_c = d;
      decodeResult.formatted.items.push({
        type: 'temp_dew',
        code: 'TMP/DEW',
        label: 'Temp / Dew',
        value: `${t >= 0 ? '+' : ''}${t}°C / ${d >= 0 ? '+' : ''}${d}°C`,
      });
    }

    // Altimeter: A + 4 digits (inHg × 100) or Q + 4 digits (hPa)
    const altIn = text.match(/\bA(\d{4})\b/);
    if (altIn) {
      const inHg = Number(altIn[1]) / 100;
      decodeResult.raw.altimeter_inhg = inHg;
      decodeResult.formatted.items.push({
        type: 'altimeter',
        code: 'ALTIM',
        label: 'Altimeter',
        value: `${inHg.toFixed(2)} inHg`,
      });
    } else {
      const altQ = text.match(/\bQ(\d{3,4})\b/);
      if (altQ) {
        const hpa = Number(altQ[1]);
        decodeResult.raw.altimeter_hpa = hpa;
        decodeResult.formatted.items.push({
          type: 'altimeter',
          code: 'ALTIM',
          label: 'Altimeter',
          value: `${hpa} hPa`,
        });
      }
    }

    // Active approach / runway info
    const apch = text.match(
      /\bAPCH\s+([A-Z]+(?:\s+[A-Z]+)*?)\s+RWY\s+(\d{1,2}[LRC]?)\b/,
    );
    if (apch) {
      decodeResult.raw.approach_type = apch[1];
      decodeResult.raw.approach_runway = apch[2];
      decodeResult.formatted.items.push({
        type: 'approach',
        code: 'APCH',
        label: 'Approach',
        value: `${apch[1]} RWY ${apch[2]}`,
      });
    }

    const ldg = text.match(
      /\bLDG(?:\s+AND\s+DEP)?\s+RWY\s+(\d{1,2}[LRC]?(?:\s*(?:AND|,|\/)\s*\d{1,2}[LRC]?)*)/,
    );
    if (ldg) {
      decodeResult.raw.runways_in_use = ldg[1];
      decodeResult.formatted.items.push({
        type: 'runways',
        code: 'RWY',
        label: 'Runways in Use',
        value: ldg[1],
      });
    }

    // Bird hazard advisory
    const bird = text.match(
      /\b([A-Z/ ]*BIRD[A-Z /]*ACT(?:IVITY)?[A-Z /]*)(?:\.|$)/,
    );
    if (bird) {
      decodeResult.raw.bird_hazard = bird[1].trim();
      decodeResult.formatted.items.push({
        type: 'hazard',
        code: 'HAZARD',
        label: 'Wildlife Hazard',
        value: bird[1].trim(),
      });
    }
  }

  /**
   * Extract NOTAM-style closure / advisory tokens commonly seen in A9 message
   * bodies that aren't framed as proper D-ATIS reports (e.g. taxiway/runway
   * closures, tower frequency advisories, hazardous-weather call-outs).
   *
   * Handles fragmented sentences with stray commas — a known characteristic
   * of multi-block A9 transmissions where punctuation is inserted by the
   * onboard printer formatter.
   */
  private parseRestrictions(text: string, decodeResult: DecodeResult): void {
    if (!text) return;

    // Normalize: drop commas, drop standalone dots used as sentence
    // separators, then collapse whitespace. Critically, decimal points
    // inside numbers (e.g. "118.5") must be preserved — only dots that
    // are surrounded by whitespace or string boundaries are removed.
    const norm = text
      .replace(/,/g, ' ')
      .replace(/(?:^|\s)\.+(?=\s|$)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // ── Taxiway closures ──
    // Variants:
    //   TWY S CLSD BTN RWY 27R AND TWY D
    //   TWY G BTN RWY 35 AND TWY J        (CLSD implied by surrounding context)
    //   TWY K1 CLSD
    //   TWY S4 CLSD
    //   BTN TWY E3 AND TWY E4              (segment fragment, taxiway id missing)
    const closures: Array<{ taxiway: string; segment?: string }> = [];
    // Segment ends at the next sentence break: another lone "TWY <id> CLSD",
    // a CLSD/HAZD/TOWER/HOLD keyword start, or end of string.
    const twyClsdRe =
      /\bTWY\s+([A-Z]\d{0,2})\s+(?:CLSD\b\s*)?(?:BTN\s+(.+?)(?=\s+TWY\s+[A-Z]\d{0,2}\s+(?:CLSD|BTN)\b|\s+CLSD\b|\s+HAZD\b|\s+TOWER\b|\s+TWR\b|\s+HOLD\b|\s+RWY\s+\d+\s+(?:LEFT|RIGHT|CENTER|L\b|R\b|C\b)?\s*HOLD\b|$))?/g;
    let tm: RegExpExecArray | null;
    while ((tm = twyClsdRe.exec(norm)) !== null) {
      const id = tm[1];
      const seg = tm[2]?.trim();
      // Only include if we actually found a closure context (CLSD nearby) or a
      // segment description; bare "TWY X" with neither is too noisy.
      if (/\bCLSD\b/.test(tm[0]) || seg) {
        closures.push({ taxiway: id, ...(seg ? { segment: seg } : {}) });
      }
    }
    if (closures.length) {
      decodeResult.raw.taxiway_closures = closures;
      decodeResult.formatted.items.push({
        type: 'taxiway_closures',
        code: 'TWYCLSD',
        label: 'Taxiway Closures',
        value: closures
          .map((c) =>
            c.segment ? `TWY ${c.taxiway} (${c.segment})` : `TWY ${c.taxiway}`,
          )
          .join('; '),
      });
    }

    // ── Runway / hold-pad closures ──
    // E.g. "RWY 9 RIGHT HOLD PAD CLSD", "RWY 27L CLSD"
    const rwyCloseRe =
      /\bRWY\s+(\d{1,2}(?:\s*(?:LEFT|RIGHT|CENTER|L|R|C))?)\s+(HOLD\s+PAD\s+)?CLSD\b/g;
    const rwyClosures: Array<{ runway: string; holdPad?: boolean }> = [];
    let rm: RegExpExecArray | null;
    while ((rm = rwyCloseRe.exec(norm)) !== null) {
      const runway = rm[1].replace(/\s+/g, ' ').trim();
      rwyClosures.push({
        runway,
        ...(rm[2] ? { holdPad: true } : {}),
      });
    }
    if (rwyClosures.length) {
      decodeResult.raw.runway_closures = rwyClosures;
      decodeResult.formatted.items.push({
        type: 'runway_closures',
        code: 'RWYCLSD',
        label: 'Runway Closures',
        value: rwyClosures
          .map((r) =>
            r.holdPad ? `RWY ${r.runway} hold pad` : `RWY ${r.runway}`,
          )
          .join('; '),
      });
    }

    // ── Tower / common frequency callout ──
    // "TOWER FREQ 118.5 FOR ALL RUNWAYS" or "TWR FREQ 118.5"
    const twrFreq = norm.match(
      /\b(?:TOWER|TWR)\s+FREQ\s+(\d{3}\.\d{1,3})(?:\s+FOR\s+(.+?))?(?=\s+HAZD\b|\s*$)/,
    );
    if (twrFreq) {
      decodeResult.raw.tower_frequency = twrFreq[1];
      const scope = twrFreq[2]?.trim().replace(/[.,;]+$/, '');
      if (scope) decodeResult.raw.tower_frequency_scope = scope;
      decodeResult.formatted.items.push({
        type: 'tower_frequency',
        code: 'TWRFRQ',
        label: 'Tower Frequency',
        value: scope
          ? `${twrFreq[1]} MHz (${scope.toLowerCase()})`
          : `${twrFreq[1]} MHz`,
      });
    }

    // ── Hazardous weather advisory area ──
    // "HAZD WX INFO FOR PHL AREA" — capture target airport (3- or 4-letter)
    const hazd = norm.match(
      /\bHAZD\s+WX(?:\s+INFO)?\s+FOR\s+([A-Z]{3,4})\s+AREA\b/,
    );
    if (hazd) {
      decodeResult.raw.hazardous_wx_area = hazd[1];
      decodeResult.formatted.items.push({
        type: 'hazardous_wx',
        code: 'HAZDWX',
        label: 'Hazardous Weather Area',
        value: `${hazd[1]} area`,
      });
    }
  }

  /**
   * Parse crew-instruction style A9 uplinks — short messages carrying an
   * ATIS letter reference plus ack instructions, typically paired with a
   * leading sub-label prefix and a trailing flight-ID token.
   *
   *   HPA=                                       ← ARINC-618 sub-label + '=' separator
   *   ACKNOWLEDGE INFO R ON FIRST CTC WITH DELIVERY
   *   .F465                                      ← leading-dot flight ID
   */
  private parseCrewInstruction(text: string, decodeResult: DecodeResult): void {
    // Sub-label: 2–4 uppercase chars followed by '=' at the start of a line.
    const sub = text.match(/(?:^|\n)([A-Z]{2,4})=/);
    if (sub) {
      decodeResult.raw.sub_label = sub[1];
      decodeResult.formatted.items.push({
        type: 'sub_label',
        code: 'SUBLBL',
        label: 'Sub-Label',
        value: `${sub[1]}=`,
      });
    }

    // ACKNOWLEDGE INFO <letter> [ON FIRST CTC WITH <contact>]
    const ack = text.match(
      /\bACKNOWLEDGE\s+INFO\s+([A-Z])\b(?:\s+(?:ON\s+)?FIRST\s+CTC\s+WITH\s+([A-Z][A-Z ]*?))?(?=\s*(?:\.|\n|$))/,
    );
    if (ack) {
      const letter = ack[1];
      decodeResult.raw.acknowledge_atis_letter = letter;
      decodeResult.formatted.items.push({
        type: 'acknowledge_atis_letter',
        code: 'ACK_ATIS',
        label: 'Acknowledge ATIS Info',
        value: `${letter} (${this.phonetic(letter)})`,
      });
      if (ack[2]) {
        const contact = ack[2].trim();
        decodeResult.raw.acknowledge_contact = contact;
        decodeResult.formatted.items.push({
          type: 'acknowledge_contact',
          code: 'ACK_CTC',
          label: 'Acknowledge On First Contact With',
          value: contact,
        });
      }
    }

    // Trailing flight-ID token: a leading '.' followed by a carrier-style
    // flight number (e.g. ".F465", ".AA1234").
    const fid = text.match(/(?:^|\n)\.([A-Z]{1,3}\d{1,5})\s*$/);
    if (fid) {
      decodeResult.raw.flight_id = fid[1];
      ResultFormatter.flightNumber(decodeResult, fid[1]);
      decodeResult.formatted.items.push({
        type: 'flight_id',
        code: 'FLIGHTID',
        label: 'Flight ID',
        value: fid[1],
      });
    }
  }

  private coverName(code: string): string {
    switch (code) {
      case 'FEW':
        return 'Few';
      case 'SCT':
        return 'Scattered';
      case 'BKN':
        return 'Broken';
      case 'OVC':
        return 'Overcast';
      default:
        return code;
    }
  }
}
