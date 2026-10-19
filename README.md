# zzpcheck

Dutch-language calculators for zzp'ers, built with Astro and Svelte. All calculations run in the browser; nothing is stored or sent to a server.

| Page | Tool |
|---|---|
| `/rechtsvermoeden-check` | Rate threshold check (single rate, fixed fee, or a pasted list) |
| `/netto-inkomen-zzp` | Net income 2025 / 2026 / 2027 side by side |
| `/zelfstandigenaftrek-2027` | Same engine, framed around the shrinking aftrek |
| `/uurtarief-berekenen-zzp` | Minimum hourly rate (netto calculator solved in reverse) |
| `/bv-of-eenmanszaak` | BV vs eenmanszaak, with break-even profit |

## Commands

```sh
npm install
npm run dev      # local dev server
npm test         # golden + property tests
npm run build    # static site in dist/
```

## How it is organised

- `src/rules/<year>.json`: every tax figure for that year, each with `status` (definitief / voorlopig / voorstel), `source` URL and an optional `note`. **A yearly update means editing these files, not code.**
- `src/engine/`: pure TypeScript functions, no UI. `getRules(year)` throws for a missing year instead of falling back.
- `src/components/`: Svelte islands per tool; `Tape.svelte` renders every result as a line-by-line calculation with sources.
- `tests/reference/reference.py`: an **independent** Python implementation fed with the raw published figures. It generates `tests/golden.json` (75 cases). The TypeScript engine must match it to the cent.

### Updating the rules

1. Edit `src/rules/<year>.json` (and add a new year to `src/rules/index.ts`).
2. Make the same change in `tests/reference/reference.py` from the published source.
3. `python3 tests/reference/reference.py > tests/golden.json && npm test`.

CI (`.github/workflows/ci.yml`) runs the tests before the build, so a mismatch blocks a deploy.

### Known simplifications (also stated on the site)

- Eenmanszaak, below AOW age, business income only; no partner, toeslagen or loss carry-forward.
- Heffingskortingen are capped at the total income tax (no split between belasting and premie volksverzekeringen).
- Pension and AOV in the uurtarief tool are paid from net (deductibility not modelled, so the rate is slightly conservative).
- BV: one shareholder, salary = gebruikelijk loon (or less if profit is too low), no holding or pension.

## Deploying to Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `NODE_VERSION=22`
- Optional: `PUBLIC_CF_BEACON=<token>` to switch on Cloudflare Web Analytics (cookieless).

## Open items before launch

- [ ] Domain: `zzpcheck.nl` is a placeholder (`astro.config.mjs` `site`, `src/site.ts`, `public/robots.txt`, mail addresses on `/privacy` and `/over`).
- [ ] Affiliate links in `src/site.ts` are placeholders (`pending: true`) until Daisycon approves.
- [ ] 2027 figures marked voorstel/voorlopig: update after the Eerste Kamer vote (mid-December 2026), the minimumloon (November) and the Zvw regeling (November).
- [ ] 2027 arbeidskorting band thresholds are estimates (2026 × 1.01248); replace when the official table is published.
- [ ] Rechtsvermoeden threshold for 2027: €38 until an indexed amount is announced.
- [ ] 2027 gebruikelijk loon: uses €58,000 until published (late December).
