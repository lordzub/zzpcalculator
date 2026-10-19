import type { APIRoute } from 'astro';
import { YEARS, getRules } from '../../rules';
import { CONTENT_UPDATED } from '../../lib/fmt';
import { SITE } from '../../site';

export function getStaticPaths() {
  return YEARS.map((y) => ({ params: { jaar: String(y) } }));
}

/** Public, citable copy of the rules the calculators use. */
export const GET: APIRoute = ({ params }) => {
  const year = Number(params.jaar);
  const body = {
    $schema_version: 1,
    name: `Belastingcijfers zzp ${year}`,
    publisher: `${SITE.name} (https://${SITE.domain})`,
    license: 'CC BY 4.0, https://creativecommons.org/licenses/by/4.0/',
    lastModified: CONTENT_UPDATED,
    documentation: `https://${SITE.domain}/open-data`,
    notes: [
      'Every figure has status (definitief | voorlopig | voorstel) and an official source URL.',
      'Rates include premies volksverzekeringen; amounts are for people below AOW age.',
      'Credit tables are piecewise linear: within [from, to) the credit is base + rate * (income - from).',
    ],
    rules: getRules(year),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
