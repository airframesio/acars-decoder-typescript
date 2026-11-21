/**
 * Weather text sent to an aircraft in answer to a weather request, e.g. the
 * `/MT` field of a military (AMC) `WXR` uplink.
 */
export interface WeatherReport {
  /** ICAO code of the station the report is for */
  station: string;
  /** HHMM time given with the report */
  time: string;
  /** `TAF` or `METAR` when the text looks like one, otherwise `UNKNOWN` */
  type: 'METAR' | 'TAF' | 'UNKNOWN';
  /** The report text as received */
  report: string;
}
