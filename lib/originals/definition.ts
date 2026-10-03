import type { ContentLocale } from '@/lib/types'
import type { DiscoveryCategorySlug } from '../types'

/** No registered games in M4. IDs are Originals IDs, never provider/operator game IDs. */
export interface OriginalGameDefinition {
  id: string
  slug: string
  title: Record<ContentLocale, string>
  category: DiscoveryCategorySlug
}
