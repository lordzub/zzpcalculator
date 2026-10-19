<script lang="ts">
  import { onMount } from 'svelte';
  import { getRules, YEARS } from '../rules';
  import { nettoEenmanszaak, type NettoResult } from '../engine/netto';
  import { readHash, writeHash, eur, pct, copyLink } from './hashState';
  import Tape from './Tape.svelte';
  import { src } from './tape';
  import Affiliate from './Affiliate.svelte';
  import type { TapeSource } from './tape';

  let { focus = 'netto' }: { focus?: 'netto' | 'aftrek' } = $props();

  const defaults = { omzet: 80000, kosten: 8000, uren: 1400, starter: false, jaar: 2027 };
  let s = $state({ ...defaults });
  let ready = $state(false);
  let copied = $state(false);

  onMount(() => { s = readHash(defaults); ready = true; });
  $effect(() => { if (ready) writeHash({ ...s }); });

  const results = $derived.by(() => {
    const out: { year: number; r: NettoResult }[] = [];
    for (const y of YEARS) {
      out.push({ year: y, r: nettoEenmanszaak({ omzet: s.omzet || 0, kosten: s.kosten || 0, uren: s.uren || 0, starter: s.starter }, getRules(y)) });
    }
    return out;
  });
  const sel = $derived(results.find((x) => x.year === s.jaar) ?? results[results.length - 1]);
  const rules = $derived(getRules(sel.year));
  const first = $derived(results[0]);
  const last = $derived(results[results.length - 1]);

  const lines = $derived.by(() => {
    const r = sel.r;
    const l = [
      { label: 'Winst (omzet − kosten)', amount: r.winst, op: '' as const },
      { label: 'Zelfstandigenaftrek', amount: -r.zelfstandigenaftrek, op: '−' as const, note: r.urencriteriumGehaald ? undefined : 'Urencriterium niet gehaald' },
    ];
    if (r.startersaftrek) l.push({ label: 'Startersaftrek', amount: -r.startersaftrek, op: '−' as const, note: undefined });
    l.push(
      { label: `MKB-winstvrijstelling (${pct(rules.mkbWinstvrijstelling.value)})`, amount: -r.mkbVrijstelling, op: '−' as const, note: undefined },
    );
    return [
      ...l,
      { label: 'Belastbare winst', amount: r.belastbareWinst, op: '=' as const, strong: true },
      { label: 'Inkomstenbelasting box 1', amount: r.inkomstenbelastingBruto, op: '' as const, note: r.tariefcorrectie ? `Incl. tariefcorrectie ${eur.format(r.tariefcorrectie)}` : undefined },
      { label: 'Algemene heffingskorting', amount: -r.algemeneHeffingskorting, op: '−' as const },
      { label: 'Arbeidskorting', amount: -r.arbeidskorting, op: '−' as const },
      { label: 'Te betalen inkomstenbelasting', amount: r.inkomstenbelasting, op: '=' as const, strong: true },
      { label: 'Bijdrage Zvw', amount: r.zvw, op: '+' as const },
      { label: 'Totaal belasting en premies', amount: r.totaalBelasting, op: '=' as const, strong: true },
    ];
  });

  const sources = $derived<TapeSource[]>([
    src('Zelfstandigenaftrek', eur.format(rules.zelfstandigenaftrek.value), rules.zelfstandigenaftrek),
    ...(s.starter ? [src('Startersaftrek', eur.format(rules.startersaftrek.value), rules.startersaftrek)] : []),
    src('Urencriterium', `${rules.urencriterium.value} uur`, rules.urencriterium),
    src('MKB-winstvrijstelling', pct(rules.mkbWinstvrijstelling.value), rules.mkbWinstvrijstelling),
    src('Tarieven box 1', rules.box1Brackets.value.map((b) => pct(b.rate)).join(' / '), rules.box1Brackets),
    src('Algemene heffingskorting', `max. ${eur.format(rules.algemeneHeffingskorting.value[0].base)}`, rules.algemeneHeffingskorting),
    src('Arbeidskorting', `max. ${eur.format(rules.arbeidskorting.value[rules.arbeidskorting.value.length - 1].base)}`, rules.arbeidskorting),
    src('Bijdrage Zvw', `${pct(rules.zvwOndernemer.value.rate)} tot ${eur.format(rules.zvwOndernemer.value.maxIncome)}`, rules.zvwOndernemer),
  ]);

  async function share() { copied = await copyLink(); setTimeout(() => (copied = false), 2000); }
