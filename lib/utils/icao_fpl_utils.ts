/**
 * ICAO Doc 4444 Flight Plan (FPL) parser utility.
 *
 * Parses the standard ICAO FPL format:
 *   (FPL-callsign-flightRulesType
 *   -aircraftType/wake-equipment/surveillance
 *   -departureHHMM
 *   -speedLevel route
 *   -destinationHHMM alternate1 alternate2
 *   -otherInfo)
 */

import { Route } from '../types/route';

export interface IcaoFlightPlan {
  callsign: string;
  flightRules: string;
  flightType: string;
  aircraftType: string;
  wakeTurbulence: string;
  equipment: string;
  surveillance: string;
  departure: string;
  departureTime: string;
  cruiseSpeed: string;
  cruiseLevel: string;
  route: Route;
  destination: string;
  eet: string;
  alternates: string[];
  otherInfo: Record<string, string>;
}

export function parseIcaoFpl(text: string): IcaoFlightPlan | null {
  // Find the (FPL-...) block
  const fplStart = text.indexOf('(FPL-');
  if (fplStart === -1) {
    return null;
  }

  // Find matching closing paren
  const fplEnd = text.indexOf(')', fplStart);
  if (fplEnd === -1) {
    return null;
  }

  // Extract inner content after "(FPL-"
  const inner = text.substring(fplStart + 5, fplEnd);

  // Normalize: collapse all whitespace (newlines, multiple spaces) to single space
  const normalized = inner.replace(/\s+/g, ' ').trim();

  // Split on " -" or leading "-" to get the field sections.
  // The format is: callsign-rulesType-acft/wake-equip/surv-deptHHMM-speedLevel route-destHHMM alts-other
  // After removing "(FPL-", the first field is callsign-rulesType.
  // Subsequent fields are separated by "-" that appears after a space or at start of a section line.
  // However, the "-" delimiter is tricky: it separates major sections but also appears
  // within equipment strings (e.g. SDE3FGHIJ1...) — those are NOT delimiters.
  //
  // The ICAO FPL has exactly 6 major sections after the callsign section, delimited by "-".
  // We need to split carefully. The format after "(FPL-" is:
  //   section1-section2-section3-section4-section5-section6
  // where section1 = "callsign-rulesType" (contains one internal "-")
  //
  // Strategy: split on "-" and reconstruct based on known patterns.

  const parts = normalized.split('-');

  // We need at least 7 parts (callsign, rulesType, acftType/wake, equip/surv, dept, speed+route, dest+alts, other...)
  // But the equipment section may contain hyphens too, so we parse positionally.

  if (parts.length < 7) {
    return null;
  }

  // Section 1: callsign
  const callsign = parts[0].trim();
  if (!callsign) {
    return null;
  }

  // Section 2: flight rules + flight type (e.g., "IS")
  const rulesType = parts[1].trim();
  if (rulesType.length < 2) {
    return null;
  }
  const flightRules = rulesType[0];
  const flightType = rulesType[1];

  // Now we need to find the remaining sections. The challenge is that equipment strings
  // can be long but don't contain "-". The aircraft/wake section is "TYPE/WAKE".
  // The equipment/surveillance section is "EQUIP/SURV".
  // These are separated by "-".

  // Section 3: aircraft type / wake turbulence category (e.g., "B77W/H")
  const acftWake = parts[2].trim();
  const acftSlash = acftWake.indexOf('/');
  if (acftSlash === -1) {
    return null;
  }
  const aircraftType = acftWake.substring(0, acftSlash);
  const wakeTurbulence = acftWake.substring(acftSlash + 1);

  // Section 4: equipment / surveillance (e.g., "SDE3FGHIJ1J2J3J4J5M1P2RWXYZ/LB1D1")
  const equipSurv = parts[3].trim();
  const equipSlash = equipSurv.indexOf('/');
  if (equipSlash === -1) {
    return null;
  }
  const equipment = equipSurv.substring(0, equipSlash);
  const surveillance = equipSurv.substring(equipSlash + 1);

  // Section 5: departure aerodrome + time (e.g., "VESPA2354" or "KSFO0100")
  const deptField = parts[4].trim();
  // Time is always last 4 digits
  const departureTime = deptField.substring(deptField.length - 4);
  const departure = deptField.substring(0, deptField.length - 4);

  // Section 6: cruise speed/level + route (e.g., "N0482F350 DCT ENI DCT OAK DCT BURGL IRNMN2")
  const speedRouteField = parts[5].trim();
  // Speed is first token like N0482 or M084, level follows like F350 or S1190
  const speedMatch = speedRouteField.match(
    /^([NKM]\d{3,4})([FAVMS]\d{3,4})\s*(.*)/,
  );
  if (!speedMatch) {
    return null;
  }
  const cruiseSpeed = speedMatch[1];
  const cruiseLevel = speedMatch[2];
  const route = {
    waypoints: speedMatch[3].split(' ').map((s) => ({
      name: s,
    })),
  };

  // Section 7: destination + EET + alternates (e.g., "KLAX0117 KSFO")
  const destField = parts[6].trim();
  const destParts = destField.split(/\s+/);
  const destTime = destParts[0];
  // Destination ICAO is first 4 chars, EET is last 4 digits
  const destination = destTime.substring(0, destTime.length - 4);
  const eet = destTime.substring(destTime.length - 4);
  const alternates = destParts.slice(1).filter((s) => s.length > 0);

  // Section 8+: other information (remaining parts joined, then parsed as key/value)
  const otherRaw = parts.slice(7).join('-').trim();
  const otherInfo: Record<string, string> = {};

  if (otherRaw.length > 0) {
    // Other info is a series of KEY/VALUE pairs separated by spaces
    // e.g., "PBN/A1B1C1D1L1O2S2T1 NAV/ABAS RNP2 DAT/1FANSE SUR/RSP180 DOF/260310 REG/B2036"
    // Parse by finding KEY/ patterns
    const otherTokens = otherRaw.split(/\s+/);
    let currentKey = '';
    let currentValue = '';

    for (const token of otherTokens) {
      const kvMatch = token.match(/^([A-Z]{2,})\/(.*)/);
      if (kvMatch) {
        // Save previous key/value if exists
        if (currentKey) {
          otherInfo[currentKey] = currentValue.trim();
        }
        currentKey = kvMatch[1];
        currentValue = kvMatch[2];
      } else if (currentKey) {
        // Continuation of previous value
        currentValue += ' ' + token;
      }
    }
    // Save last key/value
    if (currentKey) {
      otherInfo[currentKey] = currentValue.trim();
    }
  }

  return {
    callsign,
    flightRules,
    flightType,
    aircraftType,
    wakeTurbulence,
    equipment,
    surveillance,
    departure,
    departureTime,
    cruiseSpeed,
    cruiseLevel,
    route,
    destination,
    eet,
    alternates,
    otherInfo,
  };
}
