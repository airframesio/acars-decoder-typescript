import { DecodeResult } from "../DecoderPluginInterface";
import { ResultFormatter } from "./result_formatter";
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
  public static processFlightPlan(decodeResult: DecodeResult, data: string[]): boolean {
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
  public static parseHeader(decodeResult: DecodeResult, header: string): boolean {
    let allKnownFields = true;
    if (header.startsWith('RF')) {
      decodeResult.formatted.items.push({
        type: 'status',
        code: 'ROUTE_STATUS',
        label: 'Route Status',
        value: 'Route Filed',
      });
      decodeResult.raw.route_status = 'RF';
      if (header.length > 2) {
        addRoute(decodeResult, header.substring(2));
      }
    } else if (header.startsWith('RP')) {
      decodeResult.raw.route_status = 'RP';
      decodeResult.formatted.items.push({
        type: 'status',
        code: 'ROUTE_STATUS',
        label: 'Route Status',
        value: 'Route Planned',
      });
      decodeResult.raw.route_status = header;
    } else if (header.startsWith('RI')) {
      decodeResult.raw.route_status = 'RI';
      decodeResult.formatted.items.push({
        type: 'status',
        code: 'ROUTE_STATUS',
        label: 'Route Status',
        value: 'Route Inactive',
      });
    } else {
      decodeResult.remaining.text += header;
      allKnownFields = false
    }
    return allKnownFields;
  };
}

function addArrivalAirport(decodeResult: DecodeResult, value: string) {
  ResultFormatter.arrivalAirport(decodeResult, value);
};

function addDepartureAirport(decodeResult: DecodeResult, value: string) {
  ResultFormatter.departureAirport(decodeResult, value);
};

function addRunway(decodeResult: DecodeResult, value: string) {
  // xxx(yyy) where xxx is the departure runway and yyy is the arrival runway
  if (value.length === 8) {
    ResultFormatter.arrivalRunway(decodeResult, value.substring(4, 7));
  }

  ResultFormatter.departureRunway(decodeResult, value.substring(0, 3));
};

function addRoute(decodeResult: DecodeResult, value: string) {
  const route = value.split('.');
  ResultFormatter.route(decodeResult, { waypoints: route.map((leg) => RouteUtils.getWaypoint(leg)) });
};

function addProcedure(decodeResult: DecodeResult, value: string, type: string) {
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

function addCompanyRoute(decodeResult: DecodeResult, value: string) {
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
