import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import styles from '@/components/editorial-design.module.css'

/** Reading surface, distinct from clickable game cards and protected operator cards. */
export function ContentCard({ children, tone = 'article', className }: {
  children: ReactNode
  tone?: 'article' | 'guide'
  className?: string
}) {
  return <div data-content-card data-tone={tone} className={cn(styles.panel, className)}>{children}</div>
}
