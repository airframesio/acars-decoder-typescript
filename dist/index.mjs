// lib/IcaoDecoder.ts
var IcaoDecoder = class {
  name;
  icao;
  constructor(icao) {
    this.name = "icao-decoder-typescript";
    this.icao = icao;
  }
  isMilitary() {
    let i = this.icao;
    return i.match(/^adf[7-9]/) || i.match(/^adf[a-f]/) || i.match(/^a(e|f)/) || i.match(/^0100(7|8)/) || i.match(/^0a4/) || i.match(/^33ff/) || i >= "350000" && i <= "37ffff" || i.match(/^3a(8|9|[a-f])/) || i.match(/^3b/) || i.match(/^3e(a|b)/) || i.match(/^3f([4-9]|[a-b])/) || i.match(/^4000[0-3]/) || i.match(/^43c/) || i.match(/^44[4-7]/) && i != "447ac7" || i.match(/^44f/) || i.match(/^457/) || i.match(/^45f4/) || i.match(/^468[0-3]/) || i.match(/^473c0/) || i.match(/^4781/) || i.match(/^480/) || i.match(/^48d8[0-7]/) || i.match(/^497c/) || i.match(/^49842/) || i.match(/^4b7/) || i.match(/^4b82/) || i.match(/^506f/) || i.match(/^70c07/) || i.match(/^7102[5-8]/) || i.match(/^7103[8-9]/) || i.match(/^738a/) || i.match(/^7c8([2-4]|8)/) || i >= "7c9000" && i <= "7cbfff" || i.match(/^7[d-f]/) || i.match(/^8002/) || i.match(/^c[2-3]/) || i.match(/^e4[0-1]/) || i.match(/^e806/);
  }
};

// lib/DecoderPlugin.ts
var DecoderPlugin = class {
  decoder;
  name = "unknown";
  defaultResult = {
    decoded: false,
    decoder: {
      name: "unknown",
      type: "pattern-match",
      decodeLevel: "none"
    },
    formatted: {
      description: "Unknown",
      items: []
    },
    raw: {},
    remaining: {}
  };
  options;
  constructor(decoder, options = {}) {
    this.decoder = decoder;
    this.options = options;
  }
  id() {
    console.log("DecoderPlugin subclass has not overriden id() to provide a unique ID for this plugin!");
    return "abstract_decoder_plugin";
  }
  meetsStateRequirements() {
    return true;
  }
  // onRegister(store: Store<any>) {
  //   this.store = store;
  // }
  qualifiers() {
    const labels = [];
    return {
      labels
    };
  }
  decode(message) {
    const decodeResult = this.defaultResult;
    decodeResult.remaining.text = message.text;
    return decodeResult;
  }
};

