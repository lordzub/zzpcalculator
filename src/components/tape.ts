import type { Status } from '../engine/types';

export interface TapeLine {
  label: string;
  amount: number | string;
  op?: '+' | '−' | '=' | '';
  strong?: boolean;
  note?: string;
}

export interface TapeSource {
  label: string;
  value: string;
  status: Status;
  source: string;
  note?: string;
}

import type { Sourced } from '../engine/types';

/** Build a tape source line from a rules entry. */
export function src<T>(label: string, value: string, r: Sourced<T>): TapeSource {
  return { label, value, status: r.status, source: r.source, note: r.note };
}