</script>

<div class="tool">
  <div class="form">
    <div class="row two">
      <div class="field">
        <label for="omzet">Omzet per jaar (excl. btw)</label>
        <div class="input"><span>€</span><input id="omzet" type="number" inputmode="numeric" min="0" step="1000" bind:value={s.omzet} /></div>
      </div>
      <div class="field">
        <label for="kosten">Zakelijke kosten per jaar</label>
        <div class="input"><span>€</span><input id="kosten" type="number" inputmode="numeric" min="0" step="500" bind:value={s.kosten} /></div>
      </div>
    </div>
    <div class="field">
      <label for="uren">Uren aan je bedrijf per jaar</label>
      <span class="hint" id="uren-h">Alle uren, ook administratie en acquisitie. Vanaf {getRules(s.jaar).urencriterium.value} uur heb je recht op de zelfstandigenaftrek.</span>
      <div class="input"><input id="uren" type="number" inputmode="numeric" min="0" step="50" aria-describedby="uren-h" bind:value={s.uren} /><span>uur</span></div>
    </div>
    <label class="check"><input type="checkbox" bind:checked={s.starter} /> <span>Ik ben starter en heb recht op de startersaftrek<br /><span class="hint">Maximaal 3 keer in de eerste 5 jaar.</span></span></label>

    <div class="scroll-x">
      <table class="cmp" aria-label="Netto inkomen per jaar">
        <thead><tr><th></th>{#each results as x}<th>{x.year}{getRules(x.year).zelfstandigenaftrek.status !== 'definitief' ? '*' : ''}</th>{/each}</tr></thead>
        <tbody>
          <tr><td>Zelfstandigenaftrek</td>{#each results as x}<td>{eur.format(x.r.zelfstandigenaftrek)}</td>{/each}</tr>
          <tr><td>Belasting en premies</td>{#each results as x}<td>{eur.format(x.r.totaalBelasting)}</td>{/each}</tr>
          <tr><td><strong>Netto per jaar</strong></td>{#each results as x}<td><strong>{eur.format(x.r.netto)}</strong></td>{/each}</tr>
          <tr><td>Netto per maand</td>{#each results as x}<td>{eur.format(x.r.nettoPerMaand)}</td>{/each}</tr>
        </tbody>
      </table>
    </div>
    <p class="hint">
      {#if last.r.netto < first.r.netto}
        In {last.year} houd je {eur.format(first.r.netto - last.r.netto)} per jaar minder over dan in {first.year}{focus === 'aftrek' ? ', vooral door de lagere zelfstandigenaftrek' : ''}.
      {:else}
        In {last.year} houd je {eur.format(last.r.netto - first.r.netto)} per jaar meer over dan in {first.year}.
      {/if}
      * bevat voorlopige cijfers.
    </p>
  </div>

  <div class="result">
    <div class="field" style="margin-bottom:10px">
      <span class="legend" id="jaar-l">Berekening tonen voor</span>
      <div class="seg" role="group" aria-labelledby="jaar-l">
        {#each YEARS as y}<button type="button" aria-pressed={s.jaar === y} onclick={() => (s.jaar = y)}>{y}</button>{/each}
      </div>
    </div>
    <Tape title="Jouw berekening" year={sel.year} {lines} total={{ label: 'Netto per jaar', amount: sel.r.netto }} {sources} />
    <p><button class="btn" type="button" onclick={share}>{copied ? 'Link gekopieerd' : 'Kopieer link naar deze uitkomst'}</button></p>
    <Affiliate kind="boekhouding" context="Houd je uren en kosten bij voor het urencriterium en je aangifte." />
  </div>
</div>
