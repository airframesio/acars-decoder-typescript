/**
 * A runway an airline's landing or takeoff data offers in place of one it could not use.
 */
export interface AlternativeRunway {
  /** runway as it would be requested, e.g. 11/AIB */
  runway: string;
  /** the variant's name as sent, e.g. 11-E1804F */
  name?: string;
  /** what the variant is, e.g. 1804 feet off the east end */
  variant?: string;
}
