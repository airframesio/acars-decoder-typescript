import { AlternativeRunway } from './types/alternative_runway';
import { Route } from './types/route';
import { RunwayLandingData } from './types/runway_landing_data';
import { Wind } from './types/wind';
import type { WeatherReport } from './types/weather_report';
import type { MissionNumber } from './utils/mission_number';
import type { Loadsheet } from './utils/loadsheet';

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
  indicated_airspeed?: number;
  mach?: number;
  track?: number;
  /** Direction the wind comes from (meteorological convention), degrees. */
  wind_direction?: number;
  /** Wind speed, knots. */
  wind_speed?: number;
  /** Cruise wind direction in a performance report, degrees (altitude inferred). */
  cruise_wind_direction?: number;
  /** Cruise wind speed in a performance report, knots (altitude inferred). */
  cruise_wind_speed?: number;
  wind_variable?: boolean;
  /** POSN long-variant trailing suffix, usually `73`. */
  trailing_suffix?: string;

  // Flight identification
  flight_number?: string;
  /** Military (AMC) mission number exactly as received in /ID */
  mission_number?: string;
  /** The mission number broken into its parts, when it is a valid one */
  mission?: MissionNumber;
  /** Weather text sent in answer to a weather request */
  weather_report?: WeatherReport;
  /** ICAO code of the station a weather report is for (same as weather_report.station) */
  weather_station?: string;
  callsign?: string;
  tail?: string;

  // Airports
  departure_icao?: string;
  departure_iata?: string;
  arrival_icao?: string;
  arrival_iata?: string;
  alternate_icao?: string;
  landing_icao?: string;

  // Runways
  departure_runway?: string;
  arrival_runway?: string;
  alternate_runway?: string;
  landing_runways?: RunwayLandingData[];
  alternative_runways?: AlternativeRunway[];

  // Gates
  departure_gate?: string;
  arrival_gate?: string;
  /** Label RA gate uplink status, such as `OPEN` or `AVAIL 06:30`. */
  gate_status?: string;
  /** Estimated on time, seconds since midnight (same units as `eta_time`). */
  eon_time?: number;
  /** Ramp frequency: MHz as a number (label RA), or text such as `131.55 MHz` (label 40). */
  ramp_frequency?: number | string;
  /** Operations frequency in MHz. */
  ops_frequency?: number;
  ground_power?: string;
  planned_ground_time?: string;

  // Times (seconds since midnight or epoch)
  message_timestamp?: number;
  eta_time?: number;
  etd_time?: number;
  scheduled_departure_time?: number;
  scheduled_arrival_time?: number;
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
  /** Saleable seat configuration as sent (9C/104Y). */
  cabin_configuration?: string;
  fuel_burned?: number;
  /** Fuel remaining on board, in pounds (POSN sends hundreds of pounds; it is multiplied by 100). */
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
  gross_weight?: number;
  center_of_gravity?: number;
  cg_lower_limit?: number;
  cg_upper_limit?: number;
  mac?: number;
  trim?: number;

  // Performance report (/PR)
  /** Cruise altitude, feet. */
  cruise_altitude?: number;
  /** Temperature at cruise altitude, degrees Celsius. */
  cruise_temperature?: number;
  /** Transition altitude of the departure, feet. */
  transition_altitude?: number;
  /** Cost index, unitless. */
  cost_index?: number;
  /** Taxi fuel, pounds. */
  taxi_fuel?: number;
  /** Block fuel (18-field layout only), pounds. */
  block_fuel?: number;
  /** Zero fuel weight (18-field layout only), pounds. */
  zero_fuel_weight?: number;
  /** Zero fuel weight CG (18-field layout only), % MAC. */
  zero_fuel_cg?: number;
  /** Assumed temperature (`Pxx`), degrees Celsius (0-100). */
  assumed_temperature?: number;
  /** Probable derate (`Pyy`, -100 to 100); exact meaning depends on the AOC host. */
  derate?: number;

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
  version?: number;
  checksum_algorithm?: string;
  checksum?: number;
  sequence_number?: number;
  sequence_response?: number;
  ground_address?: string;
  text?: string;

  // State & events
  state_change?: { from: string; to: string };
  door_event?: { door: string; state: string };

  // Weight and balance. The Loadsheet plugin stores a typed Loadsheet (it
  // has `kind`); Label_H1_EZF stores its older map of the sent tokens
  // (ZFW, PAX, FLT STATUS, ...), which has no `kind`.
  loadsheet?: Loadsheet | Record<string, string>;

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
  /** Plugin id, as reported in DecodeResult.decoder.name. */
  name: string;
  decode(message: Message, options?: Options): DecodeResult;
  meetsStateRequirements(): boolean;
  // onRegister(store: Store<any>) : void;
  qualifiers(): Qualifiers;
}
