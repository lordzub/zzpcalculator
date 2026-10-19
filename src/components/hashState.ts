// Shareable results: non-personal inputs live in the URL hash fragment,
// which browsers never send to the server.

// Query parameters (?omzet=60000&jaar=2026) also pre-fill a tool, so a link to a
// specific scenario can be built by a person or an AI assistant. The hash wins when both are set.
export function readHash<T extends Record<string, unknown>>(defaults: T): T {
  if (typeof location === 'undefined') return defaults;
  const params = new URLSearchParams(location.search);
  if (location.hash.length > 1) {
    for (const [k, v] of new URLSearchParams(location.hash.slice(1))) params.set(k, v);
  }
  const out: Record<string, unknown> = { ...defaults };
  for (const [k, def] of Object.entries(defaults)) {
    const raw = params.get(k);
    if (raw == null) continue;
    if (typeof def === 'number') {
      const n = Number(raw);
      if (Number.isFinite(n)) out[k] = n;
    } else if (typeof def === 'boolean') {
      out[k] = raw === '1' || raw === 'true' || raw === 'ja';
    } else {
      out[k] = raw;
    }
  }
  return out as T;
}

export function writeHash(values: Record<string, unknown>): void {
  if (typeof history === 'undefined') return;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) {
    params.set(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
  }
  // Drop the query string once its values are in the hash, so there's one source of truth.
  history.replaceState(null, '', `${location.pathname}#${params.toString()}`);
}

export async function copyLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(location.href);
    return true;
  } catch {
    return false;
  }
}

export const eur = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const eur2 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'percent', maximumFractionDigits: 2 }).format(n);
