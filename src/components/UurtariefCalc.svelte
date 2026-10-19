<script lang="ts">
  import { onMount } from 'svelte';
  import { getRules, YEARS } from '../rules';
  import { berekenUurtarief } from '../engine/uurtarief';
  import { nettoEenmanszaak } from '../engine/netto';
  import { readHash, writeHash, eur, eur2, copyLink } from './hashState';
  import Tape from './Tape.svelte';
  import { src } from './tape';
  import Affiliate from './Affiliate.svelte';

  const defaults = { jaar: 2027, netto: 3500, uren: 28, vakantie: 8, kosten: 6000, pensioen: 400, aov: 250, starter: false, totaal: 1400 };
  let s = $state({ ...defaults });
  let ready = $state(false);
  let copied = $state(false);

  onMount(() => { s = readHash(defaults); ready = true; });
  $effect(() => { if (ready) writeHash({ ...s }); });

  const rules = $derived(getRules(s.jaar));
  const res = $derived.by(() => {
    try {
      const r = berekenUurtarief({
        nettoPerMaand: s.netto || 0, declarabeleUrenPerWeek: s.uren || 0, vakantieWeken: s.vakantie || 0,
        kostenPerJaar: s.kosten || 0, pensioenPerMaand: s.pensioen || 0, aovPerMaand: s.aov || 0,
        starter: s.starter, totaleUrenPerJaar: s.totaal || 0,
      }, rules);
      const n = nettoEenmanszaak({ omzet: r.benodigdeOmzet, kosten: s.kosten || 0, uren: s.totaal || 0, starter: s.starter }, rules);
      return { ok: true as const, r, n };
    } catch (e) {
      return { ok: false as const, msg: (e as Error).message };
    }
  });
  const drempel = $derived(rules.rechtsvermoedenDrempel.value);

  async function share() { copied = await copyLink(); setTimeout(() => (copied = false), 2000); }
</script>

<div class="tool">
  <div class="form">
    <div class="field">
      <label for="jaar">Jaar</label>
      <div class="input"><select id="jaar" bind:value={s.jaar}>{#each YEARS as y}<option value={y}>{y}</option>{/each}</select></div>
    </div>
    <div class="field">
      <label for="netto">Gewenst netto inkomen per maand</label>
      <div class="input"><span>€</span><input id="netto" type="number" inputmode="numeric" min="0" step="100" bind:value={s.netto} /></div>
    </div>
    <div class="row two">
      <div class="field">
        <label for="uren">Declarabele uren per week</label>
        <div class="input"><input id="uren" type="number" inputmode="numeric" min="1" max="80" step="1" bind:value={s.uren} /><span>uur</span></div>
      </div>
      <div class="field">
        <label for="vakantie">Weken zonder omzet</label>
        <span class="hint">Vakantie, ziekte, feestdagen.</span>
        <div class="input"><input id="vakantie" type="number" inputmode="numeric" min="0" max="51" step="1" bind:value={s.vakantie} /><span>weken</span></div>
      </div>
    </div>
    <div class="field">
      <label for="kosten">Zakelijke kosten per jaar</label>
      <div class="input"><span>€</span><input id="kosten" type="number" inputmode="numeric" min="0" step="500" bind:value={s.kosten} /></div>
    </div>
    <div class="row two">
      <div class="field">
        <label for="pensioen">Pensioen per maand</label>
        <div class="input"><span>€</span><input id="pensioen" type="number" inputmode="numeric" min="0" step="50" bind:value={s.pensioen} /></div>
      </div>
      <div class="field">
        <label for="aov">AOV-premie per maand</label>
        <div class="input"><span>€</span><input id="aov" type="number" inputmode="numeric" min="0" step="25" bind:value={s.aov} /></div>
      </div>
    </div>
    <div class="field">
      <label for="totaal">Totaal uren aan je bedrijf per jaar</label>
      <span class="hint">Declarabel plus administratie en acquisitie. Telt voor het urencriterium ({rules.urencriterium.value.toLocaleString('nl-NL')} uur).</span>
      <div class="input"><input id="totaal" type="number" inputmode="numeric" min="0" step="50" bind:value={s.totaal} /><span>uur</span></div>
    </div>
    <label class="check"><input type="checkbox" bind:checked={s.starter} /> <span>Ik heb recht op de startersaftrek</span></label>
  </div>

  <div class="result">
    {#if !res.ok}
      <p class="error">{res.msg}. Controleer je uren en weken.</p>
    {:else}
      {@const r = res.r}
      {@const under = drempel != null && r.uurtarief < drempel}
      <div class="verdict {under ? 'bad' : 'neutral'}" aria-live="polite">
        <strong class="big">Minimaal {eur2.format(r.uurtarief)} per uur</strong>
        <p>Over {r.declarabeleUren.toLocaleString('nl-NL')} declarabele uren in {r.year}.</p>
        {#if under}
          <p>Dit tarief ligt onder de grens van {eur2.format(drempel!)} voor het <a href="/rechtsvermoeden-check">rechtsvermoeden</a>. Opdrachtgevers kunnen dan aarzelen.</p>
        {/if}
      </div>
      <Tape
        title="Zo kom je eraan"
        year={r.year}
        lines={[
          { label: 'Benodigde omzet', amount: r.benodigdeOmzet, op: '' },
          { label: 'Zakelijke kosten', amount: -(s.kosten || 0), op: '−' },
          { label: 'Belasting en premies', amount: -res.n.totaalBelasting, op: '−', note: r.urencriteriumGehaald ? undefined : 'Zonder zelfstandigenaftrek: urencriterium niet gehaald' },
          { label: 'Netto per jaar', amount: res.n.netto, op: '=', strong: true },
          { label: 'Pensioen en AOV', amount: -((s.pensioen || 0) + (s.aov || 0)) * 12, op: '−' },
        ]}
        total={{ label: 'Vrij besteedbaar per maand', amount: (res.n.netto - ((s.pensioen || 0) + (s.aov || 0)) * 12) / 12 }}
        sources={[
          src('Zelfstandigenaftrek', eur.format(rules.zelfstandigenaftrek.value), rules.zelfstandigenaftrek),
          src('Tariefgrens rechtsvermoeden', drempel != null ? eur2.format(drempel) : 'n.v.t.', rules.rechtsvermoedenDrempel),
        ]}
      />
      <p class="hint" style="font-size:var(--step--1);color:var(--ink-soft)">Pensioen en AOV rekenen we als uitgaven uit je netto inkomen. In werkelijkheid zijn ze vaak (deels) aftrekbaar, dus dit tarief is iets aan de veilige kant.</p>
      <p><button class="btn" type="button" onclick={share}>{copied ? 'Link gekopieerd' : 'Kopieer link naar deze uitkomst'}</button></p>
      <Affiliate kind="verzekering" context="Nog geen AOV of aansprakelijkheidsverzekering? Vergelijk premies voordat je je tarief vastzet." />
    {/if}
  </div>
</div>
