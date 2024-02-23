import { DateTimeUtils } from "../DateTimeUtils";
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
        let allKnownFields = parseHeader(decodeResult, data[0]);
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
                addDepartureRunway(decodeResult, value);
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
}

function parseHeader(decodeResult: any, header: string): boolean {
    let allKnownFields = true;
    const fields = header.split('/');
    // fields[0] is msg type - we already know this
    for(let i=1; i<fields.length-1; ++i) {
        if (fields[i].startsWith('FN')) {
            decodeResult.raw.flight_number = fields[i].substring(2); // Strip off 'FN'
        } else if (fields[i].startsWith('SN')) {
            decodeResult.raw.serial_number = fields[i].substring(2); // Strip off 'FN'
        }  else if (fields[i].startsWith('TS')) {
            const ts = fields[i].substring(2).split(',');
            decodeResult.raw.message_timestamp = DateTimeUtils.convertDateTimeToEpoch(ts[0],ts[1]);
        } else {
            decodeResult.remaining.text += '/' + fields[i];
            allKnownFields = false
        }
    }
    decodeResult.raw.route_status = fields[fields.length - 1];

    var text;
    if (decodeResult.raw.route_status == 'RP') {
        text = 'Route Planned';
    } else if (decodeResult.raw.route_status == 'RI') {
        text = 'Route Inactive';
    }  else if (decodeResult.raw.route_status == 'RF') {
        text = 'Route Filed';
    } else {
        text = decodeResult.raw.route_status;
    }
    decodeResult.formatted.items.push({
        type: 'status',
        code: 'ROUTE_STATUS',
        label: 'Route Status',
        value: text,
    });
    return allKnownFields;
};

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

function addDepartureRunway(decodeResult: any, value: string) {
    decodeResult.raw.runway = value;
    decodeResult.formatted.items.push({
        type: 'runway',
        label: 'Runway',
        value: decodeResult.raw.runway,
    });
};

function addRoute(decodeResult: any, value: string) {
    const route = value.split('.');
    decodeResult.raw.route = {waypoints: route.map((leg)=> RouteUtils.getWaypoint(leg))};
    decodeResult.formatted.items.push({
      type: 'aircraft_route',
      code: 'ROUTE',
      label: 'Aircraft Route',
      value: RouteUtils.routeToString(decodeResult.raw.route),
    });
  };

function addProcedure(decodeResult: any, value: string, type: string) {
    if(decodeResult.raw.procedures === undefined) {
      decodeResult.raw.procedures = [];
    }
    const data = value.split('.');
    let waypoints;
    if(data.length>1) {
      waypoints = data.slice(1).map((leg)=> RouteUtils.getWaypoint(leg));
    }
    const route = {name: data[0], waypoints: waypoints};
    decodeResult.raw.procedures.push({type: type, route: route});
    const procedureName = type.substring(0,1).toUpperCase() + type.slice(1);
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
    if(parens_idx === -1) {
      name = segments[0];
    } else {
      name = segments[0].slice(0, parens_idx);
      runway = segments[0].slice(parens_idx+1, segments[0].indexOf(')'));
    }
    let waypoints;
    if(segments.length > 1) {
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