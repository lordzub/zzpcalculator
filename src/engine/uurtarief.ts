import { r2, solveIncreasing } from './core';
import { nettoEenmanszaak } from './netto';
import type { YearRules } from './types';

export interface UurtariefInput {
  nettoPerMaand: number;     // desired net income per month
  declarabeleUrenPerWeek: number;
  vakantieWeken: number;     // weeks off (holidays, sickness, admin) per year
  kostenPerJaar: number;     // business costs
  pensioenPerMaand: number;  // set aside from net
  aovPerMaand: number;       // paid from net
  starter: boolean;
  totaleUrenPerJaar: number; // all business hours incl. non-billable, for the urencriterium
}

export interface UurtariefResult {
  year: number;
  declarabeleUren: number;
  benodigdeOmzet: number;
  uurtarief: number;
  nettoNodig: number;
  urencriteriumGehaald: boolean;
}

/**
 * Minimum hourly rate: solves the netto calculator in reverse.
 * Pension and AOV are treated as paid from net income (their deductibility is not
 * modelled), which makes the result slightly conservative.
 */
export function berekenUurtarief(input: UurtariefInput, rules: YearRules): UurtariefResult {
  const weken = Math.max(0, 52 - input.vakantieWeken);
  const uren = input.declarabeleUrenPerWeek * weken;
  if (uren <= 0) throw new Error('Geen declarabele uren over');

  const nettoNodig = (input.nettoPerMaand + input.pensioenPerMaand + input.aovPerMaand) * 12;
  const netFor = (omzet: number) =>
    nettoEenmanszaak(
      { omzet, kosten: input.kostenPerJaar, uren: input.totaleUrenPerJaar, starter: input.starter },
      rules,
    ).netto;

  const omzet = solveIncreasing(netFor, nettoNodig, input.kostenPerJaar, 10_000_000);
  const rounded = Math.ceil(omzet);
  return {
    year: rules.year,
    declarabeleUren: uren,
    benodigdeOmzet: rounded,
    uurtarief: Math.ceil((omzet / uren) * 100) / 100,
    nettoNodig: r2(nettoNodig),
    urencriteriumGehaald: input.totaleUrenPerJaar >= rules.urencriterium.value,
  };
}
