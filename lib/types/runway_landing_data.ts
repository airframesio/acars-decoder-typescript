/**
 * Landing performance for one runway, as an airline's landing data uplink gives it.
 */
export interface RunwayLandingData {
  /** runway as sent, with any suffix */
  runway: string;
  /** what the runway's variant is, e.g. 1804 feet off the east end */
  variant?: string;
  /** feet */
  length?: number;
  flaps?: number;
  /** knots; negative is a tailwind */
  headwind?: number;
  /** knots */
  crosswind?: number;
  crosswindSide?: 'L' | 'R';
  /** knots */
  vref?: number;
  /** knots */
  vtarget?: number;
  /** knots added to VREF to get VTGT */
  additive?: number;
  /** maximum landing weight as sent, e.g. 129.2/S */
  maxLandingWeight?: string;
  /** pounds */
  landingWeight?: number;
  /** feet of runway left at each autobrake setting, keyed as sent (AB2, AB3, ABM) */
  stoppingMargins: Record<string, number>;
  notes?: string[];
}
