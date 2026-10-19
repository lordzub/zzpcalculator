<script lang="ts">
  import { onMount } from 'svelte';
  import { getRules, YEARS } from '../rules';
  import { vergelijkBv, breakEvenWinst } from '../engine/bv';
  import { readHash, writeHash, eur, pct, copyLink } from './hashState';
  import Tape from './Tape.svelte';
  import { src } from './tape';

  const defaults = { jaar: 2026, winst: 120000, behoefte: 55000, extra: 2500, uitkeren: 'behoefte', jaren: 5 };
  let s = $state({ ...defaults });
  let ready = $state(false);
  let copied = $state(false);

  onMount(() => { s = readHash(defaults); ready = true; });
  $effect(() => { if (ready) writeHash({ ...s }); });

  const rules = $derived(getRules(s.jaar));
  const r = $derived(vergelijkBv({ winst: s.winst || 0, levensbehoefte: s.behoefte || 0, extraKostenBv: s.extra || 0, uitkeren: s.uitkeren as 'alles' | 'behoefte' }, rules));
  const be = $derived(breakEvenWinst(s.extra || 0, rules));
  const jaren = $derived(Math.max(1, Math.min(30, s.jaren || 1)));

  async function share() { copied = await copyLink(); setTimeout(() => (copied = false), 2000); }
</script>

<div class="tool">
  <div class="form">
    <div class="field">
      <label for="jaar">Jaar</label>
      <div class="input"><select id="jaar" bind:value={s.jaar}>{#each YEARS as y}<option value={y}>{y}</option>{/each}</select></div>
    </div>
    <div class="field">
      <label for="winst">Verwachte winst per jaar</label>
      <span class="hint">Omzet min kosten, vóór een eventueel DGA-salaris.</span>
      <div class="input"><span>€</span><input id="winst" type="number" inputmode="numeric" min="0" step="5000" bind:value={s.winst} /></div>
    </div>
    <div class="field">
      <label for="behoefte">Wat heb je netto nodig om van te leven, per jaar?</label>
      <div class="input"><span>€</span><input id="behoefte" type="number" inputmode="numeric" min="0" step="1000" bind:value={s.behoefte} /></div>
    </div>
    <div class="row two">
      <div class="field">
        <label for="extra">Extra kosten van een BV per jaar</label>
        <span class="hint">Accountant, jaarrekening, bank.</span>
        <div class="input"><span>€</span><input id="extra" type="number" inputmode="numeric" min="0" step="250" bind:value={s.extra} /></div>
      </div>
      <div class="field">
        <label for="jaren">Aantal jaren vooruit</label>
        <span class="hint">Voor het totaal dat in de BV blijft.</span>
        <div class="input"><input id="jaren" type="number" inputmode="numeric" min="1" max="30" step="1" bind:value={s.jaren} /><span>jaar</span></div>
      </div>
    </div>
    <div class="field">
      <span class="legend" id="uitk-l">Wat keer je uit de BV aan jezelf uit?</span>
      <div class="seg" role="group" aria-labelledby="uitk-l">
        <button type="button" aria-pressed={s.uitkeren === 'behoefte'} onclick={() => (s.uitkeren = 'behoefte')}>Alleen wat ik nodig heb</button>
        <button type="button" aria-pressed={s.uitkeren === 'alles'} onclick={() => (s.uitkeren = 'alles')}>Alles</button>
      </div>
    </div>

    <div class="scroll-x">
      <table class="cmp" aria-label="Vergelijking per jaar">
        <thead><tr><th></th><th>Eenmanszaak</th><th>BV</th></tr></thead>
        <tbody>
          <tr><td>Belasting en premies</td><td>{eur.format(r.eenmanszaak.belasting)}</td><td>{eur.format(r.bv.belasting)}</td></tr>
          <tr><td><strong>Netto in je zak</strong></td><td><strong>{eur.format(r.eenmanszaak.netto)}</strong></td><td><strong>{eur.format(r.bv.netto)}</strong></td></tr>
          <tr><td>Blijft in de BV</td><td>—</td><td>{eur.format(r.bv.inBv)}</td></tr>
          <tr><td>Blijft in de BV na {jaren} jaar</td><td>—</td><td>{eur.format(r.bv.inBv * jaren)}</td></tr>
        </tbody>
      </table>
    </div>
    <p class="hint">
      {#if be != null}
        Als je alles uitkeert, levert een BV in {s.jaar} netto meer op vanaf ongeveer <strong>{eur.format(be)}</strong> winst per jaar (met {eur.format(s.extra || 0)} extra BV-kosten).
      {:else}
        Als je alles uitkeert, levert een BV in {s.jaar} bij geen enkele winst tot €1 miljoen netto meer op.
      {/if}
      Geld dat in de BV blijft, is nog niet belast in box 2.
    </p>
  </div>

  <div class="result">
    <Tape
      title="BV: zo verdeel je de winst"
      year={r.year}
      lines={[
        { label: 'Winst vóór salaris', amount: s.winst || 0, op: '' },
        { label: 'Extra BV-kosten', amount: -(s.extra || 0), op: '−' },
        { label: 'DGA-salaris', amount: -r.bv.salaris, op: '−', note: r.bv.salarisOnderGebruikelijkLoon ? 'Lager dan gebruikelijk loon, omdat de winst te laag is' : `Gebruikelijk loon ${eur.format(rules.gebruikelijkLoon.value)}` },
        { label: 'Werkgeversheffing Zvw', amount: -r.bv.werkgeversheffingZvw, op: '−' },
        { label: 'Vennootschapsbelasting', amount: -r.bv.vpb, op: '−' },
        { label: 'Dividend aan jezelf', amount: r.bv.dividend, op: '' , strong: true },
        { label: 'Box 2-belasting', amount: -r.bv.box2, op: '−' },
        { label: 'Netto salaris', amount: r.bv.salaris - r.bv.loonheffing, op: '+' },
      ]}
      total={{ label: 'Netto via BV', amount: r.bv.netto, tone: s.uitkeren === 'alles' ? (r.verschilNetto >= 0 ? 'good' : 'bad') : 'neutral' }}
      sources={[
        src('Vpb', rules.vpb.value.map((b) => pct(b.rate)).join(' / '), rules.vpb),
        src('Box 2', rules.box2.value.map((b) => pct(b.rate)).join(' / '), rules.box2),
        src('Gebruikelijk loon', eur.format(rules.gebruikelijkLoon.value), rules.gebruikelijkLoon),
        src('Werkgeversheffing Zvw', pct(rules.zvwWerkgever.value.rate), rules.zvwWerkgever),
      ]}
    />
    <p class="hint" style="font-size:var(--step--1);color:var(--ink-soft)">
      {#if s.uitkeren === 'alles'}
        {r.verschilNetto >= 0 ? 'Met een BV' : 'Met een eenmanszaak'} houd je dit jaar {eur.format(Math.abs(r.verschilNetto))} meer over.
      {:else}
        Met een BV betaal je dit jaar {eur.format(Math.abs(r.verschilBelasting))} {r.verschilBelasting <= 0 ? 'minder' : 'meer'} belasting, en blijft {eur.format(r.bv.inBv)} in de BV. Keer je dat later uit, dan betaal je er nog box 2-belasting over.
      {/if}
      Uitgangspunten: je haalt het urencriterium, bent geen starter en de BV heeft één aandeelhouder.
    </p>
    <p><button class="btn" type="button" onclick={share}>{copied ? 'Link gekopieerd' : 'Kopieer link naar deze uitkomst'}</button></p>
  </div>
</div>
