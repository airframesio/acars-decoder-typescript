export function formatAcarsFreeText(text?: string | null): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}