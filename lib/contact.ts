/** Uses the existing public address; opening a draft does not deliver mail. */
export function contactDraft(fields: { name: string; email: string; topic: string; message: string }): string {
  const body = `${fields.name}\n${fields.email}\n\n${fields.message}`
  return `mailto:hello@playliva.com?subject=${encodeURIComponent(fields.topic)}&body=${encodeURIComponent(body)}`
}