// lib/plugins/Label_5Z.ts
var Label_5Z = class extends DecoderPlugin {
  name = "label-5z";
  descriptions = {
    B1: "Request Weight and Balance",
    B3: "Request Departure Clearance",
    CD: "Weight and Balance",
    CG: "Request Pre-departure clearance, PDC",
    CM: "Crew Scheduling",
    C3: "Off Message",
    C4: "Flight Dispatch",
    C5: "Maintenance Message",
    C6: "Customer Service",
    10: "PIREP",
    C11: "International PIREP",
    DS: "Late Message",
    D3: "Holding Pattern Message",
    D6: "From-To + Date",
    D7: "From-To + Alternate + Time",
    EO: "In Range",
    PW: "Position Weather",
    RL: "Request Release",
    R3: "Request HOWGOZIT Message",
    R4: "Request the Latest POSBD",
    TC: "From-To Fuel",
    WB: "From-To",
    W1: "Request Weather for City"
  };
  qualifiers() {
    return {
      labels: ["5Z"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Airline Designated Downlink";
    const uaRegex = /^\/(?<type>\w+) (?<remainder>.+)/;
    let results = message.text.match(uaRegex);
    if (results && results.length >= 2) {
      const type = results.groups.type.split("/")[0];
      const { remainder } = results.groups;
      const typeDescription = this.descriptions[type] ? this.descriptions[type] : "Unknown";
      decodeResult.raw.airline = "United Airlines";
      decodeResult.formatted.items.push({
        type: "airline",
        label: "Airline",
        value: "United Airlines"
      });
      decodeResult.raw.message_type = type;
      decodeResult.formatted.items.push({
        type: "message_type",
        label: "Message Type",
        value: `${typeDescription} (${type})`
      });
      if (type === "B3") {
        const rdcRegex = /^(?<from>\w\w\w)(?<to>\w\w\w) (?<unknown1>\d\d) R(?<runway>.+) G(?<unknown2>.+)$/;
        results = remainder.match(rdcRegex);
        if (results) {
          decodeResult.raw.origin = results.groups.from;
          decodeResult.formatted.items.push({
            type: "origin",
            label: "Origin",
            value: `${results.groups.from}`
          });
          decodeResult.raw.destination = results.groups.to;
          decodeResult.formatted.items.push({
            type: "destination",
            label: "Destination",
            value: `${results.groups.to}`
          });
          decodeResult.formatted.items.push({
            type: "unknown1",
            label: "Unknown Field 1",
            value: `${results.groups.unknown1}`
          });
          decodeResult.raw.runway = results.groups.runway;
          decodeResult.formatted.items.push({
            type: "runway",
            label: "Runway",
            value: `${results.groups.runway}`
          });
          decodeResult.formatted.items.push({
            type: "unknown2",
            label: "Unknown Field 2",
            value: `${results.groups.unknown2}`
          });
        } else {
          if (options.debug) {
            console.log(`Decoder: Unkown 5Z RDC format: ${remainder}`);
          }
        }
      } else {
        decodeResult.remaining.text = remainder;
      }
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "partial";
    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown 5Z message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = "none";
    }
    return decodeResult;
  }
};

// lib/plugins/Label_12_N_Space.ts
var Label_12_N_Space = class extends DecoderPlugin {
  name = "label-12-n-space";
  qualifiers() {
    return {
      labels: ["12"],
      preambles: ["N "]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Position Report";
    decodeResult.message = message;
    const variant1Regex = /^(?<lat>[NS])\s(?<lat_coord>.*),(?<long>[EW])\s*(?<long_coord>.*),(?<alt>.*),(?<unkwn1>.*),\s*(?<unkwn2>.*),.(?<airframe>.*),(?<unkwn3>.*)$/;
    let results;
    if (results = message.text.match(variant1Regex)) {
      if (options.debug) {
        console.log(`Label 12 N : results`);
        console.log(results);
      }
      decodeResult.raw.latitude_direction = results.groups.lat;
      decodeResult.raw.latitude = Number(results.groups.lat_coord);
      decodeResult.raw.longitude_direction = results.groups.long;
      decodeResult.raw.longitude = Number(results.groups.long_coord);
      decodeResult.raw.flight_level = results.groups.alt == "GRD" || results.groups.alt == "***" ? "0" : Number(results.groups.alt);
      decodeResult.formatted.items.push({
        type: "aircraft_position",
        code: "POS",
        label: "Aircraft Position",
        value: `${results.groups.lat_coord} ${decodeResult.raw.latitude_direction}, ${results.groups.long_coord} ${decodeResult.raw.longitude_direction}`
      });
      decodeResult.formatted.items.push({
        type: "flight_level",
        code: "FL",
        label: "Flight Level",
        value: decodeResult.raw.flight_level
      });
      decodeResult.remaining.text = `,${results.groups.unkwn1} ,${results.groups.unkwn2}, ${results.groups.unkwn3}`;
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "partial";
    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown 12 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = "none";
    }
    return decodeResult;
  }
};

// lib/utils/coordinate_utils.ts
var CoordinateUtils = class {
  static decodeStringCoordinates(stringCoords) {
    var results = {};
    const firstChar = stringCoords.substring(0, 1);
    let middleChar = stringCoords.substring(6, 7);
    let longitudeChars = stringCoords.substring(7, 13);
    if (middleChar == " ") {
      middleChar = stringCoords.substring(7, 8);
      longitudeChars = stringCoords.substring(8, 14);
    }
    if ((firstChar === "N" || firstChar === "S") && (middleChar === "W" || middleChar === "E")) {
      results.latitudeDirection = firstChar;
      results.latitude = Number(stringCoords.substring(1, 6)) / 1e3 * (firstChar === "S" ? -1 : 1);
      results.longitudeDirection = middleChar;
      results.longitude = Number(longitudeChars) / 1e3 * (middleChar === "W" ? -1 : 1);
    } else {
      return;
    }
    return results;
  }
  static coordinateString(coords) {
    return `${Math.abs(coords.latitude)} ${coords.latitudeDirection}, ${Math.abs(coords.longitude)} ${coords.longitudeDirection}`;
  }
  static latLonToCoordinateString(lat, lon) {
    const latDir = lat > 0 ? "N" : "S";
    const lonDir = lon > 0 ? "E" : "W";
    return `${Math.abs(lat)} ${latDir}, ${Math.abs(lon)} ${lonDir}`;
  }
};

// lib/plugins/Label_15.ts
var Label_15 = class extends DecoderPlugin {
  name = "label-5z";
  qualifiers() {
    return {
      labels: ["15"],
      preambles: ["(2"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Position Report";
    const twoZeeRegex = /^\(2(?<between>.+)\(Z$/;
    const results = message.text.match(twoZeeRegex);
    if (results) {
      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(results.groups.between.substr(0, 13));
      if (decodeResult.raw.position) {
        decodeResult.formatted.items.push({
          type: "position",
          code: "POS",
          label: "Position",
          value: CoordinateUtils.coordinateString(decodeResult.raw.position)
        });
      }
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "partial";
    return decodeResult;
  }
};

// lib/plugins/Label_15_FST.ts
var Label_15_FST = class extends DecoderPlugin {
  name = "label-15-fst";
  qualifiers() {
    return {
      labels: ["15"],
      preambles: ["FST01"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Position Report";
    decodeResult.message = message;
    decodeResult.raw.departure_icao = message.text.substring(5, 9);
    decodeResult.raw.arrival_icao = message.text.substring(9, 13);
    const stringCoords = message.text.substring(13);
    const firstChar = stringCoords.substring(0, 1);
    const middleChar = stringCoords.substring(7, 8);
    decodeResult.raw.position = {};
    if ((firstChar === "N" || firstChar === "S") && (middleChar === "W" || middleChar === "E")) {
      decodeResult.raw.position.latitudeDirection = firstChar;
      decodeResult.raw.position.latitude = Number(stringCoords.substring(1, 7)) / 1e4 * (firstChar === "S" ? -1 : 1);
      decodeResult.raw.position.longitudeDirection = middleChar;
      decodeResult.raw.position.longitude = Number(stringCoords.substring(8, 26)) / 1e5 * (middleChar === "W" ? -1 : 1);
    } else {
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = "none";
      return decodeResult;
    }
    decodeResult.formatted.items.push({
      type: "position",
      label: "Position",
      value: CoordinateUtils.coordinateString(decodeResult.raw.position)
    });
    decodeResult.formatted.items.push({
      type: "origin",
      code: "ORG",
      label: "Origin",
      value: decodeResult.raw.departure_icao
    });
    decodeResult.formatted.items.push({
      type: "destination",
      code: "DST",
      label: "Destination",
      value: decodeResult.raw.arrival_icao
    });
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "full";
    return decodeResult;
  }
};

// lib/plugins/Label_16_N_Space.ts
var Label_16_N_Space = class extends DecoderPlugin {
  name = "label-16-n-space";
  qualifiers() {
    return {
      labels: ["16"],
      preambles: ["N "]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Position Report";
    decodeResult.message = message;
    let variant1Regex = /^(?<lat>[NS])\s(?<lat_coord>.*),(?<long>[EW])\s*(?<long_coord>.*),(?<alt>.*),(?<unkwn1>.*),\s*(?<unkwn2>.*)$/;
    let variant2Regex = /^(?<lat>[NS])\s(?<lat_coord>.*)\/(?<long>[EW])\s*(?<long_coord>.*)$/;
    let results;
    if (results = message.text.match(variant1Regex)) {
      if (options.debug) {
        console.log(`Label 16 N : results`);
        console.log(results);
      }
      decodeResult.raw.latitude_direction = results.groups.lat;
      decodeResult.raw.latitude = Number(results.groups.lat_coord);
      decodeResult.raw.longitude_direction = results.groups.long;
      decodeResult.raw.longitude = Number(results.groups.long_coord);
      decodeResult.raw.flight_level = results.groups.alt == "GRD" || results.groups.alt == "***" ? "0" : Number(results.groups.alt);
      decodeResult.formatted.items.push({
        type: "aircraft_position",
        code: "POS",
        label: "Aircraft Position",
        value: `${decodeResult.raw.latitude} ${decodeResult.raw.latitude_direction}, ${decodeResult.raw.longitude} ${decodeResult.raw.longitude_direction}`
      });
      decodeResult.formatted.items.push({
        type: "flight_level",
        code: "FL",
        label: "Flight Level",
        value: decodeResult.raw.flight_level
      });
      decodeResult.remaining.text = `,${results.groups.unkwn1} ,${results.groups.unkwn2}`;
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "partial";
    } else if (results = message.text.match(variant2Regex)) {
      if (options.debug) {
        console.log(`Label 16 N : results`);
        console.log(results);
      }
      decodeResult.raw.latitude_direction = results.groups.lat;
      decodeResult.raw.latitude = Number(results.groups.lat_coord);
      decodeResult.raw.longitude_direction = results.groups.long;
      decodeResult.raw.longitude = Number(results.groups.long_coord);
      decodeResult.formatted.items.push({
        type: "aircraft_position",
        code: "POS",
        label: "Aircraft Position",
        value: `${results.groups.lat_coord} ${decodeResult.raw.latitude_direction}, ${results.groups.long_coord} ${decodeResult.raw.longitude_direction}`
      });
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "full";
    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown 16 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = "none";
    }
    return decodeResult;
  }
};

// lib/DateTimeUtils.ts
var DateTimeUtils = class {
  // Expects a four digit UTC time string (HHMM)
  static UTCToString(UTCString) {
    let utcDate = /* @__PURE__ */ new Date();
    utcDate.setUTCHours(+UTCString.substr(0, 2), +UTCString.substr(2, 2), 0);
    return utcDate.toTimeString();
  }
  // Expects a six digit date string and a four digit UTC time string
  // (DDMMYY) (HHMM)
  static UTCDateTimeToString(dateString, timeString) {
    let utcDate = /* @__PURE__ */ new Date();
    utcDate.setUTCDate(+dateString.substr(0, 2));
    utcDate.setUTCMonth(+dateString.substr(2, 2));
    if (dateString.length === 6) {
      utcDate.setUTCFullYear(2e3 + +dateString.substr(4, 2));
    }
    if (timeString.length === 6) {
      utcDate.setUTCHours(+timeString.substr(0, 2), +timeString.substr(2, 2), +timeString.substr(4, 2));
    } else {
      utcDate.setUTCHours(+timeString.substr(0, 2), +timeString.substr(2, 2), 0);
    }
    return utcDate.toUTCString();
  }
  /**
   * 
   * @param time HHMMSS
   * @returns seconds since midnight
   */
  static convertHHMMSSToTod(time) {
    const h = Number(time.substring(0, 2));
    const m = Number(time.substring(2, 4));
    const s = Number(time.substring(4, 6));
    const tod = h * 3600 + m * 60 + s;
    return tod;
  }
  /**
   * 
   * @param time HHMMSS
   * @param date MMDDYY
   * @returns seconds since epoch
   */
  static convertDateTimeToEpoch(time, date) {
    const timestamp = `20${date.substring(4, 6)}-${date.substring(0, 2)}-${date.substring(2, 4)}T${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}.000Z`;
    const millis = Date.parse(timestamp);
    return millis / 1e3;
  }
};

// lib/plugins/Label_1M_Slash.ts
var Label_1M_Slash = class extends DecoderPlugin {
  name = "label-1m-slash";
  qualifiers() {
    return {
      labels: ["1M"],
      preambles: ["/"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "ETA Report";
    decodeResult.message = message;
    const results = message.text.split(/\n|\//).slice(1);
    if (results) {
      if (options.debug) {
        console.log(`Label 1M ETA: results`);
        console.log(results);
      }
      decodeResult.raw.flight_number = results[0];
      decodeResult.raw.departure_icao = results[3];
      decodeResult.raw.arrival_icao = results[4];
      decodeResult.raw.alternate_icao = results[5];
      decodeResult.raw.arrival_runway = results[8].replace(decodeResult.raw.arrival_icao, "");
      decodeResult.formatted.items.push({
        type: "eta",
        code: "ETA",
        label: "Estimated Time of Arrival",
        value: DateTimeUtils.UTCDateTimeToString(results[2], results[7])
      });
      decodeResult.formatted.items.push({
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.arrival_icao
      });
      decodeResult.formatted.items.push({
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.departure_icao
      });
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "partial";
    return decodeResult;
  }
};

// lib/plugins/Label_20_POS.ts
var Label_20_POS = class extends DecoderPlugin {
  name = "label-20-pos";
  qualifiers() {
    return {
      labels: ["20"],
      preambles: ["POS"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Position Report";
    decodeResult.message = message;
    decodeResult.raw.preamble = message.text.substring(0, 3);
    const content = message.text.substring(3);
    console.log("Content: " + content);
    const fields = content.split(",");
    console.log("Field Count: " + fields.length);
    if (fields.length == 11) {
      console.log(`DEBUG: ${this.name}: Variation 1 detected`);
      const rawCoords = fields[0];
      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(rawCoords);
      if (decodeResult.raw.position) {
        decodeResult.formatted.items.push({
          type: "position",
          label: "Position",
          value: CoordinateUtils.coordinateString(decodeResult.raw.position)
        });
      }
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "full";
    } else if (fields.length == 5) {
      console.log(`DEBUG: ${this.name}: Variation 2 detected`);
      const rawCoords = fields[0];
      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(rawCoords);
      decodeResult.formatted.items.push({
        type: "position",
        label: "Position",
        value: CoordinateUtils.coordinateString(decodeResult.raw.position)
      });
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "full";
    } else {
      console.log(`DEBUG: ${this.name}: Unknown variation. Field count: ${fields.length}, content: ${content}`);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = "none";
    }
    return decodeResult;
  }
};

// lib/plugins/Label_30_Slash_EA.ts
var Label_30_Slash_EA = class extends DecoderPlugin {
  name = "label-30-slash-ea";
  qualifiers() {
    return {
      labels: ["30"],
      preambles: ["/EA"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "ETA Report";
    decodeResult.message = message;
    const results = message.text.split(/\n|\//).slice(1);
    if (results) {
      if (options.debug) {
        console.log(`Label 30 EA: results`);
        console.log(results);
      }
    }
    decodeResult.formatted.items.push({
      type: "eta",
      code: "ETA",
      label: "Estimated Time of Arrival",
      value: DateTimeUtils.UTCToString(results[0].substr(2, 4))
    });
    if (results[1].substr(0, 2) === "DS") {
      decodeResult.raw.arrival_icao = results[1].substr(2, 4);
      decodeResult.formatted.items.push({
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.arrival_icao
      });
      decodeResult.remaining.text = "/".concat(results[2]);
    } else {
      decodeResult.remaining.text = "/".concat(results[1], "/", results[2]);
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "partial";
    return decodeResult;
  }
};

// lib/plugins/Label_44_ETA.ts
var Label_44_ETA = class extends DecoderPlugin {
  name = "label-44-eta";
  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00ETA01", "00ETA02", "00ETA03", "ETA01", "ETA02", "ETA03"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "ETA Report";
    decodeResult.message = message;
    const regex = /^.*,(?<unsplit_coords>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 44 ETA Report: groups`);
        console.log(results.groups);
      }
      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(results.groups.unsplit_coords);
      decodeResult.raw.departure_icao = results.groups.departure_icao;
      decodeResult.raw.arrival_icao = results.groups.arrival_icao;
      decodeResult.raw.current_time = Date.parse(
        (/* @__PURE__ */ new Date()).getFullYear() + "-" + results.groups.current_date.substr(0, 2) + "-" + results.groups.current_date.substr(2, 2) + "T" + results.groups.current_time.substr(0, 2) + ":" + results.groups.current_time.substr(2, 2) + ":00Z"
      );
      if (results.groups.fuel_in_tons != "***" && results.groups.fuel_in_tons != "****") {
        decodeResult.raw.fuel_in_tons = Number(results.groups.fuel_in_tons);
      }
      if (decodeResult.raw.position) {
        decodeResult.formatted.items.push({
          type: "position",
          code: "POS",
          label: "Position",
          value: CoordinateUtils.coordinateString(decodeResult.raw.position)
        });
      }
      decodeResult.formatted.items.push({
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.departure_icao
      });
      decodeResult.formatted.items.push({
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.arrival_icao
      });
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "full";
    return decodeResult;
  }
};

// lib/plugins/Label_44_IN.ts
var Label_44_IN = class extends DecoderPlugin {
  name = "label-44-in";
  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00IN01", "00IN02", "00IN03", "IN01", "IN02", "IN03"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "In Air Report";
    decodeResult.message = message;
    const regex = /^.*,(?<unsplit_coords>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 44 In Air Report: groups`);
        console.log(results.groups);
      }
      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(results.groups.unsplit_coords);
      decodeResult.raw.departure_icao = results.groups.departure_icao;
      decodeResult.raw.arrival_icao = results.groups.arrival_icao;
      decodeResult.raw.current_time = Date.parse(
        (/* @__PURE__ */ new Date()).getFullYear() + "-" + results.groups.current_date.substr(0, 2) + "-" + results.groups.current_date.substr(2, 2) + "T" + results.groups.current_time.substr(0, 2) + ":" + results.groups.current_time.substr(2, 2) + ":00Z"
      );
      if (results.groups.fuel_in_tons != "***" && results.groups.fuel_in_tons != "****") {
        decodeResult.raw.fuel_in_tons = Number(results.groups.fuel_in_tons);
      }
      if (decodeResult.raw.position) {
        decodeResult.formatted.items.push({
          type: "position",
          code: "POS",
          label: "Position",
          value: CoordinateUtils.coordinateString(decodeResult.raw.position)
        });
      }
      decodeResult.formatted.items.push({
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.departure_icao
      });
      decodeResult.formatted.items.push({
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.arrival_icao
      });
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "full";
    return decodeResult;
  }
};

// lib/plugins/Label_44_OFF.ts
var Label_44_OFF = class extends DecoderPlugin {
  name = "label-44-off";
  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00OFF01", "00OFF02", "00OFF03", "OFF01", "OFF02", "OFF03"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Off Runway Report";
    decodeResult.message = message;
    const regex = /^.*,(?<unsplit_coords>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<eta_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 44 Off Runway Report: groups`);
        console.log(results.groups);
      }
      decodeResult.raw.departure_icao = results.groups.departure_icao;
      decodeResult.raw.arrival_icao = results.groups.arrival_icao;
      decodeResult.raw.current_time = Date.parse(
        (/* @__PURE__ */ new Date()).getFullYear() + "-" + results.groups.current_date.substr(0, 2) + "-" + results.groups.current_date.substr(2, 2) + "T" + results.groups.current_time.substr(0, 2) + ":" + results.groups.current_time.substr(2, 2) + ":00Z"
      );
      decodeResult.raw.eta_time = Date.parse(
        (/* @__PURE__ */ new Date()).getFullYear() + "-" + results.groups.current_date.substr(0, 2) + "-" + results.groups.current_date.substr(2, 2) + "T" + results.groups.eta_time.substr(0, 2) + ":" + results.groups.eta_time.substr(2, 2) + ":00Z"
      );
      if (results.groups.fuel_in_tons != "***" && results.groups.fuel_in_tons != "****") {
        decodeResult.raw.fuel_in_tons = Number(results.groups.fuel_in_tons);
      }
      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(results.groups.unsplit_coords);
      if (decodeResult.raw.position) {
        decodeResult.formatted.items.push({
          type: "position",
          code: "POS",
          label: "Position",
          value: CoordinateUtils.coordinateString(decodeResult.raw.position)
        });
      }
      decodeResult.formatted.items.push({
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.departure_icao
      });
      decodeResult.formatted.items.push({
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.arrival_icao
      });
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "full";
    return decodeResult;
  }
};

// lib/plugins/Label_44_ON.ts
var Label_44_ON = class extends DecoderPlugin {
  name = "label-44-on";
  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00ON01", "00ON02", "00ON03", "ON01", "ON02", "ON03"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "On Runway Report";
    decodeResult.message = message;
    const regex = /^.*,(?<unsplit_coords>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 44 On Runway Report: groups`);
        console.log(results.groups);
      }
      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(results.groups.unsplit_coords);
      decodeResult.raw.departure_icao = results.groups.departure_icao;
      decodeResult.raw.arrival_icao = results.groups.arrival_icao;
      decodeResult.raw.current_time = Date.parse(
        (/* @__PURE__ */ new Date()).getFullYear() + "-" + results.groups.current_date.substr(0, 2) + "-" + results.groups.current_date.substr(2, 2) + "T" + results.groups.current_time.substr(0, 2) + ":" + results.groups.current_time.substr(2, 2) + ":00Z"
      );
      if (results.groups.fuel_in_tons != "***" && results.groups.fuel_in_tons != "****") {
        decodeResult.raw.fuel_in_tons = Number(results.groups.fuel_in_tons);
      }
      if (decodeResult.raw.position) {
        decodeResult.formatted.items.push({
          type: "position",
          code: "POS",
          label: "Position",
          value: CoordinateUtils.coordinateString(decodeResult.raw.position)
        });
      }
      decodeResult.formatted.items.push({
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.departure_icao
      });
      decodeResult.formatted.items.push({
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.arrival_icao
      });
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "full";
    return decodeResult;
  }
};

// lib/plugins/Label_44_POS.ts
var Label_44_POS = class extends DecoderPlugin {
  name = "label-44-pos";
  qualifiers() {
    return {
      labels: ["44"],
      preambles: ["00POS01", "00POS02", "00POS03", "POS01", "POS02", "POS03"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Position Report";
    decodeResult.message = message;
    const regex = /^.*,(?<unsplit_coords>.*),(?<flight_level_or_ground>.*),(?<departure_icao>.*),(?<arrival_icao>.*),(?<current_date>.*),(?<current_time>.*),(?<eta_time>.*),(?<fuel_in_tons>.*)$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 44 Position Report: groups`);
        console.log(results.groups);
      }
      decodeResult.raw.position = CoordinateUtils.decodeStringCoordinates(results.groups.unsplit_coords);
      decodeResult.raw.flight_level = results.groups.flight_level_or_ground == "GRD" || results.groups.flight_level_or_ground == "***" ? "0" : Number(results.groups.flight_level_or_ground);
      decodeResult.raw.departure_icao = results.groups.departure_icao;
      decodeResult.raw.arrival_icao = results.groups.arrival_icao;
      decodeResult.raw.current_time = Date.parse(
        (/* @__PURE__ */ new Date()).getFullYear() + "-" + results.groups.current_date.substr(0, 2) + "-" + results.groups.current_date.substr(2, 2) + "T" + results.groups.current_time.substr(0, 2) + ":" + results.groups.current_time.substr(2, 2) + ":00Z"
      );
      decodeResult.raw.eta_time = Date.parse(
        (/* @__PURE__ */ new Date()).getFullYear() + "-" + results.groups.current_date.substr(0, 2) + "-" + results.groups.current_date.substr(2, 2) + "T" + results.groups.eta_time.substr(0, 2) + ":" + results.groups.eta_time.substr(2, 2) + ":00Z"
      );
      if (results.groups.fuel_in_tons != "***" && results.groups.fuel_in_tons != "****") {
        decodeResult.raw.fuel_in_tons = Number(results.groups.fuel_in_tons);
      }
      if (decodeResult.raw.position) {
        decodeResult.formatted.items.push({
          type: "position",
          code: "POS",
          label: "Position",
          value: CoordinateUtils.coordinateString(decodeResult.raw.position)
        });
      }
      decodeResult.formatted.items.push({
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.departure_icao
      });
      decodeResult.formatted.items.push({
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.arrival_icao
      });
      decodeResult.formatted.items.push({
        type: "flight_level",
        code: "FL",
        label: "Flight Level",
        value: decodeResult.raw.flight_level
      });
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "full";
    return decodeResult;
  }
};

// lib/plugins/Label_80.ts
var Label_80 = class extends DecoderPlugin {
  name = "label-80";
  descriptions = {
    ALT: "Altitude",
    DWND: "Wind Direction",
    ETA: "Estimated Time of Arrival",
    FOB: "Fuel on Board",
    FL: "Flight Level",
    HDG: "Heading",
    MCH: "Aircraft Speed",
    NWYP: "Next Waypoint",
    POS: "Aircraft Position",
    SAT: "Static Air Temperature",
    SWND: "Wind Speed",
    TAS: "True Airspeed",
    WYP: "Waypoint"
  };
  qualifiers() {
    return {
      labels: ["80"],
      preambles: ["3N01 POSRPT"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Airline Defined Position Report";
    const parts = message.text.split("\n");
    let posRptRegex = /^3N01 POSRPT \d\d\d\d\/\d\d (?<orig>\w+)\/(?<dest>\w+) \.(?<tail>[\w-]+)(\/(?<agate>.+) (?<sta>\w+:\w+))*/;
    let results = parts[0].match(posRptRegex);
    if (results && results.length > 0) {
      decodeResult.raw.origin = results.groups.orig;
      decodeResult.formatted.items.push({
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: `${results.groups.orig}`
      });
      decodeResult.raw.destination = results.groups.dest;
      decodeResult.formatted.items.push({
        type: "destination",
        code: "DST",
        label: "Destination",
        value: `${results.groups.dest}`
      });
      decodeResult.raw.tail = results.groups.tail;
      decodeResult.formatted.items.push({
        type: "tail",
        label: "Tail",
        value: `${results.groups.tail}`
      });
      if (results.groups.agate) {
        decodeResult.raw.arrival_gate = results.groups.agate;
        decodeResult.formatted.items.push({
          type: "arrival_gate",
          code: "ARG",
          label: "Arrival Gate",
          value: `${results.groups.agate}`
        });
        decodeResult.raw.scheduled_time_of_arrival = results.groups.sta;
        decodeResult.formatted.items.push({
          type: "scheduled_time_of_arrival",
          code: "STA",
          label: "Scheduled Time of Arrival",
          value: `${results.groups.sta}`
        });
      }
      posRptRegex = /\/(?<field>\w+)\s(?<value>[\w\+\-:\.]+)\s*/gi;
      const remainingParts = parts.slice(1);
      for (const part of remainingParts) {
        const matches = part.matchAll(posRptRegex);
        for (const match of matches) {
          switch (match.groups.field) {
            case "ALT": {
              decodeResult.raw.altitude = match.groups.value;
              decodeResult.formatted.items.push({
                type: "altitude",
                code: "ALT",
                label: this.descriptions[match.groups.field],
                value: `${decodeResult.raw.altitude} feet`
              });
              break;
            }
            case "DWND": {
              decodeResult.raw.wind_direction = Number(match.groups.value);
              decodeResult.formatted.items.push({
                type: "wind_direction",
                code: "DWND",
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.wind_direction
              });
              break;
            }
            case "FL": {
              decodeResult.raw.flight_level = match.groups.value;
              decodeResult.formatted.items.push({
                type: "flight_level",
                code: "FL",
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.flight_level
              });
              break;
            }
            case "FOB": {
              decodeResult.raw.fuel_on_board = match.groups.value;
              decodeResult.formatted.items.push({
                type: "fuel_on_board",
                code: "FOB",
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.fuel_on_board
              });
              break;
            }
            case "HDG": {
              decodeResult.raw.heading = Number(match.groups.value);
              decodeResult.formatted.items.push({
                type: "heading",
                code: "HDG",
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.heading
              });
              break;
            }
            case "MCH": {
              decodeResult.raw.mach = match.groups.value / 1e3;
              decodeResult.formatted.items.push({
                type: "mach",
                code: "MCH",
                label: this.descriptions[match.groups.field],
                value: `${decodeResult.raw.mach} Mach`
              });
              break;
            }
            case "NWYP": {
              decodeResult.raw.next_waypoint = match.groups.value;
              decodeResult.formatted.items.push({
                type: "next_waypoint",
                code: "NWYP",
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.next_waypoint
              });
              break;
            }
            case "POS": {
              const posRegex = /^(?<latd>[NS])(?<lat>.+)(?<lngd>[EW])(?<lng>.+)/;
              const posResult = match.groups.value.match(posRegex);
              const lat = Number(posResult.groups.lat) * (posResult.groups.lngd === "S" ? -1 : 1);
              const lon = Number(posResult.groups.lng) * (posResult.groups.lngd === "W" ? -1 : 1);
              const latitude = Number.isInteger(lat) ? lat / 1e3 : lat / 100;
              const longitude = Number.isInteger(lon) ? lon / 1e3 : lon / 100;
              decodeResult.raw.aircraft_position = {
                latitude,
                longitude
              };
              decodeResult.formatted.items.push({
                type: "position",
                code: "POS",
                label: "Position",
                value: `${Math.abs(latitude).toPrecision(5)} ${posResult.groups.latd}, ${Math.abs(longitude).toPrecision(5)} ${posResult.groups.lngd}`
              });
              break;
            }
            case "SWND": {
              decodeResult.raw.wind_speed = Number(match.groups.value);
              decodeResult.formatted.items.push({
                type: "wind_speed",
                code: "SWND",
                label: this.descriptions[match.groups.field],
                value: decodeResult.raw.wind_speed
              });
              break;
            }
            default: {
              if (match.groups.field != void 0) {
                const description = this.descriptions[match.groups.field] ? this.descriptions[match.groups.field] : "Unknown";
                decodeResult.formatted.items.push({
                  type: match.groups.field,
                  code: match.groups.field,
                  label: description || `Unknown (${match.groups.field})`,
                  value: `${match.groups.value}`
                });
              }
            }
          }
        }
      }
      decodeResult.decoded = true;
      decodeResult.decodeLevel = "partial";
    }
    return decodeResult;
  }
};

// lib/plugins/Label_8E.ts
var Label_8E = class extends DecoderPlugin {
  name = "label-8e";
  qualifiers() {
    return {
      labels: ["8E"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "ETA Report";
    decodeResult.message = message;
    const regex = /^(?<arrival_icao>\w{4}),(?<arrival_eta>\d{4})$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 8E ETA: groups`);
        console.log(results.groups);
      }
      decodeResult.formatted.items.push({
        type: "eta",
        code: "ETA",
        label: "Estimated Time of Arrival",
        value: DateTimeUtils.UTCToString(results.groups.arrival_eta)
      });
      decodeResult.raw.arrival_icao = results.groups.arrival_icao;
      decodeResult.formatted.items.push({
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.arrival_icao
      });
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "full";
    return decodeResult;
  }
};

// lib/plugins/Label_B6.ts
var Label_B6_Forwardslash = class extends DecoderPlugin {
  name = "label-b6-forwardslash";
  qualifiers() {
    return {
      labels: ["B6"],
      preambles: ["/"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "CPDLC Message";
    decodeResult.message = message;
    if (options.debug) {
      console.log("CPDLC: " + message);
    }
    return decodeResult;
  }
};

// lib/plugins/Label_ColonComma.ts
var Label_ColonComma = class extends DecoderPlugin {
  name = "label-colon-comma";
  qualifiers() {
    return {
      labels: [":;"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.raw.frequency = Number(message.text) / 1e3;
    decodeResult.formatted.description = "Aircraft Transceiver Frequency Change";
    decodeResult.formatted.items.push({
      type: "frequency",
      label: "Frequency",
      value: `${decodeResult.raw.frequency} MHz`
    });
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "full";
    return decodeResult;
  }
};

// lib/utils/route_utils.ts
var RouteUtils = class _RouteUtils {
  static routeToString(route) {
    let str = "";
    if (route.name) {
      str += route.name;
    }
    if (route.runway) {
      str += `(${route.runway})`;
    }
    if (str.length !== 0 && route.waypoints && route.waypoints.length === 1) {
      str += " starting at ";
    } else if (str.length !== 0 && route.waypoints) {
      str += ": ";
    }
    if (route.waypoints) {
      str += _RouteUtils.waypointsToString(route.waypoints);
    }
    return str;
  }
  static waypointToString(waypoint) {
    let s = waypoint.name;
    if (waypoint.latitude && waypoint.longitude) {
      s += `(${CoordinateUtils.latLonToCoordinateString(waypoint.latitude, waypoint.longitude)})`;
    }
    if (waypoint.time && waypoint.timeFormat) {
      s += `@${_RouteUtils.timestampToString(waypoint.time, waypoint.timeFormat)}`;
    }
    return s;
  }
  static getWaypoint(leg) {
    const waypoint = leg.split(",");
    if (waypoint.length == 2) {
      const position = CoordinateUtils.decodeStringCoordinates(waypoint[1]);
      return { name: waypoint[0], latitude: position.latitude, longitude: position.longitude };
    }
    if (leg.length == 14) {
      const position = CoordinateUtils.decodeStringCoordinates(leg);
      return { name: waypoint[0], latitude: position.latitude, longitude: position.longitude };
    }
    return { name: leg };
  }
  // move out if we want public
  static timestampToString(time, format) {
    const date = new Date(time * 1e3);
    if (format == "tod") {
      return date.toISOString().slice(11, 19);
    }
    return date.toISOString().slice(0, -5) + "Z";
  }
  static waypointsToString(waypoints) {
    let str = waypoints.map((x) => _RouteUtils.waypointToString(x)).join(" > ").replaceAll(">  >", ">>");
    if (str.startsWith(" > ")) {
      str = ">>" + str.slice(2);
    }
    return str;
  }
};

// lib/utils/flight_plan_utils.ts
var FlightPlanUtils = class {
  /**
   * Processes flight plan data
   * 
   * Expected format is [header, key1, val1, ... keyN, valN]
   * 
   * @param decodeResult - results
   * @param data - original message split by ':'
   * @returns whether all fields were processed or not
   */
  static processFlightPlan(decodeResult, data) {
    let allKnownFields = parseHeader(decodeResult, data[0]);
    for (let i = 1; i < data.length; i += 2) {
      const key = data[i];
      const value = data[i + 1];
      switch (key) {
        case "A":
          addProcedure(decodeResult, value, "arrival");
          break;
        case "AA":
          addArrivalAirport(decodeResult, value);
          break;
        case "AP":
          addProcedure(decodeResult, value, "approach");
          break;
        case "CR":
          addCompanyRoute(decodeResult, value);
          break;
        case "D":
          addProcedure(decodeResult, value, "departure");
          break;
        case "DA":
          addDepartureAirport(decodeResult, value);
          break;
        case "F":
          addRoute(decodeResult, value);
          break;
        case "R":
          addDepartureRunway(decodeResult, value);
          break;
        default:
          if (allKnownFields) {
            decodeResult.remaining.text = "";
            allKnownFields = false;
          }
          decodeResult.remaining.text += `:${key}:${value}`;
          decodeResult.decoder.decodeLevel = "partial";
      }
    }
    return allKnownFields;
  }
};
function parseHeader(decodeResult, header) {
  let allKnownFields = true;
  const fields = header.split("/");
  for (let i = 1; i < fields.length - 1; ++i) {
    if (fields[i].startsWith("FN")) {
      decodeResult.raw.flight_number = fields[i].substring(2);
    } else if (fields[i].startsWith("SN")) {
      decodeResult.raw.serial_number = fields[i].substring(2);
    } else if (fields[i].startsWith("TS")) {
      const ts = fields[i].substring(2).split(",");
      decodeResult.raw.message_timestamp = DateTimeUtils.convertDateTimeToEpoch(ts[0], ts[1]);
    } else {
      decodeResult.remaining.text += "/" + fields[i];
      allKnownFields = false;
    }
  }
  decodeResult.raw.route_status = fields[fields.length - 1];
  var text;
  if (decodeResult.raw.route_status == "RP") {
    text = "Route Planned";
  } else if (decodeResult.raw.route_status == "RI") {
    text = "Route Inactive";
  } else if (decodeResult.raw.route_status == "RF") {
    text = "Route Filed";
  } else {
    text = decodeResult.raw.route_status;
  }
  decodeResult.formatted.items.push({
    type: "status",
    code: "ROUTE_STATUS",
    label: "Route Status",
    value: text
  });
  return allKnownFields;
}
function addArrivalAirport(decodeResult, value) {
  decodeResult.raw.arrival_icao = value;
  decodeResult.formatted.items.push({
    type: "destination",
    code: "DST",
    label: "Destination",
    value: decodeResult.raw.arrival_icao
  });
}
function addDepartureAirport(decodeResult, value) {
  decodeResult.raw.departure_icao = value;
  decodeResult.formatted.items.push({
    type: "origin",
    code: "ORG",
    label: "Origin",
    value: decodeResult.raw.departure_icao
  });
}
function addDepartureRunway(decodeResult, value) {
  decodeResult.raw.runway = value;
  decodeResult.formatted.items.push({
    type: "runway",
    label: "Runway",
    value: decodeResult.raw.runway
  });
}
function addRoute(decodeResult, value) {
  const route = value.split(".");
  decodeResult.raw.route = { waypoints: route.map((leg) => RouteUtils.getWaypoint(leg)) };
  decodeResult.formatted.items.push({
    type: "aircraft_route",
    code: "ROUTE",
    label: "Aircraft Route",
    value: RouteUtils.routeToString(decodeResult.raw.route)
  });
}
function addProcedure(decodeResult, value, type) {
  if (decodeResult.raw.procedures === void 0) {
    decodeResult.raw.procedures = [];
  }
  const data = value.split(".");
  let waypoints;
  if (data.length > 1) {
    waypoints = data.slice(1).map((leg) => RouteUtils.getWaypoint(leg));
  }
  const route = { name: data[0], waypoints };
  decodeResult.raw.procedures.push({ type, route });
  const procedureName = type.substring(0, 1).toUpperCase() + type.slice(1);
  let procedureValue = route.name;
  decodeResult.formatted.items.push({
    type: `procedure`,
    code: "proc",
    label: `${procedureName} Procedure`,
    value: RouteUtils.routeToString(route)
  });
}
function addCompanyRoute(decodeResult, value) {
  const segments = value.split(".");
  const parens_idx = segments[0].indexOf("(");
  let name;
  let runway;
  if (parens_idx === -1) {
    name = segments[0];
  } else {
    name = segments[0].slice(0, parens_idx);
    runway = segments[0].slice(parens_idx + 1, segments[0].indexOf(")"));
  }
  let waypoints;
  if (segments.length > 1) {
    waypoints = segments.slice(1).map((leg) => RouteUtils.getWaypoint(leg));
  }
  decodeResult.raw.company_route = {
    name,
    runway,
    waypoints
  };
  decodeResult.formatted.items.push({
    type: "company_route",
    code: "CR",
    label: "Company Route",
    value: RouteUtils.routeToString(decodeResult.raw.company_route)
  });
}

// lib/plugins/Label_H1_FPN.ts
var Label_H1_FPN = class extends DecoderPlugin {
  name = "label-h1-fpn";
  qualifiers() {
    return {
      labels: ["H1"],
      preambles: ["FPN", "#M1BFPN"]
    };
  }
  decode(message, options = {}) {
    let decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Flight Plan";
    decodeResult.message = message;
    const msg = message.text.replace(/\n|\r/g, "");
    const checksum = msg.slice(-4);
    const data = msg.slice(0, msg.length - 4).split(":");
    if (data.length > 1) {
      const fulllyDecoded = FlightPlanUtils.processFlightPlan(decodeResult, data);
      addChecksum(decodeResult, checksum);
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = fulllyDecoded ? "full" : "partial";
    } else {
      if (options?.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = "none";
    }
    return decodeResult;
  }
};
function addChecksum(decodeResult, value) {
  decodeResult.raw.checksum = Number("0x" + value);
  decodeResult.formatted.items.push({
    type: "message_checksum",
    code: "CHECKSUM",
    label: "Message Checksum",
    value: "0x" + ("0000" + decodeResult.raw.checksum.toString(16)).slice(-4)
  });
}

// lib/plugins/Label_H1_POS.ts
var Label_H1_POS = class extends DecoderPlugin {
  name = "label-h1-pos";
  qualifiers() {
    return {
      labels: ["H1"],
      preambles: ["POS", "#M1BPOS"]
      //TODO - support data before #
    };
  }
  decode(message, options = {}) {
    let decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = "Position Report";
    decodeResult.message = message;
    const checksum = message.text.slice(-4);
    const parts = message.text.replace("#M1B", "").replace("POS", "").slice(0, -4).split(",");
    console.log(parts);
    if (parts.length == 1 && parts[0].startsWith("/RF")) {
      decodeResult.raw.route_status == "RF";
      decodeResult.formatted.items.push({
        type: "status",
        code: "ROUTE_STATUS",
        label: "Route Status",
        value: "Route Filed"
      });
      decodeResult.raw.route = { waypoints: parts[0].substring(3, parts[0].length).split(".").map((leg) => RouteUtils.getWaypoint(leg)) };
      decodeResult.formatted.items.push({
        type: "aircraft_route",
        code: "ROUTE",
        label: "Aircraft Route",
        value: RouteUtils.routeToString(decodeResult.raw.route)
      });
      processChecksum(decodeResult, checksum);
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "full";
    } else if (parts.length === 10) {
      decodeResult.remaining.text = "";
      processPosition(decodeResult, parts[0]);
      processAlt(decodeResult, parts[3]);
      processRoute(decodeResult, parts[1], parts[2], parts[4], parts[5], parts[6]);
      processTemp(decodeResult, parts[7]);
      processUnknown(decodeResult, parts[8]);
      processUnknown(decodeResult, parts[9]);
      processChecksum(decodeResult, checksum);
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "partial";
    } else if (parts.length === 11) {
      decodeResult.remaining.text = "";
      processPosition(decodeResult, parts[0]);
      processAlt(decodeResult, parts[3]);
      processRoute(decodeResult, parts[1], parts[2], parts[4], parts[5], parts[6], parts[10]);
      processTemp(decodeResult, parts[7]);
      processUnknown(decodeResult, parts[8]);
      processUnknown(decodeResult, parts[9]);
      processChecksum(decodeResult, checksum);
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "partial";
    } else if (parts.length === 14) {
      decodeResult.remaining.text = "";
      processPosition(decodeResult, parts[0]);
      processAlt(decodeResult, parts[3]);
      processRoute(decodeResult, parts[1], parts[2], parts[4], parts[5], parts[6]);
      processTemp(decodeResult, parts[7]);
      processUnknown(decodeResult, parts[8]);
      processUnknown(decodeResult, parts[9]);
      processGndspd(decodeResult, parts[10]);
      processUnknown(decodeResult, parts[11]);
      processUnknown(decodeResult, parts[12]);
      processUnknown(decodeResult, parts[13]);
      processChecksum(decodeResult, checksum);
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "partial";
    } else if (parts.length === 32) {
      decodeResult.remaining.text = "";
      processPosition(decodeResult, parts[0]);
      processRunway(decodeResult, parts[1]);
      const time = parts[2];
      processUnknown(decodeResult, parts[3]);
      const past = parts[4];
      processUnknown(decodeResult, parts[5]);
      const eta = parts[6];
      const next = parts[7];
      processUnknown(decodeResult, parts.slice(8, 14).join(","));
      processUnknown(decodeResult, parts[16]);
      processUnknown(decodeResult, parts[17]);
      processUnknown(decodeResult, parts[18]);
      processGndspd(decodeResult, parts[19]);
      processUnknown(decodeResult, parts[20]);
      processUnknown(decodeResult, parts[21]);
      processAlt(decodeResult, parts[22]);
      processUnknown(decodeResult, parts.slice(23, 31).join(","));
      const allProcessed = FlightPlanUtils.processFlightPlan(decodeResult, (parts[31] + checksum).split(":"));
      processRoute(decodeResult, past, time, next, eta, "?");
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = "partial";
    } else {
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = "none";
    }
    return decodeResult;
  }
};
function processUnknown(decodeResult, value) {
  decodeResult.remaining.text += "," + value;
}
function processPosition(decodeResult, value) {
  const position = CoordinateUtils.decodeStringCoordinates(value);
  decodeResult.raw.latitude_direction = position.latitudeDirection;
  decodeResult.raw.latitude = Math.abs(position.latitude);
  decodeResult.raw.longitude_direction = position.longitudeDirection;
  decodeResult.raw.longitude = Math.abs(position.longitude);
  decodeResult.formatted.items.push({
    type: "aircraft_position",
    code: "POS",
    label: "Aircraft Position",
    value: CoordinateUtils.coordinateString(position)
  });
}
function processAlt(decodeResult, value) {
  decodeResult.raw.altitude = Number(value) * 100;
  decodeResult.formatted.items.push({
    type: "altitude",
    code: "ALT",
    label: "Altitude",
    value: `${decodeResult.raw.altitude} feet`
  });
}
function processTemp(decodeResult, value) {
  decodeResult.raw.outside_air_temperature = Number(value.substring(1)) * (value.charAt(0) === "M" ? -1 : 1);
  decodeResult.formatted.items.push({
    type: "outside_air_temperature",
    code: "OATEMP",
    label: "Outside Air Temperature (C)",
    value: `${decodeResult.raw.outside_air_temperature}`
  });
}
function processRunway(decodeResult, value) {
  decodeResult.raw.runway = value.replace("RW", "");
  decodeResult.formatted.items.push({
    type: "runway",
    label: "Runway",
    value: decodeResult.raw.runway
  });
}
function processGndspd(decodeResult, value) {
  decodeResult.raw.groundspeed = Number(value);
  decodeResult.formatted.items.push({
    type: "aircraft_groundspeed",
    code: "GSPD",
    label: "Aircraft Groundspeed",
    value: `${decodeResult.raw.groundspeed}`
  });
}
function processRoute(decodeResult, last, time, next, eta, then, date) {
  let waypoints;
  waypoints = date === void 0 ? [
    { name: last || "?,", time: DateTimeUtils.convertHHMMSSToTod(time), timeFormat: "tod" },
    { name: next || "?", time: DateTimeUtils.convertHHMMSSToTod(eta), timeFormat: "tod" },
    { name: then || "?" }
  ] : [
    { name: last || "?,", time: DateTimeUtils.convertDateTimeToEpoch(time, date), timeFormat: "epoch" },
    { name: next || "?", time: DateTimeUtils.convertDateTimeToEpoch(eta, date), timeFormat: "epoch" },
    { name: then || "?" }
  ];
  decodeResult.raw.route = { waypoints };
  decodeResult.formatted.items.push({
    type: "aircraft_route",
    code: "ROUTE",
    label: "Aircraft Route",
    value: RouteUtils.routeToString(decodeResult.raw.route)
  });
}
function processChecksum(decodeResult, value) {
  decodeResult.raw.checksum = Number("0x" + value);
  decodeResult.formatted.items.push({
    type: "message_checksum",
    code: "CHECKSUM",
    label: "Message Checksum",
    value: "0x" + ("0000" + decodeResult.raw.checksum.toString(16)).slice(-4)
  });
}

// lib/plugins/Label_SQ.ts
var Label_SQ = class extends DecoderPlugin {
  name = "label-sq";
  qualifiers() {
    return {
      labels: ["SQ"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.raw.preamble = message.text.substring(0, 4);
    decodeResult.raw.version = message.text.substring(1, 2);
    decodeResult.raw.network = message.text.substring(3, 4);
    if (decodeResult.raw.version === "2") {
      const regex = /0(\d)X(?<org>\w)(?<iata>\w\w\w)(?<icao>\w\w\w\w)(?<station>\d)(?<lat>\d+)(?<latd>[NS])(?<lng>\d+)(?<lngd>[EW])V(?<vfreq>\d+)\/.*/;
      const result = message.text.match(regex);
      if (result && result.length >= 8) {
        decodeResult.raw.groundStation = {
          number: result.groups.station,
          iataCode: result.groups.iata,
          icaoCode: result.groups.icao,
          coordinates: {
            latitude: Number(result.groups.lat) / 100 * (result.groups.latd === "S" ? -1 : 1),
            longitude: Number(result.groups.lng) / 100 * (result.groups.lngd === "W" ? -1 : 1)
          }
        };
        decodeResult.raw.vdlFrequency = result.groups.vfreq / 1e3;
      }
    }
    decodeResult.formatted.description = "Ground Station Squitter";
    var formattedNetwork = "Unknown";
    if (decodeResult.raw.network == "A") {
      formattedNetwork = "ARINC";
    } else if (decodeResult.raw.network == "S") {
      formattedNetwork = "SITA";
    }
    decodeResult.formatted.items = [
      {
        type: "network",
        label: "Network",
        value: formattedNetwork
      },
      {
        type: "version",
        label: "Version",
        value: decodeResult.raw.version
      }
    ];
    if (decodeResult.raw.groundStation) {
      if (decodeResult.raw.groundStation.icaoCode && decodeResult.raw.groundStation.number) {
        decodeResult.formatted.items.push({
          type: "ground_station",
          label: "Ground Station",
          value: `${decodeResult.raw.groundStation.icaoCode}${decodeResult.raw.groundStation.number}`
        });
      }
      if (decodeResult.raw.groundStation.iataCode) {
        decodeResult.formatted.items.push({
          type: "iataCode",
          label: "IATA",
          value: decodeResult.raw.groundStation.iataCode
        });
      }
      if (decodeResult.raw.groundStation.icaoCode) {
        decodeResult.formatted.items.push({
          type: "icaoCode",
          label: "ICAO",
          value: decodeResult.raw.groundStation.icaoCode
        });
      }
      if (decodeResult.raw.groundStation.coordinates.latitude) {
        decodeResult.formatted.items.push({
          type: "coordinates",
          label: "Ground Station Location",
          value: `${decodeResult.raw.groundStation.coordinates.latitude}, ${decodeResult.raw.groundStation.coordinates.longitude}`
        });
      }
      if (decodeResult.raw.groundStation.airport) {
        decodeResult.formatted.items.push({
          type: "airport",
          label: "Airport",
          value: `${decodeResult.raw.groundStation.airport.name} (${decodeResult.raw.groundStation.airport.icao}) in ${decodeResult.raw.groundStation.airport.location}`
        });
      }
    }
    if (decodeResult.raw.vdlFrequency) {
      decodeResult.formatted.items.push({
        type: "vdlFrequency",
        label: "VDL Frequency",
        value: `${decodeResult.raw.vdlFrequency} MHz`
      });
    }
    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = "full";
    return decodeResult;
  }
};

// lib/plugins/Label_QR.ts
var Label_QR = class extends DecoderPlugin {
  name = "label-qr";
  qualifiers() {
    return {
      labels: ["QR"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.raw.origin = message.text.substring(0, 4);
    decodeResult.raw.destination = message.text.substring(4, 8);
    decodeResult.raw.wheels_on = message.text.substring(8, 12);
    decodeResult.remaining.text = message.text.substring(12);
    decodeResult.formatted.description = "ON Report";
    decodeResult.formatted.items = [
      {
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.origin
      },
      {
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.destination
      },
      {
        type: "wheels_on",
        code: "WON",
        label: "Wheels ON",
        value: decodeResult.raw.wheels_on
      }
    ];
    decodeResult.decoded = true;
    if (decodeResult.remaining.text === "")
      decodeResult.decoder.decodeLevel = "full";
    else
      decodeResult.decoder.decodeLevel = "partial";
    return decodeResult;
  }
};

// lib/plugins/Label_QP.ts
var Label_QP = class extends DecoderPlugin {
  name = "label-qp";
  qualifiers() {
    return {
      labels: ["QP"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.raw.origin = message.text.substring(0, 4);
    decodeResult.raw.destination = message.text.substring(4, 8);
    decodeResult.raw.gate_out = message.text.substring(8, 12);
    decodeResult.remaining.text = message.text.substring(12);
    decodeResult.formatted.description = "OUT Report";
    decodeResult.formatted.items = [
      {
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.origin
      },
      {
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.destination
      },
      {
        type: "gate_out",
        code: "GOUT",
        label: "Gate OUT",
        value: decodeResult.raw.gate_out
      }
    ];
    decodeResult.decoded = true;
    if (decodeResult.remaining.text === "")
      decodeResult.decoder.decodeLevel = "full";
    else
      decodeResult.decoder.decodeLevel = "partial";
    return decodeResult;
  }
};

// lib/plugins/Label_QS.ts
var Label_QS = class extends DecoderPlugin {
  name = "label-qs";
  qualifiers() {
    return {
      labels: ["QS"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.raw.origin = message.text.substring(0, 4);
    decodeResult.raw.destination = message.text.substring(4, 8);
    decodeResult.raw.gate_in = message.text.substring(8, 12);
    decodeResult.remaining.text = message.text.substring(12);
    decodeResult.formatted.description = "IN Report";
    decodeResult.formatted.items = [
      {
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.origin
      },
      {
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.destination
      },
      {
        type: "gate_in",
        code: "GIN",
        label: "Gate IN",
        value: decodeResult.raw.gate_in
      }
    ];
    decodeResult.decoded = true;
    if (decodeResult.remaining.text === "")
      decodeResult.decoder.decodeLevel = "full";
    else
      decodeResult.decoder.decodeLevel = "partial";
    return decodeResult;
  }
};

// lib/plugins/Label_QQ.ts
var Label_QQ = class extends DecoderPlugin {
  name = "label-qq";
  qualifiers() {
    return {
      labels: ["QQ"]
    };
  }
  decode(message, options = {}) {
    const decodeResult = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.raw.origin = message.text.substring(0, 4);
    decodeResult.raw.destination = message.text.substring(4, 8);
    decodeResult.raw.wheels_off = message.text.substring(8, 12);
    decodeResult.remaining.text = message.text.substring(12);
    decodeResult.formatted.description = "OFF Report";
    decodeResult.formatted.items = [
      {
        type: "origin",
        code: "ORG",
        label: "Origin",
        value: decodeResult.raw.origin
      },
      {
        type: "destination",
        code: "DST",
        label: "Destination",
        value: decodeResult.raw.destination
      },
      {
        type: "wheels_off",
        code: "WOFF",
        label: "Wheels OFF",
        value: decodeResult.raw.wheels_off
      }
    ];
    decodeResult.decoded = true;
    if (decodeResult.remaining.text === "")
      decodeResult.decoder.decodeLevel = "full";
    else
      decodeResult.decoder.decodeLevel = "partial";
    return decodeResult;
  }
};

// lib/utils/miam.ts
import * as Base85 from "base85";
import * as Zlib from "zlib";
var MIAMCoreV1CRCLength = 4;
var MIAMCoreV2CRCLength = 2;
var MIAMCoreUtils = class {
  static AppTypeToAppIdLenTable = {
    1: {
      [0 /* ACARS2Char */]: 2,
      [1 /* ACARS4Char */]: 4,
      [2 /* ACARS6Char */]: 6,
      [3 /* NonACARS6Char */]: 6
    },
    2: {
      [0 /* ACARS2Char */]: 2,
      [1 /* ACARS4Char */]: 4,
      [2 /* ACARS6Char */]: 6,
      [3 /* NonACARS6Char */]: 6
    }
  };
  static FidHandlerTable = {
    ["T" /* SingleTransfer */]: (txt) => {
      if (txt.length < 3) {
        return {
          decoded: false,
          error: "Raw MIAM message too short (" + txt.length + " < 3) "
        };
      }
      let bpad = txt[0];
      if ("0123-.".indexOf(bpad) === -1) {
        return {
          decoded: false,
          error: "Invalid body padding value: '" + bpad + "'"
        };
      }
      if ("0123".indexOf(txt[1]) === -1) {
        return {
          decoded: false,
          error: "Invalid header padding value: '" + txt[1] + "'"
        };
      }
      const hpad = parseInt(txt[1]);
      const delimIdx = txt.indexOf("|");
      if (delimIdx === -1) {
        return {
          decoded: false,
          error: "Raw MIAM message missing header-body delimiter"
        };
      }
      const rawHdr = txt.substring(2, delimIdx);
      if (rawHdr.length === 0) {
        return {
          decoded: false,
          error: "Empty MIAM message header"
        };
      }
      let hdr = Base85.decode("<~" + rawHdr + "~>", "ascii85");
      if (!hdr || hdr.length < hpad) {
        return {
          decoded: false,
          error: "Ascii85 decode failed for MIAM message header"
        };
      }
      let body = void 0;
      const rawBody = txt.substring(delimIdx + 1);
      if (rawBody.length > 0) {
        if ("0123".indexOf(bpad) >= 0) {
          const bpadValue = parseInt(bpad);
          body = Base85.decode("<~" + rawBody + "~>", "ascii85") || void 0;
          if (body && body.length >= bpadValue) {
            body = body.subarray(0, body.length - bpadValue);
          }
        } else if (bpad === "-") {
          body = Buffer.from(rawBody);
        }
      }
      hdr = hdr.subarray(0, hdr.length - hpad);
      const version = hdr.readUInt8(0) & 15;
      const pduType = hdr.readUInt8(0) >> 4 & 15;
      const versionPduHandler = this.VersionPduHandlerTable[version][pduType];
      if (versionPduHandler === void 0) {
        return {
          decoded: false,
          error: "Invalid version and PDU type combination: v=" + version + ", pdu=" + pduType
        };
      }
      return versionPduHandler(hdr, body);
    },
    ["F" /* FileTransferRequest */]: void 0,
    ["K" /* FileTransferAccept */]: void 0,
    ["S" /* FileSegment */]: void 0,
    ["A" /* FileTransferAbort */]: void 0,
    ["Y" /* XOFFIndication */]: void 0,
    ["X" /* XONIndication */]: void 0
  };
  static arincCrc16(buf, seed) {
    const crctable = [
      0,
      4129,
      8258,
      12387,
      16516,
      20645,
      24774,
      28903,
      33032,
      37161,
      41290,
      45419,
      49548,
      53677,
      57806,
      61935,
      4657,
      528,
      12915,
      8786,
      21173,
      17044,
      29431,
      25302,
      37689,
      33560,
      45947,
      41818,
      54205,
      50076,
      62463,
      58334,
      9314,
      13379,
      1056,
      5121,
      25830,
      29895,
      17572,
      21637,
      42346,
      46411,
      34088,
      38153,
      58862,
      62927,
      50604,
      54669,
      13907,
      9842,
      5649,
      1584,
      30423,
      26358,
      22165,
      18100,
      46939,
      42874,
      38681,
      34616,
      63455,
      59390,
      55197,
      51132,
      18628,
      22757,
      26758,
      30887,
      2112,
      6241,
      10242,
      14371,
      51660,
      55789,
      59790,
      63919,
      35144,
      39273,
      43274,
      47403,
      23285,
      19156,
      31415,
      27286,
      6769,
      2640,
      14899,
      10770,
      56317,
      52188,
      64447,
      60318,
      39801,
      35672,
      47931,
      43802,
      27814,
      31879,
      19684,
      23749,
      11298,
      15363,
      3168,
      7233,
      60846,
      64911,
      52716,
      56781,
      44330,
      48395,
      36200,
      40265,
      32407,
      28342,
      24277,
      20212,
      15891,
      11826,
      7761,
      3696,
      65439,
      61374,
      57309,
      53244,
      48923,
      44858,
      40793,
      36728,
      37256,
      33193,
      45514,
      41451,
      53516,
      49453,
      61774,
      57711,
      4224,
      161,
      12482,
      8419,
      20484,
      16421,
      28742,
      24679,
      33721,
      37784,
      41979,
      46042,
      49981,
      54044,
      58239,
      62302,
      689,
      4752,
      8947,
      13010,
      16949,
      21012,
      25207,
      29270,
      46570,
      42443,
      38312,
      34185,
      62830,
      58703,
      54572,
      50445,
      13538,
      9411,
      5280,
      1153,
      29798,
      25671,
      21540,
      17413,
      42971,
      47098,
      34713,
      38840,
      59231,
      63358,
      50973,
      55100,
      9939,
      14066,
      1681,
      5808,
      26199,
      30326,
      17941,
      22068,
      55628,
      51565,
      63758,
      59695,
      39368,
      35305,
      47498,
      43435,
      22596,
      18533,
      30726,
      26663,
      6336,
      2273,
      14466,
      10403,
      52093,
      56156,
      60223,
      64286,
      35833,
      39896,
      43963,
      48026,
      19061,
      23124,
      27191,
      31254,
      2801,
      6864,
      10931,
      14994,
      64814,
      60687,
      56684,
      52557,
      48554,
      44427,
      40424,
      36297,
      31782,
      27655,
      23652,
      19525,
      15522,
      11395,
      7392,
      3265,
      61215,
      65342,
      53085,
      57212,
      44955,
      49082,
      36825,
      40952,
      28183,
      32310,
      20053,
      24180,
      11923,
      16050,
      3793,
      7920
    ];
    let crc = (seed || 0) & 65535;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc << 8 >>> 0 ^ crctable[(crc >>> 8 ^ buf.readUInt8(i)) >>> 0 & 255]) >>> 0;
    }
    return crc & 65535;
  }
  static arinc665Crc32(buf, seed) {
    const crctable = [
      0,
      79764919,
      159529838,
      222504665,
      319059676,
      398814059,
      445009330,
      507990021,
      638119352,
      583659535,
      797628118,
      726387553,
      890018660,
      835552979,
      1015980042,
      944750013,
      1276238704,
      1221641927,
      1167319070,
      1095957929,
      1595256236,
      1540665371,
      1452775106,
      1381403509,
      1780037320,
      1859660671,
      1671105958,
      1733955601,
      2031960084,
      2111593891,
      1889500026,
      1952343757,
      2552477408,
      2632100695,
      2443283854,
      2506133561,
      2334638140,
      2414271883,
      2191915858,
      2254759653,
      3190512472,
      3135915759,
      3081330742,
      3009969537,
      2905550212,
      2850959411,
      2762807018,
      2691435357,
      3560074640,
      3505614887,
      3719321342,
      3648080713,
      3342211916,
      3287746299,
      3467911202,
      3396681109,
      4063920168,
      4143685023,
      4223187782,
      4286162673,
      3779000052,
      3858754371,
      3904687514,
      3967668269,
      881225847,
      809987520,
      1023691545,
      969234094,
      662832811,
      591600412,
      771767749,
      717299826,
      311336399,
      374308984,
      453813921,
      533576470,
      25881363,
      88864420,
      134795389,
      214552010,
      2023205639,
      2086057648,
      1897238633,
      1976864222,
      1804852699,
      1867694188,
      1645340341,
      1724971778,
      1587496639,
      1516133128,
      1461550545,
      1406951526,
      1302016099,
      1230646740,
      1142491917,
      1087903418,
      2896545431,
      2825181984,
      2770861561,
      2716262478,
      3215044683,
      3143675388,
      3055782693,
      3001194130,
      2326604591,
      2389456536,
      2200899649,
      2280525302,
      2578013683,
      2640855108,
      2418763421,
      2498394922,
      3769900519,
      3832873040,
      3912640137,
      3992402750,
      4088425275,
      4151408268,
      4197601365,
      4277358050,
      3334271071,
      3263032808,
      3476998961,
      3422541446,
      3585640067,
      3514407732,
      3694837229,
      3640369242,
      1762451694,
      1842216281,
      1619975040,
      1682949687,
      2047383090,
      2127137669,
      1938468188,
      2001449195,
      1325665622,
      1271206113,
      1183200824,
      1111960463,
      1543535498,
      1489069629,
      1434599652,
      1363369299,
      622672798,
      568075817,
      748617968,
      677256519,
      907627842,
      853037301,
      1067152940,
      995781531,
      51762726,
      131386257,
      177728840,
      240578815,
      269590778,
      349224269,
      429104020,
      491947555,
      4046411278,
      4126034873,
      4172115296,
      4234965207,
      3794477266,
      3874110821,
      3953728444,
      4016571915,
      3609705398,
      3555108353,
      3735388376,
      3664026991,
      3290680682,
      3236090077,
      3449943556,
      3378572211,
      3174993278,
      3120533705,
      3032266256,
      2961025959,
      2923101090,
      2868635157,
      2813903052,
      2742672763,
      2604032198,
      2683796849,
      2461293480,
      2524268063,
      2284983834,
      2364738477,
      2175806836,
      2238787779,
      1569362073,
      1498123566,
      1409854455,
      1355396672,
      1317987909,
      1246755826,
      1192025387,
      1137557660,
      2072149281,
      2135122070,
      1912620623,
      1992383480,
      1753615357,
      1816598090,
      1627664531,
      1707420964,
      295390185,
      358241886,
      404320391,
      483945776,
      43990325,
      106832002,
      186451547,
      266083308,
      932423249,
      861060070,
      1041341759,
      986742920,
      613929101,
      542559546,
      756411363,
      701822548,
      3316196985,
      3244833742,
      3425377559,
      3370778784,
      3601682597,
      3530312978,
      3744426955,
      3689838204,
      3819031489,
      3881883254,
      3928223919,
      4007849240,
      4037393693,
      4100235434,
      4180117107,
      4259748804,
      2310601993,
      2373574846,
      2151335527,
      2231098320,
      2596047829,
      2659030626,
      2470359227,
      2550115596,
      2947551409,
      2876312838,
      2788305887,
      2733848168,
      3165939309,
      3094707162,
      3040238851,
      2985771188
    ];
    let crc = seed || 0;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc << 8 >>> 0 ^ crctable[(crc >>> 24 ^ buf.readUInt8(i)) >>> 0]) >>> 0;
    }
    return crc;
  }
  static parse(txt) {
    const fidType = txt[0];
    const handler = this.FidHandlerTable[fidType];
    if (handler === void 0) {
      return {
        decoded: false,
        error: "Unsupported FID type: " + fidType
      };
    }
    return handler(txt.substring(1));
  }
  static corePduDataHandler(version, minHdrSize, crcLen, hdr, body) {
    if (hdr.length < minHdrSize) {
      return {
        decoded: false,
        error: "v" + version + " header size too short; expected >= " + minHdrSize + ", got " + hdr.length
      };
    }
    let pduSize = void 0;
    let pduCompression = 0;
    let pduEncoding = 0;
    let pduAppType = 0;
    let pduAppId = "";
    let pduCrc = 0;
    let pduData = void 0;
    let pduCrcIsOk = false;
    let pduIsComplete = true;
    let pduErrors = [];
    let tail = void 0;
    let msgNum = 0;
    let ackOptions = 0;
    if (version === 1) {
      pduSize = hdr.readUInt8(1) << 16 | hdr.readUInt8(2) << 8 | hdr.readUInt8(3);
      const msgSize = hdr.length + (body === void 0 ? 0 : body.length);
      if (pduSize > msgSize) {
        pduIsComplete = false;
        pduErrors.push("v1 PDU truncated: expecting " + pduSize + ", got " + msgSize);
      }
      hdr = hdr.subarray(4);
      tail = hdr.subarray(0, 7).toString("ascii");
      hdr = hdr.subarray(7);
    } else if (version === 2) {
      hdr = hdr.subarray(1);
    }
    msgNum = hdr.readUInt8(0) >> 1 & 127;
    ackOptions = hdr.readUInt8(0) & 1;
    hdr = hdr.subarray(1);
    pduCompression = (hdr.readUInt8(0) << 2 | hdr.readUInt8(1) >> 6 & 3) & 7;
    pduEncoding = hdr.readUInt8(1) >> 4 & 3;
    pduAppType = hdr.readUInt8(1) & 15;
    hdr = hdr.subarray(2);
    let appIdLen = this.AppTypeToAppIdLenTable[version][pduAppType];
    if (appIdLen === void 0) {
      if (version === 2 && (pduAppType & 8) !== 0 && pduAppType !== 13) {
        appIdLen = (pduAppType & 7) + 1;
      } else {
        return {
          decoded: false,
          error: "Invalid v" + version + " appType: " + pduAppType
        };
      }
    }
    const pduIsACARS = [
      0 /* ACARS2Char */,
      1 /* ACARS4Char */,
      2 /* ACARS6Char */,
      0 /* ACARS2Char */,
      1 /* ACARS4Char */,
      2 /* ACARS6Char */
    ].indexOf(pduAppType) >= 0;
    if (hdr.length < appIdLen + crcLen) {
      return {
        decoded: false,
        error: "Header too short for v" + version + " appType: " + pduAppType
      };
    }
    pduAppId = hdr.subarray(0, appIdLen).toString("ascii");
    hdr = hdr.subarray(appIdLen);
    if (crcLen === 4) {
      pduCrc = hdr.readUInt8(0) << 24 | hdr.readUInt8(1) << 16 | hdr.readUInt8(2) << 8 | hdr.readUInt8(3);
    } else if (crcLen === 2) {
      pduCrc = hdr.readUInt8(0) << 8 | hdr.readUInt8(1);
    }
    hdr = hdr.subarray(crcLen);
    if (body !== void 0 && body.length > 0) {
      if ([1 /* Deflate */, 1 /* Deflate */].indexOf(pduCompression) >= 0) {
        try {
          pduData = Zlib.inflateRawSync(body, { windowBits: 15 });
        } catch (e) {
          pduErrors.push("Inflation failed for body: " + e);
        }
      } else if ([0 /* None */, 0 /* None */].indexOf(pduCompression) >= 0) {
        pduData = body;
      } else {
        pduErrors.push("Unsupported v" + version + " compression type: " + pduCompression);
      }
      if (pduData !== void 0) {
        const crcAlgoHandlerByVersion = {
          1: (buf, seed) => {
            return ~this.arinc665Crc32(buf, seed);
          },
          2: this.arincCrc16
        };
        const crcAlgoHandler = crcAlgoHandlerByVersion[version];
        if (crcAlgoHandler === void 0) {
          return {
            decoded: false,
            errors: "No CRC handler for v" + version
          };
        }
        const crcCheck = crcAlgoHandler(pduData, 4294967295);
        if (crcCheck === pduCrc) {
          pduCrcIsOk = true;
        } else {
          pduErrors.push("Body failed CRC check: provided=" + pduCrc + ", generated=" + crcCheck);
        }
      }
    } else {
      pduCrcIsOk = true;
    }
    let pdu = {
      version,
      crc: pduCrc,
      crcOk: pduCrcIsOk,
      complete: pduIsComplete,
      compression: pduCompression,
      encoding: pduEncoding,
      msgNum,
      ackOptions
    };
    if (pduIsACARS) {
      const label = pduAppId.substring(0, 2);
      const sublabel = appIdLen >= 4 ? pduAppId.substring(2, 4) : void 0;
      const mfi = appIdLen >= 6 ? pduAppId.substring(4, 6) : void 0;
      pdu.acars = {
        ...tail ? { tail } : {},
        label,
        ...sublabel ? { sublabel } : {},
        ...mfi ? { mfi } : {},
        ...pduData ? { text: pduData.toString("ascii") } : {}
      };
    } else {
      pdu.non_acars = {
        appId: pduAppId,
        ...pduData ? { text: pduData.toString("ascii") } : {}
      };
    }
    return {
      decoded: true,
      message: {
        data: pdu
      }
    };
  }
  static VersionPduHandlerTable = {
    1: {
      [0 /* Data */]: (hdr, body) => {
        return this.corePduDataHandler(1, 20, MIAMCoreV1CRCLength, hdr, body);
      },
      [1 /* Ack */]: void 0,
      [2 /* Aloha */]: void 0,
      [3 /* AlohaReply */]: void 0
    },
    2: {
      [0 /* Data */]: (hdr, body) => {
        return this.corePduDataHandler(2, 7, MIAMCoreV2CRCLength, hdr, body);
      },
      [1 /* Ack */]: void 0,
      [2 /* Aloha */]: void 0,
      [3 /* AlohaReply */]: void 0
    }
  };
};

// lib/MessageDecoder.ts
var MessageDecoder = class {
  name;
  plugins;
  debug;
  constructor() {
    this.name = "acars-decoder-typescript";
    this.plugins = [];
    this.debug = false;
    this.registerPlugin(new Label_ColonComma(this));
    this.registerPlugin(new Label_5Z(this));
    this.registerPlugin(new Label_12_N_Space(this));
    this.registerPlugin(new Label_15(this));
    this.registerPlugin(new Label_15_FST(this));
    this.registerPlugin(new Label_16_N_Space(this));
    this.registerPlugin(new Label_20_POS(this));
    this.registerPlugin(new Label_30_Slash_EA(this));
    this.registerPlugin(new Label_44_ETA(this));
    this.registerPlugin(new Label_44_IN(this));
    this.registerPlugin(new Label_44_OFF(this));
    this.registerPlugin(new Label_44_ON(this));
    this.registerPlugin(new Label_44_POS(this));
    this.registerPlugin(new Label_B6_Forwardslash(this));
    this.registerPlugin(new Label_H1_FPN(this));
    this.registerPlugin(new Label_H1_POS(this));
    this.registerPlugin(new Label_80(this));
    this.registerPlugin(new Label_8E(this));
    this.registerPlugin(new Label_1M_Slash(this));
    this.registerPlugin(new Label_SQ(this));
    this.registerPlugin(new Label_QP(this));
    this.registerPlugin(new Label_QQ(this));
    this.registerPlugin(new Label_QR(this));
    this.registerPlugin(new Label_QS(this));
  }
  registerPlugin(plugin) {
    const pluginInstance = plugin;
    this.plugins.push(plugin);
    return true;
  }
  decode(message, options = {}) {
    if (message.label === "MA") {
      const decodeResult = MIAMCoreUtils.parse(message.text);
      if (decodeResult.decoded && decodeResult.message.data !== void 0 && decodeResult.message.data.crcOk && decodeResult.message.data.complete && decodeResult.message.data.acars !== void 0) {
        message = {
          ...message,
          label: decodeResult.message.data.acars.label,
          ...decodeResult.message.data.acars.sublabel ? { sublabel: decodeResult.message.data.acars.sublabel } : {},
          ...decodeResult.message.data.acars.mfi ? { mfi: decodeResult.message.data.acars.mfi } : {},
          ...decodeResult.message.data.acars.text ? { text: decodeResult.message.data.acars.text } : {}
        };
      }
    }
    const usablePlugins = this.plugins.filter((plugin) => {
      const qualifiers = plugin.qualifiers();
      if (qualifiers.labels.includes(message.label)) {
        if (qualifiers.preambles && qualifiers.preambles.length > 0) {
          const matching = qualifiers.preambles.filter((preamble) => {
            return message.text.substring(0, preamble.length) === preamble;
          });
          return matching.length >= 1;
        } else {
          return true;
        }
      }
      return false;
    });
    if (options.debug) {
      console.log("Usable plugins");
      console.log(usablePlugins);
    }
    let result;
    if (usablePlugins.length > 0) {
      const plugin = usablePlugins[0];
      result = plugin.decode(message);
    } else {
      result = {
        decoded: false,
        error: "No known decoder plugin for this message",
        decoder: {
          name: "none",
          type: "none",
          decodeLevel: "none"
        },
        message,
        remaining: {
          text: message.text
        },
        raw: {},
        formatted: {
          description: "Not Decoded",
          items: []
        }
      };
    }
    if (options.debug) {
      console.log("Result");
      console.log(result);
    }
    return result;
  }
  lookupAirportByIata(iata) {
    const airportsArray = [];
    const airport = airportsArray.filter((e) => e.iata === iata);
    return airport;
  }
};
export {
  IcaoDecoder,
  MessageDecoder
};
//# sourceMappingURL=index.mjs.map