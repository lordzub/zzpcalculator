// The curated set of worked-example pages. Kept deliberately small: each page must add
// a real table and interpretation, not just a number (Google scaled-content policy).

export const NETTO_WINST = [25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 75000, 80000, 90000, 100000, 120000, 150000];
export const UURTARIEF_NETTO = [2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000];
export const BV_WINST = [60000, 80000, 100000, 120000, 150000, 200000, 250000, 300000];

export const nettoSlug = (w: number) => `${w}-euro-winst`;
export const uurSlug = (n: number) => `${n}-euro-netto-per-maand`;
export const bvSlug = (w: number) => `${w}-euro-winst`;

/** Standard assumptions for netto examples. */
export const NETTO_UREN = 1400;
/** Standard assumptions for uurtarief examples. */
export const UUR_DEFAULTS = { vakantieWeken: 8, kostenPerJaar: 6000, totaleUrenPerJaar: 1400 };
export const BV_EXTRA = 2500;
