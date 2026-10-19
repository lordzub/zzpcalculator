<script lang="ts">
  import { onMount } from 'svelte';
  import { getRules, YEARS } from '../rules';
  import { checkTarief, parseBulk } from '../engine/rechtsvermoeden';
  import { readHash, writeHash, eur2, copyLink } from './hashState';
  import Affiliate from './Affiliate.svelte';

  const defaults = { jaar: 2027, modus: 'uur', tarief: 45, bedrag: 6000, uren: 160 };
  let s = $state({ ...defaults });
  let view = $state<'een' | 'lijst'>('een');
  let bulkText = $state('Opdracht A; 35\nOpdracht B; 42,50\nOpdracht C; 39');
  let copied = $state(false);
  let ready = $state(false);

  onMount(() => { s = readHash(defaults); ready = true; });
  $effect(() => { if (ready) writeHash({ ...s }); });

  const jaren = YEARS.filter((y) => y >= 2026);
  const rules = $derived(getRules(s.jaar));
  const drempelSrc = $derived(rules.rechtsvermoedenDrempel);

  const result = $derived.by(() => {
    try {
      return {
        ok: true as const,
        r: checkTarief(
          s.modus === 'uur'
            ? { mode: 'uurtarief', uurtarief: s.tarief }
            : { mode: 'vast', bedrag: s.bedrag, uren: s.uren },
          rules,
        ),
      };
    } catch (e) {
      return { ok: false as const, msg: (e as Error).message };
    }
  });

  const bulk = $derived(
    parseBulk(bulkText).map((row) => ({
      ...row,
      r: checkTarief({ mode: 'uurtarief', uurtarief: row.tarief }, rules),
    })),
  );

  async function share() { copied = await copyLink(); setTimeout(() => (copied = false), 2000); }
</script>

