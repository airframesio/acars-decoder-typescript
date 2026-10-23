import { DecodeResult } from '../DecoderPluginInterface';
import { ResultFormatter } from './result_formatter';

const makeResult = (): DecodeResult => ({
  decoded: false,
  decoder: { name: 'test', type: 'pattern-match', decodeLevel: 'none' },
  formatted: { description: '', items: [] },
  raw: {},
  remaining: {},
});

describe('#541 — NaN guards for desiredAltitude and version', () => {
  describe('desiredAltitude', () => {
    it('skips non-numeric desired altitude', () => {
      const result = makeResult();
      ResultFormatter.desiredAltitude(result, NaN);
      expect(
        (result.raw as Record<string, unknown>).desired_alt,
      ).toBeUndefined();
      expect(
        result.formatted.items.some((i) => i.type === 'desired_altitude'),
      ).toBe(false);
    });

    it('still formats a valid desired altitude', () => {
      const result = makeResult();
      ResultFormatter.desiredAltitude(result, 34000);
      expect(result.formatted.items).toContainEqual(
        expect.objectContaining({ type: 'desired_altitude', value: '34000' }),
      );
    });
  });

  describe('version', () => {
    it('skips non-numeric message version', () => {
      const result = makeResult();
      ResultFormatter.version(result, NaN);
      expect((result.raw as Record<string, unknown>).version).toBeUndefined();
      expect(result.formatted.items.some((i) => i.type === 'version')).toBe(
        false,
      );
    });

    it('still formats a valid version', () => {
      const result = makeResult();
      ResultFormatter.version(result, 2.0);
      expect(result.formatted.items).toContainEqual(
        expect.objectContaining({ type: 'version', value: 'v2.0' }),
      );
    });
  });
});
