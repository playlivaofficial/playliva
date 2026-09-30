import type { GrowthData } from '@/lib/owner/server/overview'
import { Panel, Table } from './ui'
import { ActionForm } from './actions'
import styles from './owner.module.css'

export function SearchIntelligence({data}:{data:GrowthData}) {
  const info=data.search.data.intelligence
  if(!info)return null
  const {state}=info, pct=(n:number)=>(100*n).toFixed(2)+'%', winners=info.signals.filter(s=>s.kind==='winner')
  const hot=[...new Map([...info.signals.filter(s=>!s.query),...info.signals.filter(s=>!s.query&&s.kind==='winner')].map(s=>[s.page,s])).values()].slice(0,12)
  const affiliate=(page:string)=>data.analytics.data.events.filter(e=>e.event==='affiliate_click'&&e.route===new URL(page).pathname&&e.date.slice(0,10)>=info.from&&e.date.slice(0,10)<=info.to&&(!data.filters.geo||e.geo.toLowerCase()===data.filters.geo.toLowerCase())).reduce((n,e)=>n+e.count,0)
  return <>
    <Panel title="Daily Search Console evidence" sub="Verified property: sc-domain:playliva.com · read-only Google access · no media production">
      <p>Last successful sync: {state.lastSuccess??'Not yet synced'} · Newest final Google date: {state.newest??'Unavailable'} · {info.freshness}</p>
      <p>Scheduled daily at 09:17 UTC (Vercel may delay execution). Natural Google reporting lag is shown separately from stale syncs. Last evaluation: {state.lastEvaluation??'Not yet evaluated'}.</p>
      <p>Evidence rules below use separate 7 / 14 / 28-day windows ending on {state.newest??'the newest available day'}. Market: {data.filters.geo||'BR'}; language: {data.filters.locale||'pt-br'}. These are independent filters.</p>
      <form method="get" className={styles.filters}><input type="hidden" name="period" value={data.filters.period}/>{(['from','to','route','game','device'] as const).map(key=><input key={key} type="hidden" name={key} value={data.filters[key]}/>)}<label>SEO country<select name="geo" defaultValue={data.filters.geo||'br'}><option value="br">Brazil</option><option value="mx">Mexico</option><option value="us">United States</option><option value="">All countries (totals only; intelligence stays Brazil)</option></select></label><label>SEO language<select name="locale" defaultValue={data.filters.locale}><option value="pt-br">PT-BR</option><option value="en">EN</option><option value="es-mx">ES-MX</option><option value="">All languages (intelligence stays PT-BR)</option></select></label><button type="submit">Apply market</button></form>
      {info.runs.slice(0,3).map(r=><p key={r.day}>{r.day}: {r.status} · {r.rows??'—'} normalized rows {r.error??''}</p>)}
    </Panel>
    <Panel title="SEO Autopilot" sub="One title variable on eligible PT-BR game-information pages. No game, affiliate, GEO, video, page-creation or body-content changes.">
      <p><strong>{state.enabled?'Enabled':'Disabled'}</strong> · At most one active experiment. Requires ≥1,000 impressions in both 28-day periods, ≥20 prior clicks, ≥21 observed days per period, sustained CTR decline, and stable rank. Current evidence may correctly produce no edits.</p>
      <ActionForm endpoint="/api/owner/seo/control"><input type="hidden" name="enabled" value={state.enabled?'no':'yes'}/><button type="submit">{state.enabled?'Disable and restore experiment titles':'Enable conservative SEO Autopilot'}</button></ActionForm>
      <p>Measurement: 7 / 14 / 28 days. Sustained negative evidence at 7 and 14 days restores the previous title. Inconclusive 28-day outcomes also restore it. Page cooldown: 90 days. Google outages freeze decisions.</p>
      {state.experiments.length?<Table headings={['Page / experiment','Change','Status / measurement','Evidence']} >{state.experiments.slice(-20).reverse().map(e=><tr key={e.id}><td>{new URL(e.page).pathname}<small>{e.id} · {e.startedAt}</small></td><td>{e.previous}<small>→ {e.next}</small></td><td>{e.status}<small>{e.measurements.map(m=>`${m.window}D: ${m.verdict}`).join(' · ')||'Waiting for full post-change data'}</small></td><td>{e.reason}<small>Baseline {e.baseline.from}–{e.baseline.to}; {e.baseline.measure.impressions} impressions</small></td></tr>)}</Table>:<p>No experiments. No SEO lift is claimed.</p>}
      <details><summary>Recent autonomous audit</summary>{state.audit.slice(-20).reverse().map((e,i)=><p key={i}>{e.at} · {e.action} · {e.page??'Control'} · {e.reason}</p>)}</details>
    </Panel>
    <Panel title="What should I promote today?" sub="Data only. No uploads, generation or queues. Ranked by observed impressions, not a blended performance score.">
      <p>{winners.length} evidence-qualified page/query winners. Winner requires sustained growth in both 7D and 14D with meaningful clicks, impressions and stable CTR/rank.</p>
      {hot.length?<Table headings={['Page / family','Evidence','28D / previous 28D','Affiliate clicks']} >{hot.map(s=><tr key={s.page+s.kind}><td>{new URL(s.page).pathname}<small>{new URL(s.page).pathname.split('/')[2]}</small></td><td>{s.kind}: {s.reason}<small>{s.action}</small></td><td>{s.windows[2].current.clicks} / {s.windows[2].previous.clicks} clicks; {s.windows[2].current.impressions} / {s.windows[2].previous.impressions} impressions<small>{pct(s.windows[2].current.ctr)} CTR · position {s.windows[2].current.position.toFixed(1)}</small></td><td>{data.measured?affiliate(s.page):'Unavailable'}<small>Consented events in {info.from}–{info.to}; not revenue or a Search Console metric</small></td></tr>)}</Table>:<p>No pages meet the evidence threshold yet. The top landing-page table remains available for review; low volume is not labeled a winner.</p>}
    </Panel>
    <Panel title="Country and device context"><div className={styles.twoColumns}>{(['countries','devices'] as const).map(key=><Table key={key} headings={[key,'Clicks','Impressions']}>{info[key].map(row=><tr key={row.name}><td>{row.name}</td><td>{row.clicks}</td><td>{row.impressions}</td></tr>)}</Table>)}</div></Panel>
    <Panel title="Measured page and query trends" sub="Comparable observed rows only. Missing query data may be anonymized; it is never treated as zero.">
      {info.signals.length?<Table headings={['Page / query','Signal and reason','7D · 14D · 28D comparisons','Next action']}>{info.signals.map(s=><tr key={s.page+s.query+s.kind}><td>{new URL(s.page).pathname}<small>{s.query||'All reported queries for this page'}</small></td><td>{s.kind}<small>{s.reason}</small><small>{s.country} · {s.from}–{s.to}</small></td><td>{s.windows.map(w=><small key={w.days}>{w.days}D: {w.current.clicks}/{w.previous.clicks} clicks · {w.current.impressions}/{w.previous.impressions} impressions · {pct(w.current.ctr)}/{pct(w.previous.ctr)} CTR · rank {w.current.position.toFixed(1)}/{w.previous.position.toFixed(1)}</small>)}</td><td>{s.action}</td></tr>)}</Table>:<p>No high-confidence trends yet. Collecting real daily evidence.</p>}
    </Panel>
  </>
}
