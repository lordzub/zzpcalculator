"""
Independent reference implementation for the golden tests.

Written separately from the TypeScript engine and fed with the raw published
figures (not the JSON rules files), so it catches both logic and data-entry errors.
Run: python3 tests/reference/reference.py > tests/golden.json
"""
import json

P = {
    2025: dict(
        b=[(38441, .3582), (76817, .3748), (None, .495)],
        ahk_max=3068, ahk_start=28406, ahk_rate=.06337,
        # arbeidskorting: (upper bound, cumulative credit at upper bound)
        ak_pts=[(12169, 980), (26288, 5220), (43071, 5599)], ak_af=.0651,
        za=2470, sa=2123, mkb=.127, zvw=.0526, zvw_max=75864, zvw_wg=.0651,
        vpb=[(200000, .19), (None, .258)], box2=[(67804, .245), (None, .31)], gl=56000,
    ),
    2026: dict(
        b=[(38883, .3575), (78426, .3756), (None, .495)],
        ahk_max=3115, ahk_start=29736, ahk_rate=.06398,
        ak_pts=[(11965, 996), (25845, 5300), (45592, 5685)], ak_af=.0651,
        za=1200, sa=2123, mkb=.127, zvw=.0485, zvw_max=79409, zvw_wg=.061,
        vpb=[(200000, .19), (None, .258)], box2=[(68843, .245), (None, .31)], gl=58000,
    ),
    2027: dict(
        b=[(39247, .3623), (80578, .3816), (None, .495)],
        ahk_max=3154, ahk_start=30910, ahk_rate=.0635,
        ak_pts=[(12114, 1142), (26168, 5500), (47834, 5889)], ak_af=.0651,
        za=900, sa=10, mkb=.127, zvw=.0502, zvw_max=82547, zvw_wg=.0627,
        vpb=[(200000, .19), (None, .258)], box2=[(69607, .245), (None, .31)], gl=58000,
    ),
}


def schijven(x, b):
    t, prev = 0.0, 0
    for up, rate in b:
        hi = x if up is None else min(x, up)
        if hi > prev:
            t += (hi - prev) * rate
        if up is None or x <= up:
            break
        prev = up
    return t


def ahk(x, p):
    if x <= p['ahk_start']:
        return p['ahk_max']
    return max(0.0, p['ahk_max'] - p['ahk_rate'] * (x - p['ahk_start']))


def arbeidskorting(x, p):
    if x <= 0:
        return 0.0
    lo, credit_lo = 0, 0
    for hi, credit_hi in p['ak_pts']:
        if x < hi:
            return credit_lo + (credit_hi - credit_lo) * (x - lo) / (hi - lo)
        lo, credit_lo = hi, credit_hi
    return max(0.0, credit_lo - p['ak_af'] * (x - lo))


def netto(year, omzet, kosten, uren, starter):
    p = P[year]
    winst = omzet - kosten
    w = max(0, winst)
    ok = uren >= 1225
    za = min(p['za'], w) if ok else 0
    sa = min(p['sa'], w - za) if ok and starter else 0
    na = w - za - sa
    mkb = na * p['mkb']
    belastbaar = max(0, na - mkb)
    top_from = p['b'][1][0]
    aftrek = za + sa + mkb
    in_top = min(aftrek, max(0, belastbaar + aftrek - top_from))
    tc = in_top * (p['b'][2][1] - p['b'][1][1])
    ib_bruto = schijven(belastbaar, p['b']) + tc
    kort = min(ib_bruto, ahk(belastbaar, p) + arbeidskorting(w, p))
    ib = ib_bruto - kort
    zvw = min(belastbaar, p['zvw_max']) * p['zvw']
    return dict(belastbareWinst=round(belastbaar, 2), inkomstenbelasting=round(ib, 2),
                zvw=round(zvw, 2), netto=round(winst - ib - zvw, 2))


def bv_alles(year, winst, extra):
    p = P[year]
    beschikbaar = max(0, winst - extra)
    sal = min(p['gl'], beschikbaar / (1 + p['zvw_wg']))
    wg = min(sal, p['zvw_max']) * p['zvw_wg']
    bruto = schijven(sal, p['b'])
    heffing = bruto - min(bruto, ahk(sal, p) + arbeidskorting(sal, p))
    bvw = winst - extra - sal - wg
    vpb = schijven(bvw, p['vpb'])
    div = max(0, bvw - vpb)
    b2 = schijven(div, p['box2'])
    return dict(salaris=round(sal, 2), vpb=round(vpb, 2), box2=round(b2, 2),
                netto=round(sal - heffing + div - b2, 2))


cases = []
for year in (2025, 2026, 2027):
    for omzet, kosten, uren, starter in [
        (20000, 2000, 1300, False), (35000, 3000, 1300, False), (45000, 5000, 1300, True),
        (60000, 6000, 1400, False), (80000, 8000, 1400, False), (80000, 8000, 1000, False),
        (100000, 10000, 1500, False), (100000, 10000, 1500, True), (130000, 15000, 1600, False),
        (150000, 10000, 1600, False), (250000, 30000, 1800, False), (5000, 4000, 1300, True),
        (1500, 3000, 1300, False), (40000, 0, 1225, False), (40000, 0, 1224, False),
        (90000, 12000, 1400, True), (70000, 2000, 1250, False), (120000, 20000, 1500, False),
        (55000, 7000, 1300, False), (200000, 25000, 1700, True),
    ]:
        cases.append(dict(kind='netto', year=year,
                          input=dict(omzet=omzet, kosten=kosten, uren=uren, starter=starter),
                          expected=netto(year, omzet, kosten, uren, starter)))
    for winst, extra in [(60000, 2500), (100000, 2500), (150000, 2500), (250000, 3000), (40000, 2000)]:
        cases.append(dict(kind='bv', year=year, input=dict(winst=winst, extraKostenBv=extra),
                          expected=bv_alles(year, winst, extra)))

print(json.dumps(cases, indent=1))
