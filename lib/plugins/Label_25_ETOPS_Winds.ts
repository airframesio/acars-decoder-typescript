import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

/**
 * Label 25 — ETOPS Winds (free-text uplink, ground → aircraft)
 *
 * A ground-to-air free-text uplink delivering upper-level wind forecasts
 * at a set of named ETOPS alternate waypoints / airports. The cockpit
 * (and/or FMS) uses these winds to calculate diversion fuel burn for
 * each alternate, verifying the aircraft can reach a safe landing
 * airport within the ETOPS time limit after an engine-out en route.
 *
 * Body structure (example, Delta Air Lines):
 *
 *   42                         ← airline/printer sub-type prefix (optional)
 *   ETOPS WINDS                ← fixed title
 *   BIKF                       ← waypoint 1 — 4-letter ICAO airport code
 *   FL410  206/27              ← flight level + wind DDD/SS (from, knots)
 *   FL390  211/41
 *   FL340  225/46
 *   FL300  202/29
 *   CYWG                       ← waypoint 2 ...
 *   FL410  315/46
 *   ...
 *   04-19-2026 00:00:00Z       ← UTC forecast valid time (footer)
 *
 * Wind notation:   DDD/SS  (3-digit direction wind is FROM, speed in knots)
 */
export class Label_25_ETOPS_Winds extends DecoderPlugin {
  name = 'label-25-etops-winds';

  qualifiers() {
    return {
      labels: ['25'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'ETOPS Winds (ground-to-air forecast uplink)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // Label 25 is a general free-text uplink. Detect the ETOPS WINDS
    // specialization; otherwise fall back to a generic decode that still
    // exposes the body to the user.
    const isEtops = /ETOPS\s+WINDS/i.test(text);
    if (!isEtops) {
      return this.decodeGenericFreeText(message, decodeResult, text);
    }

    // Override the description since this is the specialized variant
    decodeResult.formatted.description =
      'ETOPS Winds (ground-to-air forecast uplink)';

    const lines = text
      .replace(/\r/g, '')
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let airlinePrefix = '';
    let forecastTime = '';
    const waypoints: Array<{
      icao: string;
      winds: Array<{ fl: number; altFt: number; dir: number; speed: number }>;
    }> = [];
    let current: (typeof waypoints)[number] | null = null;
    const remaining: string[] = [];

    for (const line of lines) {
      // Airline prefix — a single 1–4 digit/alpha token that appears before the title
      if (
        !airlinePrefix &&
        waypoints.length === 0 &&
        !forecastTime &&
        /^[A-Z0-9]{1,4}$/.test(line) &&
        !/ETOPS/i.test(line)
      ) {
        airlinePrefix = line;
        continue;
      }

      // Title
      if (/^ETOPS\s+WINDS$/i.test(line)) continue;

      // Footer timestamp:  MM-DD-YYYY HH:MM:SSZ  or  YYYY-MM-DD HH:MM:SSZ
      const ts = line.match(
        /^(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})Z?$/,
      );
      if (ts) {
        forecastTime = `${ts[1]} ${ts[2]}Z`;
        continue;
      }

      // ICAO waypoint: a 4-letter uppercase code on its own line
      if (/^[A-Z]{4}$/.test(line)) {
        current = { icao: line, winds: [] };
        waypoints.push(current);
        continue;
      }

      // Wind line: "FL410  206/27"  (tolerates multiple spaces, optional leading 'FL')
      // Also tolerates the rare cases where two airports/lines are glued together —
      // matches repeatedly within the line so "FL300  260/71EGPK" still works via pre-split.
      const wind = line.match(
        /^FL\s*(\d{2,3})\s+(\d{3})\/(\d{1,3})\s*([A-Z]{4})?$/,
      );
      if (wind && current) {
        const fl = Number(wind[1]);
        const dir = Number(wind[2]);
        const speed = Number(wind[3]);
        current.winds.push({ fl, altFt: fl * 100, dir, speed });
        if (wind[4]) {
          // Line was glued to the next waypoint — start a new waypoint block
          current = { icao: wind[4], winds: [] };
          waypoints.push(current);
        }
        continue;
      }

      remaining.push(line);
    }

    if (!waypoints.length && !forecastTime) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.raw.message_type = 'ETOPS_WINDS';
    if (airlinePrefix) decodeResult.raw.airline_prefix = airlinePrefix;
    if (forecastTime) decodeResult.raw.forecast_time = forecastTime;
    decodeResult.raw.waypoints = waypoints;

    decodeResult.formatted.items.push(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'ETOPS Winds — ground-to-air forecast uplink',
      },
      {
        type: 'direction',
        code: 'DIR',
        label: 'Direction',
        value: 'Uplink (ground → aircraft)',
      },
    );
    if (airlinePrefix) {
      decodeResult.formatted.items.push({
        type: 'prefix',
        code: 'PREFIX',
        label: 'Airline / Sub-type Prefix',
        value: airlinePrefix,
      });
    }
    if (forecastTime) {
      decodeResult.formatted.items.push({
        type: 'forecast_time',
        code: 'FCSTIME',
        label: 'Forecast Valid (UTC)',
        value: forecastTime,
      });
    }

    // One row per waypoint (compact wind summary), plus a WP-count row up top
    decodeResult.formatted.items.push({
      type: 'waypoint_count',
      code: 'WPCOUNT',
      label: 'Waypoints',
      value: `${waypoints.length} (${waypoints.map((w) => w.icao).join(', ')})`,
    });
    for (const wp of waypoints) {
      const summary = wp.winds
        .map((w) => `FL${w.fl} ${String(w.dir).padStart(3, '0')}°/${w.speed}kt`)
        .join(', ');
      decodeResult.formatted.items.push({
        type: 'etops_waypoint',
        code: 'WP_' + wp.icao,
        label: `Waypoint ${wp.icao}`,
        value: summary,
      });
    }

    if (remaining.length) {
      decodeResult.remaining.text = remaining.join('\n');
    }

    this.setDecodeLevel(
      decodeResult,
      true,
      remaining.length ? 'partial' : 'full',
    );
    return decodeResult;
  }