<div class="tool">
  <div class="form">
    <div class="field">
      <span class="legend" id="view-l">Wat wil je controleren?</span>
      <div class="seg" role="group" aria-labelledby="view-l">
        <button type="button" aria-pressed={view === 'een'} onclick={() => (view = 'een')}>Eén opdracht</button>
        <button type="button" aria-pressed={view === 'lijst'} onclick={() => (view = 'lijst')}>Lijst tarieven</button>
      </div>
    </div>

    <div class="field">
      <label for="jaar">Jaar</label>
      <div class="input">
        <select id="jaar" bind:value={s.jaar}>
          {#each jaren as y}<option value={y}>{y}</option>{/each}
        </select>
      </div>
    </div>

    {#if view === 'een'}
      <div class="field">
        <span class="legend" id="modus-l">Hoe word je betaald?</span>
        <div class="seg" role="group" aria-labelledby="modus-l">
          <button type="button" aria-pressed={s.modus === 'uur'} onclick={() => (s.modus = 'uur')}>Per uur</button>
          <button type="button" aria-pressed={s.modus === 'vast'} onclick={() => (s.modus = 'vast')}>Vaste prijs</button>
        </div>
      </div>

      {#if s.modus === 'uur'}
        <div class="field">
          <label for="tarief">Uurtarief (excl. btw)</label>
          <div class="input"><span>€</span><input id="tarief" type="number" inputmode="decimal" min="0" step="0.5" bind:value={s.tarief} /></div>
        </div>
      {:else}
        <div class="row two">
          <div class="field">
            <label for="bedrag">Vaste prijs (excl. btw)</label>
            <div class="input"><span>€</span><input id="bedrag" type="number" inputmode="decimal" min="0" step="50" bind:value={s.bedrag} /></div>
          </div>
          <div class="field">
            <label for="uren">Verwachte uren</label>
            <div class="input"><input id="uren" type="number" inputmode="numeric" min="1" step="1" bind:value={s.uren} /><span>uur</span></div>
          </div>
        </div>
      {/if}
    {:else}
      <div class="field">
        <label for="bulk">Plak je tarieven, één per regel</label>
        <span class="hint" id="bulk-h">Bijvoorbeeld <code>Naam; 42,50</code> of alleen een getal. Je kunt ook kolommen uit Excel plakken.</span>
        <textarea id="bulk" rows="7" aria-describedby="bulk-h" bind:value={bulkText}></textarea>
      </div>
    {/if}
  </div>

  <div class="result">
    {#if view === 'een'}
      {#if !result.ok}
        <p class="error">{result.msg}</p>
      {:else if !result.r.inWerking}
        <div class="verdict neutral"><strong class="big">In {s.jaar} geldt nog geen tariefgrens.</strong></div>
      {:else}
        {@const r = result.r}
        <div class="verdict {r.onderDrempel ? 'bad' : 'good'}" aria-live="polite">
          <strong class="big">{r.onderDrempel ? 'Op of onder de grens' : 'Boven de grens'}</strong>
          <p>Je effectieve uurtarief is <strong>{eur2.format(r.effectiefTarief)}</strong>. De grens in {r.year} is {eur2.format(r.drempel!)}.</p>
          {#if r.margeEuro !== 0}<p>Je zit {eur2.format(Math.abs(r.margeEuro!))} ({Math.abs(r.margeProcent!).toLocaleString('nl-NL')}%) {r.onderDrempel ? 'eronder' : 'erboven'}.</p>{:else}<p>Je zit precies op de grens; die telt mee.</p>{/if}
        </div>
        {#if r.onderDrempel}
          <div class="next-step">
            <p><strong>Wat betekent dit?</strong> Onder de grens wordt aangenomen dat je in loondienst werkt, tenzij jij of je opdrachtgever aantoont dat dat niet zo is. Lees hieronder wat je kunt doen.</p>
          </div>
        {:else}
          <div class="next-step">
            <p><strong>Wat betekent dit?</strong> Het rechtsvermoeden geldt niet voor dit tarief. Of je echt als zelfstandige werkt, hangt nog steeds af van hoe de opdracht is ingericht.</p>
          </div>
        {/if}
      {/if}
    {:else}
      <div class="form">
        <p><strong>{bulk.filter((b) => b.r.onderDrempel).length} van {bulk.length}</strong> tarieven liggen op of onder de grens van {rules.rechtsvermoedenDrempel.value != null ? eur2.format(rules.rechtsvermoedenDrempel.value) : '—'}.</p>
        <div class="scroll-x">
          <table class="cmp">
            <thead><tr><th>Opdracht</th><th>Tarief</th><th>Verschil</th></tr></thead>
            <tbody>
              {#each bulk as b}
                <tr>
                  <td>{b.label}</td>
                  <td>{eur2.format(b.tarief)}</td>
                  <td style:color={b.r.onderDrempel ? 'var(--bad)' : 'var(--good)'}>{b.r.margeEuro != null ? (b.r.margeEuro >= 0 ? '+' : '−') + eur2.format(Math.abs(b.r.margeEuro)) : '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <p class="src-line">
      Grens {s.jaar}: {drempelSrc.value != null ? eur2.format(drempelSrc.value) : 'n.v.t.'} ({drempelSrc.status}).
      <a href={drempelSrc.source} target="_blank" rel="noopener">Bron</a>.
      {#if drempelSrc.note}<br /><small>{drempelSrc.note}</small>{/if}
    </p>
    {#if view === 'een'}
      <button class="btn" type="button" onclick={share}>{copied ? 'Link gekopieerd' : 'Kopieer link naar deze uitkomst'}</button>
    {/if}
    <p class="disclaimer">Aan de uitkomsten kunnen geen rechten worden ontleend.</p>
    <Affiliate kind="verzekering" context="Werk je als zelfstandige? Check of je aansprakelijkheid en arbeidsongeschiktheid goed geregeld zijn." />
  </div>
</div>

<style>
  .next-step { font-size: var(--step--1); margin-bottom: 12px; }
  .next-step p { margin: 0; }
  .src-line { font-size: var(--step--1); color: var(--ink-soft); }
  .disclaimer { font-size: 0.8rem; color: var(--ink-soft); }
</style>
