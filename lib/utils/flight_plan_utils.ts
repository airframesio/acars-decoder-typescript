import { DateTimeUtils } from "../DateTimeUtils";
import { CoordinateUtils } from "./coordinate_utils";
import { RouteUtils } from "./route_utils";

export class FlightPlanUtils {
  /**
   * Processes flight plan data
   * 
   * Expected format is [header, key1, val1, ... keyN, valN]
   * 
   * @param decodeResult - results
   * @param data - original message split by ':'
   * @returns whether all fields were processed or not
   */
  public static processFlightPlan(decodeResult: any, data: string[]): boolean {
    let allKnownFields = FlightPlanUtils.parseHeader(decodeResult, data[0]);
    for (let i = 1; i < data.length; i += 2) {
      const key = data[i];
      const value = data[i + 1];
      // TODO: discuss how store commented out bits as both raw and formatted
      switch (key) {
        case 'A': // Arrival Procedure (?)
          addProcedure(decodeResult, value, 'arrival');
          break;
        case 'AA':
          addArrivalAirport(decodeResult, value);
          break;
        case 'AP':
          addProcedure(decodeResult, value, 'approach');
          break;
        case 'CR':
          addCompanyRoute(decodeResult, value);
          break;
        case 'D': // Departure Procedure
          addProcedure(decodeResult, value, 'departure');
          break;
        case 'DA':
          addDepartureAirport(decodeResult, value);
          break;
        case 'F': // First Waypoint
          addRoute(decodeResult, value);
          break;
        case 'R':
          addRunway(decodeResult, value);
          break;
        // case 'WS': // something about routes, has altitude, so current parsing won't work
        // break;
        default:
          if (allKnownFields) {
            decodeResult.remaining.text = '';
            allKnownFields = false;
          }
          decodeResult.remaining.text += `:${key}:${value}`;
          decodeResult.decoder.decodeLevel = 'partial';
      }
    }
    return allKnownFields;
  }
  public static parseHeader(decodeResult: any, header: string): boolean {
    let allKnownFields = true;
    const fields = header.split('/');
    allKnownFields = allKnownFields && parseMessageType(decodeResult, fields[0]);
    for (let i = 1; i < fields.length; ++i) {
      if (fields[i].startsWith('FN')) {
        decodeResult.raw.flight_number = fields[i].substring(2); // Strip off 'FN'
      } else if (fields[i].startsWith('SN')) {
        decodeResult.raw.serial_number = fields[i].substring(2); // Strip off 'SN'
      } else if (fields[i].startsWith('TS')) {
        const ts = fields[i].substring(2).split(','); // Strip off PS
        let time = DateTimeUtils.convertDateTimeToEpoch(ts[0], ts[1]);
      
        if(Number.isNaN(time)) {  // convert DDMMYY to MMDDYY - TODO figure out a better way to determine
          const date = ts[1].substring(2,4) + ts[1].substring(0,2) + ts[1].substring(4,6);
          time = DateTimeUtils.convertDateTimeToEpoch(ts[0], date);
        }
        decodeResult.raw.message_timestamp = time;
      } else if (fields[i].startsWith('PS')) {
        const pos = fields[i].substring(2); // Strip off PS
        allKnownFields == allKnownFields && processPosition(decodeResult, pos);
      } else if (fields[i].startsWith('DT')) {
        const icao = fields[i].substring(2); // Strip off DT
        if(!decodeResult.raw.arrival_icao) {
          decodeResult.raw.arrival_icao = icao;
          decodeResult.formatted.items.push({
            type: 'destination',
            code: 'DST',
            label: 'Destination',
            value: decodeResult.raw.arrival_icao,
          });
        } else if(decodeResult.raw.arrival_icao == icao ) {
          continue;
        }else {
          decodeResult.remaining.text += '/' + fields[i];
        }
      }  else if (fields[i].startsWith('ID')) {
        const tail = fields[i].substring(2); // Strip off ID
        decodeResult.raw.tail = tail;
        decodeResult.formatted.items.push({
          type: 'tail',
          label: 'Tail',
          value: decodeResult.raw.tail,
        });
      } else if (fields[i].startsWith('RF')) {
        decodeResult.formatted.items.push({
          type: 'status',
          code: 'ROUTE_STATUS',
          label: 'Route Status',
          value: 'Route Filed',
        });
        decodeResult.raw.route_status = 'RF';
        if (fields[i].length > 2) {
          addRoute(decodeResult, fields[i].substring(2));       
        }
      } else if (fields[i].startsWith('RP')) {
        decodeResult.raw.route_status = 'RP';
        decodeResult.formatted.items.push({
          type: 'status',
          code: 'ROUTE_STATUS',
          label: 'Route Status',
          value: 'Route Planned',
        });
        if (fields[i].length > 2) {
          allKnownFields = allKnownFields && this.processFlightPlan(decodeResult, fields[i].split(':'));
        }
        decodeResult.raw.route_status = fields[i];
      } else if (fields[i].startsWith('RI')) {
        decodeResult.raw.route_status = 'RI';
        decodeResult.formatted.items.push({
          type: 'status',
          code: 'ROUTE_STATUS',
          label: 'Route Status',
          value: 'Route Inactive',
        });
        if (fields[i].length > 2) {
          allKnownFields = allKnownFields && this.processFlightPlan(decodeResult, fields[i].split(':'));
        }
      } else {
          decodeResult.remaining.text += '/' + fields[i];
          allKnownFields = false
      }
    }
    return allKnownFields;
  };
}

