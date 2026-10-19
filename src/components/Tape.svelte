<script lang="ts">
  import type { TapeLine, TapeSource } from './tape';

  let {
    title,
    lines,
    total,
    year,
    sources = [],
  }: {
    title: string;
    lines: TapeLine[];
    total?: { label: string; amount: number | string; tone?: 'good' | 'bad' | 'neutral' };
    year?: number;
    sources?: TapeSource[];
  } = $props();

  const eur = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const fmt = (v: number | string) => (typeof v === 'number' ? eur.format(Math.round(v)) : v);
</script>

<section class="tape" aria-label={title}>
  <header>
    <span class="title">{title}</span>
    {#if year}<span class="year">Belastingjaar {year}</span>{/if}
  </header>
  <ol class="lines">
    {#each lines as l}
      <li class:strong={l.strong}>
        <span class="op" aria-hidden="true">{l.op ?? ''}</span>
        <span class="label">{l.label}{#if l.note}<small>{l.note}</small>{/if}</span>
        <span class="amt">{fmt(l.amount)}</span>
      </li>
    {/each}
  </ol>
  {#if total}
    <div class="total {total.tone ?? 'neutral'}" aria-live="polite">
      <span class="label">{total.label}</span>
      <span class="amt">{fmt(total.amount)}</span>
    </div>
  {/if}
  {#if sources.length}
    <details class="src">
      <summary>Gebruikte regels en bronnen</summary>
      <ul>
        {#each sources as s}
          <li>
            <span>{s.label}: <strong>{s.value}</strong></span>
            <span class="status {s.status}">{s.status}</span>
            <a href={s.source} rel="noopener" target="_blank">bron</a>
            {#if s.note}<small class="note">{s.note}</small>{/if}
          </li>
        {/each}
      </ul>
    </details>
  {/if}
  <p class="disclaimer">Aan de uitkomsten kunnen geen rechten worden ontleend.</p>
</section>

<style>
  .tape {
    background: var(--sheet);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    font-family: var(--font-tape);
    font-size: 0.875rem;
    padding: 16px 18px 12px;
    position: relative;
    /* torn tape edge at the bottom */
    -webkit-mask: linear-gradient(#000 0 0) top / 100% calc(100% - 8px) no-repeat,
      conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 12px 8px repeat-x;
    mask: linear-gradient(#000 0 0) top / 100% calc(100% - 8px) no-repeat,
      conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 12px 8px repeat-x;
    padding-bottom: 22px;
  }
  header { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; border-bottom: 1px dashed var(--line); padding-bottom: 8px; margin-bottom: 8px; }
  .title { font-weight: 600; }
  .year { color: var(--ink-soft); }
  .lines { list-style: none; margin: 0; padding: 0; }
  .lines li { display: grid; grid-template-columns: 1.2em 1fr auto; gap: 8px; padding: 3px 0; align-items: baseline; }
  .lines li.strong { font-weight: 600; border-top: 1px solid var(--line); margin-top: 4px; padding-top: 6px; }
  .op { color: var(--ink-soft); text-align: center; }
  .label small { display: block; color: var(--ink-soft); font-size: 0.78rem; }
  .amt { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
  .total {
    display: flex; justify-content: space-between; gap: 12px; align-items: baseline;
    margin-top: 10px; padding: 10px 10px; border-top: 2px solid var(--ink);
    font-weight: 600; font-size: 1.05rem;
  }
  .total .amt { background: var(--mark); padding: 0 6px; border-radius: 2px; font-size: 1.25rem; }
  .total.good .amt { background: var(--good-soft); color: var(--good); }
  .total.bad .amt { background: var(--bad-soft); color: var(--bad); }
  .src { margin-top: 12px; font-family: var(--font); font-size: var(--step--1); }
  .src summary { cursor: pointer; color: var(--accent); }
  .src ul { list-style: none; padding: 0; margin: 8px 0 0; }
  .src li { display: flex; flex-wrap: wrap; gap: 4px 10px; padding: 4px 0; border-bottom: 1px dotted var(--line); }
  .status { font-size: 0.75rem; padding: 0 6px; border-radius: 10px; background: var(--accent-soft); color: var(--accent); }
  .status.voorlopig, .status.voorstel { background: var(--bad-soft); color: var(--bad); }
  .note { flex-basis: 100%; color: var(--ink-soft); }
  .disclaimer { font-family: var(--font); color: var(--ink-soft); font-size: 0.8rem; margin: 10px 0 0; }
</style>
