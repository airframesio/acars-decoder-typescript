import { formatAcarsFreeText } from './acars_free_text';

describe('acars free text helper', () => {
  test('cleans whitespace', () => {
    expect(formatAcarsFreeText('  HELLO   WORLD  ')).toBe('HELLO WORLD');
  });

  test('handles empty input', () => {
    expect(formatAcarsFreeText('')).toBe('');
    expect(formatAcarsFreeText(null)).toBe('');
    expect(formatAcarsFreeText(undefined)).toBe('');
  });
});