  /**
   * Fallback for generic label-25 free-text uplinks. Always marks the
   * message as decoded and exposes the body plus any commonly-embedded
   * fields (airline/printer prefix, title line, timestamp, OFP/flight
   * tokens) so the user still gets useful structure rather than nothing.
   */
  private decodeGenericFreeText(
    message: Message,
    decodeResult: DecodeResult,
    text: string,
  ): DecodeResult {
    decodeResult.formatted.description = 'Free-text Uplink (ground-to-air)';

    const lines = text
      .replace(/\r/g, '')
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    decodeResult.formatted.items.push(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Free-text Uplink (ground-to-air)',
      },
      {
        type: 'direction',
        code: 'DIR',
        label: 'Direction',
        value: 'Uplink (ground → aircraft)',
      },
    );

    // Airline/printer sub-type prefix — a short alphanumeric first line
    if (
      lines.length >= 1 &&
      /^[A-Z0-9]{1,6}$/.test(lines[0]) &&
      lines.length > 1
    ) {
      decodeResult.raw.airline_prefix = lines[0];
      decodeResult.formatted.items.push({
        type: 'prefix',
        code: 'PREFIX',
        label: 'Airline / Sub-type Prefix',
        value: lines[0],
      });
    }

    // Title line — if the 1st non-prefix line is short and all-caps words
    const firstContent = lines.find(
      (l) => !(decodeResult.raw.airline_prefix === l),
    );
    if (
      firstContent &&
      firstContent.length <= 80 &&
      /^[A-Z0-9][A-Z0-9 /]+$/.test(firstContent) &&
      firstContent.split(/\s+/).length <= 8
    ) {
      decodeResult.raw.title = firstContent;
      decodeResult.formatted.items.push({
        type: 'title',
        code: 'TITLE',
        label: 'Title',
        value: firstContent,
      });
    }

    // Trailing timestamp
    const last = lines[lines.length - 1] || '';
    const ts = last.match(
      /^(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})Z?$/,
    );
    if (ts) {
      decodeResult.raw.timestamp = `${ts[1]} ${ts[2]}Z`;
      decodeResult.formatted.items.push({
        type: 'timestamp',
        code: 'TIME',
        label: 'Timestamp (UTC)',
        value: String(decodeResult.raw.timestamp),
      });
    }

    // Flight / OFP tokens embedded in the body — common patterns
    const flight = text.match(/\bFLT\s*[:#]?\s*([A-Z0-9]{3,7})\b/);
    if (flight) {
      decodeResult.raw.flight_number = flight[1];
      decodeResult.formatted.items.push({
        type: 'flight',
        code: 'FLT',
        label: 'Flight',
        value: flight[1],
      });
    }
    const ofp = text.match(/\bOFP\s*[:#]?\s*([A-Z0-9-]+)/);
    if (ofp) {
      decodeResult.raw.ofp = ofp[1];
      decodeResult.formatted.items.push({
        type: 'ofp',
        code: 'OFP',
        label: 'OFP',
        value: ofp[1],
      });
    }

    // Expose the full body for the user
    decodeResult.raw.body = text;
    decodeResult.formatted.items.push({
      type: 'body',
      code: 'BODY',
      label: 'Body',
      value: text,
    });

    this.setDecodeLevel(decodeResult, true, 'partial');
    return decodeResult;
  }
}
