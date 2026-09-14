import type { JsonLdObject } from '@/lib/structured-data'

/**
 * Renders a JSON-LD `<script>` tag for a single structured-data object.
 * Server-renderable — do not add 'use client' here.
 */
export function JsonLd({ data }: { data: JsonLdObject }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