function parseMessageType(decodeResult: any, messageType: string): boolean {
  let decoded = true;
  const parts = messageType.split('#');
  if (parts.length == 1) {
    if (parts[0].startsWith('POS') && parts[0].length !== 3 && !(parts[0].startsWith('POS/'))) {
      decoded = processPosition(decodeResult, parts[0].substring(3));
    }
    return decoded;
  } else if (parts.length == 2) {
    if (parts[0].length > 0) {
      decodeResult.remaining.text += parts[0].substring(0, 3);
      decodeResult.raw.flight_number = parts[0].substring(3);
      decodeResult.remaining.text += '#' + parts[1].substring(0, 3);
    }
    if (parts[1].substring(3, 6) === 'POS' && parts[1].length !== 6 && parts[1].substring(3, 7) !== 'POS/') {
      decoded = processPosition(decodeResult, parts[1].substring(6));
    }

    decodeResult.raw.message_type = messageType;
    return decoded;
  }

  decodeResult.remaining.text += messageType;
  return false;
}

function processPosition(decodeResult: any, value: string): boolean {
  const position = CoordinateUtils.decodeStringCoordinates(value);
  if (position) {
    decodeResult.raw.position = position
    decodeResult.formatted.items.push({
      type: 'aircraft_position',
      code: 'POS',
      label: 'Aircraft Position',
      value: CoordinateUtils.coordinateString(position),
    });
  }
  return !!position;
}

function addArrivalAirport(decodeResult: any, value: string) {
  decodeResult.raw.arrival_icao = value;
  decodeResult.formatted.items.push({
    type: 'destination',
    code: 'DST',
    label: 'Destination',
    value: decodeResult.raw.arrival_icao,
  });
};

function addDepartureAirport(decodeResult: any, value: string) {
  decodeResult.raw.departure_icao = value;
  decodeResult.formatted.items.push({
    type: 'origin',
    code: 'ORG',
    label: 'Origin',
    value: decodeResult.raw.departure_icao,
  });
};
function addRunway(decodeResult: any, value: string) {
  // xxx(yyy) where xxx is the departure runway and yyy is the arrival runway
  if(value.length === 8) {
    decodeResult.raw.arrival_runway = value.substring(4, 7);
    decodeResult.formatted.items.push({
      type: 'runway',
      label: 'Arrival Runway',
      value: decodeResult.raw.arrival_runway,
    });
  }

  decodeResult.raw.departure_runway = value.substring(0, 3);
  decodeResult.formatted.items.push({
    type: 'runway',
    label: 'Departure Runway',
    value: decodeResult.raw.departure_runway,
  });
};

function addRoute(decodeResult: any, value: string) {
  const route = value.split('.');
  decodeResult.raw.route = { waypoints: route.map((leg) => RouteUtils.getWaypoint(leg)) };
  decodeResult.formatted.items.push({
    type: 'aircraft_route',
    code: 'ROUTE',
    label: 'Aircraft Route',
    value: RouteUtils.routeToString(decodeResult.raw.route),
  });
};

function addProcedure(decodeResult: any, value: string, type: string) {
  if (decodeResult.raw.procedures === undefined) {
    decodeResult.raw.procedures = [];
  }
  const data = value.split('.');
  let waypoints;
  if (data.length > 1) {
    waypoints = data.slice(1).map((leg) => RouteUtils.getWaypoint(leg));
  }
  const route = { name: data[0], waypoints: waypoints };
  decodeResult.raw.procedures.push({ type: type, route: route });
  const procedureName = type.substring(0, 1).toUpperCase() + type.slice(1);
  let procedureValue = route.name;
  decodeResult.formatted.items.push({
    type: `procedure`,
    code: 'proc',
    label: `${procedureName} Procedure`,
    value: RouteUtils.routeToString(route),
  });
};

function addCompanyRoute(decodeResult: any, value: string) {
  const segments = value.split('.');
  const parens_idx = segments[0].indexOf('(');
  let name;
  let runway;
  if (parens_idx === -1) {
    name = segments[0];
  } else {
    name = segments[0].slice(0, parens_idx);
    runway = segments[0].slice(parens_idx + 1, segments[0].indexOf(')'));
  }
  let waypoints;
  if (segments.length > 1) {
    waypoints = segments.slice(1).map((leg) => RouteUtils.getWaypoint(leg));
  }
  decodeResult.raw.company_route = {
    name: name,
    runway: runway,
    waypoints: waypoints,
  };
  decodeResult.formatted.items.push({
    type: 'company_route',
    code: 'CR',
    label: 'Company Route',
    value: RouteUtils.routeToString(decodeResult.raw.company_route),
  });
};