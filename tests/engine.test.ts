import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import golden from './golden.json';
import { getRules, YEARS } from '../src/rules';
import { nettoEenmanszaak } from '../src/engine/netto';
import { berekenUurtarief } from '../src/engine/uurtarief';
import { checkTarief, parseBulk } from '../src/engine/rechtsvermoeden';
import { vergelijkBv, breakEvenWinst } from '../src/engine/bv';
import { bracketTax, credit } from '../src/engine/core';

const CENT = 0.02;

describe('golden cases (independent reference implementation)', () => {
  for (const c of golden as any[]) {
    const name = `${c.kind} ${c.year} ${JSON.stringify(c.input)}`;
    it(name, () => {
      const rules = getRules(c.year);
      if (c.kind === 'netto') {
        const r = nettoEenmanszaak(c.input, rules);
        for (const k of Object.keys(c.expected)) {
          expect(Math.abs((r as any)[k] - c.expected[k]), k).toBeLessThanOrEqual(CENT);
        }
      } else {
        const r = vergelijkBv({ ...c.input, levensbehoefte: 0, uitkeren: 'alles' }, rules);
        expect(Math.abs(r.bv.salaris - c.expected.salaris)).toBeLessThanOrEqual(CENT);
        expect(Math.abs(r.bv.vpb - c.expected.vpb)).toBeLessThanOrEqual(CENT);
        expect(Math.abs(r.bv.box2 - c.expected.box2)).toBeLessThanOrEqual(CENT);
        expect(Math.abs(r.bv.netto - c.expected.netto)).toBeLessThanOrEqual(CENT);
      }
    });
  }
});

describe('hand-checked examples', () => {
  it('2026: €72.000 winst, urencriterium gehaald', () => {
    // 72.000 − 1.200 = 70.800; MKB 12,7% = 8.991,60; belastbaar 61.808,40
    const r = nettoEenmanszaak({ omzet: 80000, kosten: 8000, uren: 1400, starter: false }, getRules(2026));
    expect(r.belastbareWinst).toBeCloseTo(61808.4, 2);
    expect(r.algemeneHeffingskorting).toBeCloseTo(3115 - 0.06398 * (61808.4 - 29736), 0);
    expect(r.arbeidskorting).toBeCloseTo(5685 - 0.0651 * (72000 - 45592), 0);
    expect(r.zvw).toBeCloseTo(61808.4 * 0.0485, 1);
  });
  it('box 1 brackets 2026 at the top threshold', () => {
    expect(bracketTax(78426, getRules(2026).box1Brackets.value)).toBeCloseTo(38883 * 0.3575 + (78426 - 38883) * 0.3756, 2);
  });
  it('arbeidskorting 2026 hits its maximum at €45.592', () => {
    expect(credit(45592, getRules(2026).arbeidskorting.value)).toBeCloseTo(5685, 0);
  });
  it('algemene heffingskorting 2026 is zero around the top threshold', () => {
    expect(credit(78426, getRules(2026).algemeneHeffingskorting.value)).toBeLessThan(5);
  });
  it('no zelfstandigenaftrek below 1.225 uur', () => {
    const r = nettoEenmanszaak({ omzet: 50000, kosten: 0, uren: 1224, starter: true }, getRules(2026));
    expect(r.urencriteriumGehaald).toBe(false);
    expect(r.zelfstandigenaftrek).toBe(0);
    expect(r.startersaftrek).toBe(0);
  });
  it('a loss gives no tax and a negative net', () => {
    const r = nettoEenmanszaak({ omzet: 1000, kosten: 3000, uren: 1300, starter: false }, getRules(2026));
    expect(r.totaalBelasting).toBe(0);
    expect(r.netto).toBe(-2000);
  });
});

describe('rechtsvermoeden', () => {
  const r27 = getRules(2027);
  it('exactly at the threshold counts as under (ten hoogste)', () => {
    expect(checkTarief({ mode: 'uurtarief', uurtarief: 38 }, r27).onderDrempel).toBe(true);
    expect(checkTarief({ mode: 'uurtarief', uurtarief: 38.01 }, r27).onderDrempel).toBe(false);
  });
  it('fixed fee converts to an effective hourly rate', () => {
    const r = checkTarief({ mode: 'vast', bedrag: 6000, uren: 160 }, r27);
    expect(r.effectiefTarief).toBe(37.5);
    expect(r.onderDrempel).toBe(true);
  });
  it('not in force in 2025', () => {
    expect(checkTarief({ mode: 'uurtarief', uurtarief: 20 }, getRules(2025)).inWerking).toBe(false);
  });
  it('rejects zero hours', () => {
    expect(() => checkTarief({ mode: 'vast', bedrag: 100, uren: 0 }, r27)).toThrow();
  });
  it('parses pasted lists with Dutch and English decimals', () => {
    expect(parseBulk('Jan; 42,50\nPiet,35\n39.75\n\nfoo')).toEqual([
      { label: 'Jan', tarief: 42.5 },
      { label: 'Piet', tarief: 35 },
      { label: 'Regel 3', tarief: 39.75 },
    ]);
  });
});

