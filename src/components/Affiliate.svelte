<script lang="ts">
  // Plain outbound affiliate link. Never put user inputs in href (AFM boundary).
  import { AFFILIATES } from '../site';
  let { kind, context }: { kind: keyof typeof AFFILIATES; context: string } = $props();
  const a = AFFILIATES[kind];
</script>

<aside class="aff" aria-label="Advertentie">
  <p>{context}</p>
  <a href={a.href} rel="sponsored nofollow noopener" target="_blank" data-pending={a.pending ? 'true' : undefined}>{a.text}</a>
  <small>Gesponsorde link. We krijgen mogelijk een vergoeding als je via deze link iets afsluit; je invoer wordt niet gedeeld.</small>
</aside>

<style>
  .aff { margin-top: 16px; padding: 12px 14px; border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: var(--radius); background: var(--sheet); font-size: var(--step--1); }
  .aff p { margin: 0 0 6px; }
  .aff a { font-weight: 700; }
  .aff small { display: block; color: var(--ink-soft); margin-top: 6px; }
</style>
