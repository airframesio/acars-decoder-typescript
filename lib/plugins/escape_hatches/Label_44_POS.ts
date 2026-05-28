/**
 * Field-level hatches for Label_44_POS:
 *   - parse_flight_level_or_ground(value): "GRD" / "***" → 0, else Number(value)
 *   - flight_level_to_altitude_feet(value): value * 100
 *
 * Both mirror the inline logic in lib/plugins/Label_44_POS.ts:
 *   const flight_level = (group == 'GRD' || group == '***') ? 0 : Number(group);
 *   ResultFormatter.altitude(decodeResult, flight_level * 100);
 */

export function parse_flight_level_or_ground(value: unknown, _args: Record<string, unknown>): number {
  const s = typeof value === 'string' ? value : String(value ?? '');
  if (s === 'GRD' || s === '***') return 0;
  return Number(s);
}

export function flight_level_to_altitude_feet(value: unknown, _args: Record<string, unknown>): number {
  const n = typeof value === 'number' ? value : Number(value);
  return n * 100;
}
