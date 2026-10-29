import { DecodeResult } from '../DecoderPluginInterface';
import { ResultFormatter } from './result_formatter';

// The airline's number in the performance vendor's system. Other airlines send their own in
// the same place (JetBlue 28, Republic 71, SkyWest P, Frontier 6, seen in ACARS Hub), so
// only Southwest's is named here.
const AIRLINES: Record<string, string> = { '189': 'Southwest' };

/**
 * Writes the start shared by Southwest's label 10 performance requests (LDR01, LRW01):
 * airline ID, request layout (C on older software, D since) and software version.
 */
export function swaRequestHeader(
  decodeResult: DecodeResult,
  airlineId: string,
  layout: string,
  software: string,
) {
  const airline = AIRLINES[airlineId];
  ResultFormatter.raw(
    decodeResult,
    'airline_id',
    'AIRLINE',
    'Airline ID',
    airline ? `${airlineId} (${airline})` : airlineId,
    airlineId,
  );
  ResultFormatter.raw(
    decodeResult,
    'request_layout',
    'LAYOUT',
    'Request Layout',
    layout,
  );
  ResultFormatter.raw(
    decodeResult,
    'software_version',
    'SWVER',
    'Software Version',
    software,
  );
}
