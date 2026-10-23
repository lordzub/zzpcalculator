import type { APIRoute } from 'astro';
import { YEARS, getRules } from '../rules';
import { SITE } from '../site';
import { NETTO_WINST, UURTARIEF_NETTO, BV_WINST, nettoSlug, uurSlug, bvSlug } from '../lib/examples';
import { CONTENT_UPDATED } from '../lib/fmt';

export const GET: APIRoute = () => {
  const b = `https://${SITE.domain}`;
  const r27 = getRules(2027);
  const lines = [
    `# ${SITE.name}`,
    '',
    `> Onafhankelijke, gratis rekenhulpen voor Nederlandse zzp'ers (Dutch freelancers) met de belastingregels van ${YEARS.join(', ')}. Elk cijfer heeft een status (definitief, voorlopig of voorstel) en een officiële bron. Alle berekeningen gebeuren in de browser; invoer wordt niet opgeslagen. Laatst bijgewerkt: ${CONTENT_UPDATED}.`,
    '',
    `Kernfeiten: zelfstandigenaftrek 2027 €${r27.zelfstandigenaftrek.value} (${r27.zelfstandigenaftrek.status}); rechtsvermoeden van een arbeidsovereenkomst vanaf 31 december 2026 bij een uurtarief tot en met €${r27.rechtsvermoedenDrempel.value}; startersaftrek 2027 €${r27.startersaftrek.value} (${r27.startersaftrek.status}).`,
    '',
    '## Rekenhulpen',
    ...SITE.tools.map((t) => `- [${t.title}](${b}${t.href})`),
    '',
    '## Rekenhulpen vooraf invullen',
    `Rekenhulpen accepteren query-parameters, bijvoorbeeld ${b}/netto-inkomen-zzp?omzet=60000&kosten=5000&uren=1400&starter=0&jaar=2026 of ${b}/rechtsvermoeden-check?jaar=2027&modus=uur&tarief=38.`,
    '',
    '## Belastingcijfers per jaar',
    ...YEARS.map((y) => `- [Belastingcijfers zzp ${y}](${b}/belastingcijfers-${y}): alle tarieven, aftrekposten en grenzen met bron ([JSON](${b}/data/belasting-${y}.json))`),
    `- [Wat verandert er in 2027](${b}/wat-verandert-er-2027)`,
    `- [Inkomstenbelasting 2027 voor zzp'ers: schijven en wat je betaalt per winst](${b}/inkomstenbelasting-2027)`,
    '',
    '## Rekenvoorbeelden',
    ...NETTO_WINST.map((w) => `- [Netto inkomen bij €${w} winst](${b}/netto-inkomen-zzp/${nettoSlug(w)})`),
    ...UURTARIEF_NETTO.map((n) => `- [Uurtarief voor €${n} netto per maand](${b}/uurtarief-berekenen-zzp/${uurSlug(n)})`),
    ...BV_WINST.map((w) => `- [BV of eenmanszaak bij €${w} winst](${b}/bv-of-eenmanszaak/${bvSlug(w)})`),
    `- [Welke tarieven vallen onder het rechtsvermoeden](${b}/rechtsvermoeden-check/tarieven)`,
    '',
    '## Over',
    `- [Methode en bronnen](${b}/over)`,
    `- [Hoe we geld verdienen](${b}/hoe-we-geld-verdienen)`,
    `- [Open data](${b}/open-data)`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