describe('rules data', () => {
  it('refuses a missing year', () => {
    expect(() => getRules(2024)).toThrow();
  });
  it('every figure has a source and a status', () => {
    for (const y of YEARS) {
      for (const [k, v] of Object.entries(getRules(y))) {
        if (k === 'year') continue;
        expect((v as any).source, `${y}.${k}`).toMatch(/^https:\/\//);
        expect(['definitief', 'voorlopig', 'voorstel']).toContain((v as any).status);
      }
    }
  });
  it('credit tables are continuous', () => {
    for (const y of YEARS) {
      for (const key of ['arbeidskorting', 'algemeneHeffingskorting'] as const) {
        const t = getRules(y)[key].value;
        for (let i = 0; i < t.length - 1; i++) {
          const end = t[i].base + t[i].rate * ((t[i].to as number) - t[i].from);
          expect(Math.abs(end - t[i + 1].base), `${y} ${key} segment ${i}`).toBeLessThan(1);
        }
      }
    }
  });
});

describe('properties', () => {
  const years = fc.constantFrom(...YEARS);
  it('net income never rises when costs rise', () => {
    fc.assert(fc.property(years, fc.integer({ min: 0, max: 400000 }), fc.integer({ min: 0, max: 100000 }), fc.integer({ min: 1, max: 20000 }), fc.boolean(),
      (y, omzet, kosten, extra, starter) => {
        const rules = getRules(y);
        const a = nettoEenmanszaak({ omzet, kosten, uren: 1400, starter }, rules).netto;
        const b = nettoEenmanszaak({ omzet, kosten: kosten + extra, uren: 1400, starter }, rules).netto;
        return b <= a + CENT;
      }), { numRuns: 500 });
  });
  it('net income never falls when revenue rises', () => {
    fc.assert(fc.property(years, fc.integer({ min: 0, max: 400000 }), fc.integer({ min: 1, max: 20000 }),
      (y, omzet, extra) => {
        const rules = getRules(y);
        return nettoEenmanszaak({ omzet: omzet + extra, kosten: 5000, uren: 1400, starter: false }, rules).netto
          >= nettoEenmanszaak({ omzet, kosten: 5000, uren: 1400, starter: false }, rules).netto - CENT;
      }), { numRuns: 500 });
  });
  it('tax is never negative and never above profit', () => {
    fc.assert(fc.property(years, fc.integer({ min: 0, max: 1000000 }), fc.boolean(), (y, omzet, starter) => {
      const r = nettoEenmanszaak({ omzet, kosten: 0, uren: 1400, starter }, getRules(y));
      return r.totaalBelasting >= 0 && r.totaalBelasting <= Math.max(0, r.winst);
    }), { numRuns: 500 });
  });
  it('uurtarief round-trips through the netto calculator', () => {
    fc.assert(fc.property(years, fc.integer({ min: 1000, max: 12000 }), fc.integer({ min: 10, max: 40 }), fc.integer({ min: 0, max: 12 }), fc.integer({ min: 0, max: 30000 }),
      (y, nettoPm, uren, vak, kosten) => {
        const rules = getRules(y);
        const r = berekenUurtarief({ nettoPerMaand: nettoPm, declarabeleUrenPerWeek: uren, vakantieWeken: vak, kostenPerJaar: kosten, pensioenPerMaand: 0, aovPerMaand: 0, starter: false, totaleUrenPerJaar: 1400 }, rules);
        const omzet = r.uurtarief * r.declarabeleUren;
        const n = nettoEenmanszaak({ omzet, kosten, uren: 1400, starter: false }, rules).netto;
        // The rate is rounded up, so net must reach the target and not overshoot by much.
        return n >= nettoPm * 12 - 1 && n <= nettoPm * 12 + r.declarabeleUren * 0.01 + 1;
      }), { numRuns: 300 });
  });
  it('BV in "behoefte" mode never pays out more than needed', () => {
    fc.assert(fc.property(years, fc.integer({ min: 70000, max: 400000 }), fc.integer({ min: 20000, max: 120000 }),
      (y, winst, behoefte) => {
        const r = vergelijkBv({ winst, levensbehoefte: behoefte, extraKostenBv: 2500, uitkeren: 'behoefte' }, getRules(y));
        const salarisNetto = r.bv.salaris - r.bv.loonheffing;
        if (salarisNetto >= behoefte) return r.bv.dividend === 0;
        return r.bv.inBv === 0 ? r.bv.netto <= behoefte + 1 : Math.abs(r.bv.netto - behoefte) <= 1;
      }), { numRuns: 300 });
  });
});

describe('BV break-even', () => {
  it('exists for every year and is between €80k and €300k with €2.500 extra costs', () => {
    for (const y of YEARS) {
      const be = breakEvenWinst(2500, getRules(y));
      expect(be, `${y}`).not.toBeNull();
      expect(be!).toBeGreaterThan(80000);
      expect(be!).toBeLessThan(300000);
    }
  });
});
