// AUTO-GENERATED from /Users/kevin/Cloud/Dropbox/work/airframes/acars-decoder-typescript/vendor/airframes-decoder/spec/labels/44/POS.yaml. Do not edit.
// Plugin: Label_44_POS
// Docs: https://github.com/airframesio/acars-message-documentation/blob/main/research/44/POS.md

import { DecoderPlugin } from "@airframes/ads-runtime-ts";
import type { DecodeResult, Message, Options } from "@airframes/ads-runtime-ts";
import { ResultFormatter } from "@airframes/ads-runtime-ts";
import * as helpers from "@airframes/ads-runtime-ts/helpers";
import * as hatches from "../escape_hatches";

export class Label_44_POS extends DecoderPlugin {
  name = "label-44-pos";

  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00POS01","00POS02","00POS03","POS01","POS02","POS03"],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, "Position Report");

    const m_match = message.text.match(new RegExp("^.*,(?<unsplit_coords>.*),(?<flight_level_or_ground>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<eta_time>.*),(?<fuel_in_tons>.*)$"));
    if (!m_match?.groups) {
      return this.failUnknown(result, message.text, options);
    }
    const m = m_match.groups;
    const position = helpers.coordinateDecimalMinutes(m.unsplit_coords, {"style":"combined","format":"NSDDMM_M_EWDDMM_M"});
    const flight_level_raw = hatches.parse_flight_level_or_ground(m.flight_level_or_ground, {});
    result.raw.flight_level_raw = flight_level_raw;
    const altitude = hatches.flight_level_to_altitude_feet(flight_level_raw, {});
    const month = helpers.integer(m.current_date, {"substring_start":0,"substring_length":2});
    const day = helpers.integer(m.current_date, {"substring_start":2,"substring_length":2});
    const timestamp = helpers.timestampHhmmss(m.current_time, {"append":"00"});
    const eta = helpers.timestampHhmmss(m.eta_time, {"append":"00"});
    if (!(["***","****"].includes(m.fuel_in_tons))) {
      const fuel_in_tons = helpers.float(m.fuel_in_tons);
    }
    const departure_icao = helpers.airport(m.departure_icao);
    const arrival_icao = helpers.airport(m.arrival_icao);
    ResultFormatter.position(result, position);
    ResultFormatter.timestamp(result, month);
    ResultFormatter.timestamp(result, day);
    ResultFormatter.timestamp(result, timestamp);
    ResultFormatter.timestamp(result, eta);
    ResultFormatter.fuel(result, fuel_in_tons);
    ResultFormatter.departureAirport(result, departure_icao);
    ResultFormatter.arrivalAirport(result, arrival_icao);
    ResultFormatter.altitude(result, altitude);
    this.setDecodeLevel(result, true, 'full');
    return result;
  }
}
