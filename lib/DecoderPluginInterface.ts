import { Route } from './types/route';
import { Wind } from './types/wind';

/**
 * Representation of a Message
 */
export interface Message {
  label: string;
  sublabel?: string;
  text: string;
}

/**
 * Decoder Options
 */
export interface Options {
  debug?: boolean;
}

/**
 * Known fields that can appear on DecodeResult.raw.
 * The index signature allows plugin-specific fields without losing type safety
 * on the well-known ones.
 */
export interface RawFields {
  // Position & navigation
  position?: { latitude: number; longitude: number };
  altitude?: number;
  heading?: number;
  groundspeed?: number;
  airspeed?: number;
  mach?: number;

  // Flight identification
  flight_number?: string;
  callsign?: string;
  tail?: string;

  // Airports
  departure_icao?: string;
  departure_iata?: string;
  arrival_icao?: string;
  arrival_iata?: string;
  alternate_icao?: string;

  // Runways
  departure_runway?: string;
  arrival_runway?: string;
  alternate_runway?: string;

  // Times (seconds since midnight or epoch)
  message_timestamp?: number;
  eta_time?: number;
  out_time?: number;
  off_time?: number;
  on_time?: number;
  in_time?: number;
  engine_start_time?: number;
  engine_stop_time?: number;

  // Date
  day?: number | string;
  month?: number;
  departure_day?: number;
  arrival_day?: number;

  // Fuel
  fuel_on_board?: number;
  fuel_burned?: number;
  fuel_remaining?: number;
  fuel_in_tons?: number;
  out_fuel?: number;
  off_fuel?: number;
  on_fuel?: number;
  in_fuel?: number;
  start_fuel?: number;

  // Temperature
  outside_air_temperature?: number;
  total_air_temperature?: number;

  // Weight & balance
  center_of_gravity?: number;
  cg_lower_limit?: number;
  cg_upper_limit?: number;
  mac?: number;
  trim?: number;

  // Route & flight plan
  route?: Route;
  wind_data?: Wind[];
  requested_alts?: number[];
  desired_alt?: number;
  start_point?: string;
  route_number?: string;
  flight_plan?: string;

  // Message metadata
  label?: string;
  sublabel?: string;
  preamble?: string;
  version?: number | string;
  checksum_algorithm?: string;
  checksum?: number;
  sequence_number?: number;
  sequence_response?: number;
  ground_address?: string;
  text?: string;

  // State & events
  state_change?: { from: string; to: string };
  door_event?: { door: string; state: string };

  // Allow plugin-specific fields
  [key: string]: unknown;
}

/**
 * Results from decoding a message
 */
export interface DecodeResult {
  decoded: boolean;
  decoder: {
    name: string;
    type: 'pattern-match' | 'none';
    decodeLevel: 'none' | 'partial' | 'full';
  };
  error?: string;
  formatted: {
    description: string;
    items: {
      type: string;
      code: string;
      label: string;
      value: string;
    }[];
  };
  message?: Message;
  raw: RawFields;
  remaining: {
    text?: string;
  };
}

export interface Qualifiers {
  labels: string[];
  preambles?: string[];
}

export interface DecoderPluginInterface {
  decode(message: Message, options?: Options): DecodeResult;
  meetsStateRequirements(): boolean;
  // onRegister(store: Store<any>) : void;
  qualifiers(): Qualifiers;
}
