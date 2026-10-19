# Launch checklist

Everything below needs your accounts, money or judgment. The code side is done.

## 1. Spot-check the numbers (about 30 minutes, do this first)

Enter these scenarios in a trusted calculator: your accountant's software, or the proefberekening in the Belastingdienst aangifte/voorlopige aanslag for 2025 and 2026. Compare with what zzpreken shows. Small differences (under about €50) are expected because of rounding and the simplifications listed in the README. Anything larger: tell me the scenario and both numbers.

All scenarios: eenmanszaak, below AOW age, no other income.

| Year | Profit | Hours | Starter | Belastbare winst | Income tax | Zvw | Net per year |
|---|---|---|---|---|---|---|---|
| 2026 | 40.000 | 1225 | no | 33.872 | 3.683 | 1.643 | 34.674 |
| 2026 | 40.000 | 1224 | no | 34.920 | 4.125 | 1.694 | 34.182 |
| 2026 | 72.000 | 1400 | no | 61.808 | 17.483 | 2.998 | 51.520 |
| 2026 | 90.000 | 1500 | yes | 75.669 | 26.129 | 3.670 | 60.201 |
| 2026 | 140.000 | 1600 | no | 121.172 | 52.161 | 3.851 | 83.988 |
| 2026 | 220.000 | 1800 | no | 191.012 | 87.944 | 3.851 | 128.204 |
| 2025 | 54.000 | 1400 | no | 44.986 | 9.318 | 2.366 | 42.316 |
| 2025 | 115.000 | 1600 | no | 98.239 | 39.855 | 3.990 | 71.155 |

The 1.224 vs 1.225 hours pair checks the urencriterium edge.

## 2. Accounts and setup

- [ ] **Domain.** Check `zzpreken.nl` (or your pick) at a registrar. If you choose a different name, tell me and I'll replace it everywhere.
- [ ] **Cloudflare Pages.** Create a project from the GitHub repo `lordzub/zzpcalculator`. Build command `npm run build`, output `dist`, env `NODE_VERSION=22`. Connect the domain.
- [ ] **Cloudflare Web Analytics.** Create a site, copy the token, set it as `PUBLIC_CF_BEACON` in Pages, and redeploy.
- [ ] **Email.** Set up `info@` and `privacy@` (Cloudflare Email Routing to your own inbox is free).
- [ ] **Google Search Console.** Add the domain (DNS verification via Cloudflare) and submit `/sitemap-index.xml`.
- [ ] **Daisycon.** Apply as a publisher with the live site, then join ZZUPER and Moneybird. Send me the tracking links and I'll replace the placeholders in `src/site.ts`.

## 3. Calendar

- **November 2026:** minimumloon and Zvw 2027 published. Update the 2027 rules (I can do this in a scheduled run).
- **Mid-December 2026:** Eerste Kamer votes on Belastingplan 2027. Update the statuses to definitief.
- **31 December 2026:** rechtsvermoeden in force. Push the tariefcheck in zzp newsletters and on Reddit and Higherlevel before this.
- **1 January 2027:** switch `DEFAULT_YEAR` in `src/rules/index.ts` to 2027.
