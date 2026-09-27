import type {ReactNode} from 'react'
import styles from './owner.module.css'
export function Panel({ title, sub, children, action }: { title: string; sub?: string; children: ReactNode; action?: ReactNode }) { return <section className={styles.panel}><header className={styles.panelHeader}><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{action}</header>{children}</section> }
export function Table({ headings, children }: { headings: string[]; children: ReactNode }) { return <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={headings.join(', ')}><table><thead><tr>{headings.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div> }
export function Metric({ title, value, note }: { title: string; value: string; note: string }) { return <div className={styles.metric}><span>{title}</span><strong>{value}</strong><small>{note}</small></div> }
