import { r2 } from './core';
import type { YearRules } from './types';

export type RateInput =
  | { mode: 'uurtarief'; uurtarief: number }
  | { mode: 'vast'; bedrag: number; uren: number };

export interface RateCheck {
  year: number;
  inWerking: boolean;
  drempel: number | null;
  effectiefTarief: number;
  onderDrempel: boolean | null;
  margeEuro: number | null;  // positive = above threshold
  margeProcent: number | null;
}

export function effectiefTarief(input: RateInput): number {
  if (input.mode === 'uurtarief') return input.uurtarief;
  if (input.uren <= 0) throw new Error('Aantal uren moet groter dan 0 zijn');
  return input.bedrag / input.uren;
}

export function checkTarief(input: RateInput, rules: YearRules): RateCheck {
  const tarief = effectiefTarief(input);
  const drempel = rules.rechtsvermoedenDrempel.value;
  if (drempel == null) {
    return {
      year: rules.year, inWerking: false, drempel: null, effectiefTarief: r2(tarief),
      onderDrempel: null, margeEuro: null, margeProcent: null,
    };
  }
  const marge = tarief - drempel;
  return {
    year: rules.year,
    inWerking: true,
    drempel,
    effectiefTarief: r2(tarief),
    // The law applies at "ten hoogste" the threshold: up to and including.
    onderDrempel: tarief <= drempel,
    margeEuro: r2(marge),
    margeProcent: r2((marge / drempel) * 100),
  };
}

/**
 * Parse a pasted list or CSV of rates for the bulk mode.
 * Accepts lines like "Jan, 42,50" / "Jan;42.50" / "42" and Dutch or English decimals.
 */
export function parseBulk(text: string): { label: string; tarief: number }[] {
  const out: { label: string; tarief: number }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(.*?)[\s;,\t]*€?\s*(\d{1,6}(?:[.,]\d{1,2})?)\s*$/);
    if (!m) continue;
    const num = Number(m[2].replace(',', '.'));
    if (!Number.isFinite(num)) continue;
    const label = m[1].replace(/[;,\t\s€]+$/, '').trim() || `Regel ${out.length + 1}`;
    out.push({ label, tarief: num });
  }
  return out;
}
