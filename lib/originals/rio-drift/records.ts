import type { DriftRun } from './engine'
import { scoreFor } from './engine'
export const DRIFT_RECORD_KEY = 'playliva.originals.rio-drift.records'
export interface DriftRecord { version: 1; score: number; combo: number; distance: number; runs: number; lastRun: string }
export interface RecordStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export const emptyRecord = (): DriftRecord => ({ version: 1, score: 0, combo: 1, distance: 0, runs: 0, lastRun: '' })
export function readRecord(storage: RecordStorage | null): DriftRecord {
  try {
    const raw = storage?.getItem(DRIFT_RECORD_KEY); if (!raw || raw.length > 500) return emptyRecord()
    const r = JSON.parse(raw)
    if (r.version !== 1 || !['score', 'combo', 'distance', 'runs'].every(k => Number.isSafeInteger(r[k]) && r[k] >= 0 && r[k] <= 100000000) || r.combo < 1 || r.combo > 5 || typeof r.lastRun !== 'string' || !/^[a-z0-9-]{0,80}$/i.test(r.lastRun)) return emptyRecord()
    return { version: 1, score: r.score, combo: r.combo, distance: r.distance, runs: r.runs, lastRun: r.lastRun }
  } catch { return emptyRecord() }
}
/** Called once per settled run. Reloaded/abandoned runs never submit a score. Local best, no leaderboard. */
export function saveRecord(previous: DriftRecord, run: DriftRun, storage: RecordStorage | null) {
  if (run.phase !== 'result' || !run.id) return { record: previous, best: false, saved: true }
  const existing = readRecord(storage), best = scoreFor(run) > Math.max(previous.score, existing.score)
  if (previous.lastRun === run.id || existing.lastRun === run.id) return { record: previous.score >= existing.score ? previous : existing, best: false, saved: Boolean(storage) }
  const record: DriftRecord = { version: 1, score: Math.max(previous.score, existing.score, scoreFor(run)), combo: Math.max(previous.combo, existing.combo, run.bestCombo),
    distance: Math.min(100000000, Math.max(previous.distance, existing.distance, Math.floor(run.distance))), runs: Math.min(100000000, Math.max(previous.runs, existing.runs) + 1), lastRun: run.id }
  try { storage?.setItem(DRIFT_RECORD_KEY, JSON.stringify(record)); return { record, best, saved: Boolean(storage) } }
  catch { return { record, best, saved: false } }
}

export function createDriftRecordStore(factory: () => RecordStorage | null) {
  const server = { record: emptyRecord(), saved: true }
  let snapshot = server, storage: RecordStorage | null = null, hydrated = false
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach(listener => listener())
  function hydrate() {
    if (hydrated) return
    hydrated = true
    try { storage = factory() } catch { storage = null }
    snapshot = { record: readRecord(storage), saved: Boolean(storage) }; emit()
  }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => server,
    subscribe(listener: () => void) { listeners.add(listener); hydrate(); return () => { listeners.delete(listener) } },
    complete(run: DriftRun) { hydrate(); const result = saveRecord(snapshot.record, run, storage); snapshot = { record: result.record, saved: result.saved }; emit(); return result },
  }
}
