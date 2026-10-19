import { bracketTax, credit, r2, solveIncreasing } from './core';
import { nettoEenmanszaak } from './netto';
import type { YearRules } from './types';

export interface BvInput {
  winst: number;             // expected profit before DGA salary, per year
  levensbehoefte: number;    // net money needed per year for living
  extraKostenBv: number;     // extra yearly costs of running a BV (accountant, KvK, bank)
  uitkeren: 'alles' | 'behoefte';
}

export interface BvSide {
  netto: number;             // money in your pocket this year
  belasting: number;         // all taxes and premiums this year
  inBv: number;              // left in the BV after vpb (not yet taxed in box 2)
}

export interface BvResult {
  year: number;
  eenmanszaak: BvSide & { inkomstenbelasting: number; zvw: number };
  bv: BvSide & {
    salaris: number;
    werkgeversheffingZvw: number;
    loonheffing: number;
    vpb: number;
    dividend: number;
    box2: number;
    salarisOnderGebruikelijkLoon: boolean;
  };
  verschilNetto: number;      // bv.netto - eenmanszaak.netto
  verschilBelasting: number;  // bv.belasting - eenmanszaak.belasting
}

function loonNetto(salaris: number, rules: YearRules) {
  const bruto = bracketTax(salaris, rules.box1Brackets.value);
  const kortingen = credit(salaris, rules.algemeneHeffingskorting.value)
    + credit(salaris, rules.arbeidskorting.value);
  const heffing = bruto - Math.min(bruto, kortingen);
  return { heffing, netto: salaris - heffing };
}

export function vergelijkBv(input: BvInput, rules: YearRules): BvResult {
  // Eenmanszaak side: urencriterium assumed met, not a starter.
  const ez = nettoEenmanszaak(
    { omzet: input.winst, kosten: 0, uren: rules.urencriterium.value, starter: false },
    rules,
  );

  // BV side.
  const wg = rules.zvwWerkgever.value;
  const beschikbaar = Math.max(0, input.winst - input.extraKostenBv);
  const gl = rules.gebruikelijkLoon.value;
  // Salary plus employer Zvw can't exceed what the BV earns.
  const maxSalaris = beschikbaar / (1 + wg.rate);
  const salaris = Math.min(gl, maxSalaris);
  const werkgeversheffing = Math.min(salaris, wg.maxIncome) * wg.rate;
  const loon = loonNetto(salaris, rules);

  const bvWinst = input.winst - input.extraKostenBv - salaris - werkgeversheffing;
  const vpb = bracketTax(bvWinst, rules.vpb.value);
  const naVpb = Math.max(0, bvWinst - vpb);

  const box2Net = (gross: number) => gross - bracketTax(gross, rules.box2.value);
  let dividend: number;
  if (input.uitkeren === 'alles') {
    dividend = naVpb;
  } else {
    const tekort = Math.max(0, input.levensbehoefte - loon.netto);
    dividend = tekort <= 0 ? 0
      : box2Net(naVpb) <= tekort ? naVpb
      : solveIncreasing(box2Net, tekort, 0, naVpb);
  }
  const box2 = bracketTax(dividend, rules.box2.value);

  const bvNetto = loon.netto + dividend - box2;
  const bvBelasting = loon.heffing + werkgeversheffing + vpb + box2;

  return {
    year: rules.year,
    eenmanszaak: {
      netto: ez.netto,
      belasting: ez.totaalBelasting,
      inBv: 0,
      inkomstenbelasting: ez.inkomstenbelasting,
      zvw: ez.zvw,
    },
    bv: {
      netto: r2(bvNetto),
      belasting: r2(bvBelasting),
      inBv: r2(naVpb - dividend),
      salaris: r2(salaris),
      werkgeversheffingZvw: r2(werkgeversheffing),
      loonheffing: r2(loon.heffing),
      vpb: r2(vpb),
      dividend: r2(dividend),
      box2: r2(box2),
      salarisOnderGebruikelijkLoon: salaris < gl,
    },
    verschilNetto: r2(bvNetto - ez.netto),
    verschilBelasting: r2(bvBelasting - ez.totaalBelasting),
  };
}

/**
 * Profit at which a BV that pays out everything leaves you with at least as much net
 * as an eenmanszaak. Returns null if no break-even below the search limit.
 */
export function breakEvenWinst(extraKostenBv: number, rules: YearRules, limit = 1_000_000): number | null {
  const diff = (winst: number) =>
    vergelijkBv({ winst, levensbehoefte: 0, extraKostenBv, uitkeren: 'alles' }, rules).verschilNetto;
  let prev = 10_000;
  if (diff(prev) >= 0) return prev;
  for (let w = 15_000; w <= limit; w += 5_000) {
    if (diff(w) >= 0) {
      let lo = prev, hi = w;
      while (hi - lo > 100) {
        const mid = (lo + hi) / 2;
        if (diff(mid) >= 0) hi = mid; else lo = mid;
      }
      return Math.round(hi / 1000) * 1000;
    }
    prev = w;
  }
  return null;
}
