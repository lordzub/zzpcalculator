// Build-time formatting helpers shared by the static pages.
import type { Sourced } from '../engine/types';

export const eur = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n));
export const eur2 = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const pct = (n: number, digits = 2) =>
  new Intl.NumberFormat('nl-NL', { style: 'percent', maximumFractionDigits: digits }).format(n);
export const num = (n: number) => new Intl.NumberFormat('nl-NL').format(n);

/** Plain-language label for a rule's status. */
export const statusLabel = (s: Sourced<unknown>['status']) =>
  s === 'definitief' ? 'definitief' : s === 'voorlopig' ? 'voorlopig' : 'voorstel';

/** Host name of a source URL, for a short inline "bron: belastingdienst.nl". */
export const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');

/** Build a calculator link with query parameters that pre-fill the tool. */
export const toolLink = (path: string, params: Record<string, string | number | boolean>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) q.set(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
  return `${path}?${q.toString()}`;
};

/** Date the content and figures were last reviewed. Update when figures change. */
export const CONTENT_UPDATED = '2026-10-19';
