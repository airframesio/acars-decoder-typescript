export type EmergencySquawkCode = 7500 | 7600 | 7700;

export interface EmergencySquawkInfo {
  code: number;
  meaning: string;
}

const SQUAWK_MAP: Record<number, string> = {
  7500: 'Unlawful interference / hijacking',
  7600: 'Radio communication failure',
  7700: 'General emergency',
};

export function getEmergencySquawkInfo(code: number): EmergencySquawkInfo | null {
  const meaning = SQUAWK_MAP[code];
  if (!meaning) return null;
  return { code, meaning };
}

export function isEmergencySquawk(code: number): boolean {
  return code === 7500 || code === 7600 || code === 7700;
}

export function formatEmergencySquawk(code: number): string {
  const info = getEmergencySquawkInfo(code);
  return info ? `${info.code}: ${info.meaning}` : `Unknown squawk code: ${code}`;
}