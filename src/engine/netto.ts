import { bracketTax, credit, r2 } from './core';
import type { YearRules } from './types';

export interface NettoInput {
  omzet: number;            // revenue excl. btw, per year
  kosten: number;           // business costs per year
  uren: number;             // hours spent on the business per year (urencriterium)
  starter: boolean;         // qualifies for startersaftrek (if urencriterium met)
}

export interface NettoResult {
  year: number;
  winst: number;
  urencriteriumGehaald: boolean;
  zelfstandigenaftrek: number;
  startersaftrek: number;
  mkbVrijstelling: number;
  belastbareWinst: number;
  tariefcorrectie: number;
  inkomstenbelastingBruto: number;
  algemeneHeffingskorting: number;
  arbeidskorting: number;
  inkomstenbelasting: number;
  zvw: number;
  totaalBelasting: number;
  netto: number;
  nettoPerMaand: number;
}

/**
 * Net income for an eenmanszaak, below AOW age, business income only.
 * Simplifications (stated on the site):
 *  - ondernemersaftrek is capped at the profit (no loss carry-forward modelled);
 *  - heffingskortingen are capped at the income tax before credits (no split between
 *    belasting and premie volksverzekeringen);
 *  - no other box 1 income, deductions, toeslagen or partner effects.
 */
export function nettoEenmanszaak(input: NettoInput, rules: YearRules): NettoResult {
  const winst = input.omzet - input.kosten;
  const uren = rules.urencriterium.value;
  const urencriteriumGehaald = input.uren >= uren;

  const positief = Math.max(0, winst);
  const za = urencriteriumGehaald ? Math.min(rules.zelfstandigenaftrek.value, positief) : 0;
  const sa = urencriteriumGehaald && input.starter
    ? Math.min(rules.startersaftrek.value, positief - za)
    : 0;

  const naAftrek = positief - za - sa;
  const mkb = naAftrek * rules.mkbWinstvrijstelling.value;
  const belastbareWinst = Math.max(0, naAftrek - mkb);

  // Tariefcorrectie: deductions that would otherwise save tax at the top rate only
  // save tax at the bracket-2 rate.
  const brackets = rules.box1Brackets.value;
  const top = brackets[brackets.length - 1];
  const capRate = brackets[brackets.length - 2].rate;
  const topFrom = brackets[brackets.length - 2].upTo ?? Infinity;
  const aftrekken = za + sa + mkb;
  const inTop = Math.min(aftrekken, Math.max(0, belastbareWinst + aftrekken - topFrom));
  const tariefcorrectie = inTop * (top.rate - capRate);

  const ibBruto = bracketTax(belastbareWinst, brackets) + tariefcorrectie;
  // Algemene heffingskorting on the verzamelinkomen (here: belastbare winst);
  // arbeidskorting on arbeidsinkomen, which for ondernemers is profit before
  // ondernemersaftrek and MKB-winstvrijstelling.
  const ahk = credit(belastbareWinst, rules.algemeneHeffingskorting.value);
  const ak = credit(positief, rules.arbeidskorting.value);
  // Credits can't exceed the tax; arbeidskorting is used first is irrelevant here since both cap at the total.
  const kortingTotaal = Math.min(ibBruto, ahk + ak);
  const ahkUsed = Math.min(ahk, kortingTotaal);
  const akUsed = kortingTotaal - ahkUsed;
  const ib = ibBruto - kortingTotaal;

  const zvwRule = rules.zvwOndernemer.value;
  const zvw = Math.min(belastbareWinst, zvwRule.maxIncome) * zvwRule.rate;

  const totaal = ib + zvw;
  const netto = winst - totaal;

  return {
    year: rules.year,
    winst: r2(winst),
    urencriteriumGehaald,
    zelfstandigenaftrek: r2(za),
    startersaftrek: r2(sa),
    mkbVrijstelling: r2(mkb),
    belastbareWinst: r2(belastbareWinst),
    tariefcorrectie: r2(tariefcorrectie),
    inkomstenbelastingBruto: r2(ibBruto),
    algemeneHeffingskorting: r2(ahkUsed),
    arbeidskorting: r2(akUsed),
    inkomstenbelasting: r2(ib),
    zvw: r2(zvw),
    totaalBelasting: r2(totaal),
    netto: r2(netto),
    nettoPerMaand: r2(netto / 12),
  };
}
