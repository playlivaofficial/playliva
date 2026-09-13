import type { Game } from './types'

/**
 * Canonical, statically-approved artwork for games with a rights-cleared
 * asset on file. This literal is the single source of truth for exactly
 * which games render real artwork and what file/alt text they use —
 * defined directly here as a plain object, not derived from `game.image`
 * or any other field on a `Game` record.
 *
 * Why this exists (and isn't just `game.image` + `game.assetStatus`):
 * a module-level `const` object literal is evaluated once when this file
 * is loaded and is byte-for-byte identical in the server bundle and the
 * client bundle — there is no way for the server's copy and the client's
 * copy to disagree, because there is only one place this data is written.
 * Keying it by `game.id` (rather than reading `game.image` off whatever
 * `Game` object happens to be passed in) also means the lookup can never
 * be affected by a stale or partially-hydrated `game` prop.
 *
 * To approve a new game's artwork: add its id here AND flip its
 * `assetStatus`/`assetRightsStatus` in `lib/data.ts` to `approved`. Both
 * are required — see `hasApprovedArtwork` below.
 */
const APPROVED_ARTWORK: Record<string, { src: string; alt: string }> = {
  g1: { src: '/games/aviator.png', alt: 'Aviator by Spribe' },
  g2: { src: '/games/jetx.png', alt: 'JetX by SmartSoft' },
  g3: { src: '/games/spaceman.webp', alt: 'Spaceman by Pragmatic Play' },
  g4: { src: '/games/mines.jpeg', alt: 'Mines by Spribe' },
  g5: { src: '/games/gates-of-olympus.png', alt: 'Gates of Olympus by Pragmatic Play' },
  g6: { src: '/games/sweet-bonanza.png', alt: 'Sweet Bonanza by Pragmatic Play' },
  g7: { src: '/games/lightning-roulette.jpg', alt: 'Lightning Roulette by Evolution' },
  g8: { src: '/games/crazy-time.webp', alt: 'Crazy Time by Evolution' },
  g10: { src: '/games/plinko.jpeg', alt: 'Plinko by Spribe' },
  g11: { src: '/games/big-bass.png', alt: 'Big Bass Bonanza by Pragmatic Play' },
  g12: { src: '/games/blackjack-live.webp', alt: 'Blackjack Live by Evolution' },
}

/**
 * Returns the static, approved artwork record for a game, or `null` when
 * the game has none. Does not perform the rights/status check on its own
 * — use `hasApprovedArtwork` to decide whether it's safe to render.
 */
export function getApprovedArtwork(
  game: Game,
): { src: string; alt: string } | null {
  return APPROVED_ARTWORK[game.id] ?? null
}

/**
 * Single source of truth for whether a game's real artwork is safe to
 * publish — used by `<GameArtwork>` for on-page rendering AND by page
 * metadata for Open Graph / Twitter card images, so a fake or unapproved
 * asset can never leak into a link preview even if it never renders in
 * the UI itself.
 *
 * Real artwork requires ALL of:
 *   - the game's id is present in the static `APPROVED_ARTWORK` map above
 *   - an `image` path is set on the game record
 *   - `assetStatus` is `official` or `approved` (never `pending`/`placeholder`)
 *   - `assetRightsStatus` is `approved` (never `permission-required`/`unknown`)
 *
 * Every input here is static project data imported identically by the
 * server and the client — there is no `window`/`document` check, no
 * localStorage, no runtime image probing, and no mutable module state, so
 * this always evaluates the same way on the server render and the first
 * client render.
 */
export function hasApprovedArtwork(game: Game): boolean {
  return (
    APPROVED_ARTWORK[game.id] !== undefined &&
    Boolean(game.image) &&
    (game.assetStatus === 'official' || game.assetStatus === 'approved') &&
    game.assetRightsStatus === 'approved'
  )
}

/**
 * Per-game Open Graph / Twitter image list. Returns `undefined` (never a
 * fallback image) when the game has no approved artwork, so page metadata
 * falls back to the site-wide default image instead of showing a fake or
 * pending asset in social previews.
 */
export function getGameOgImage(game: Game): string[] | undefined {
  if (!hasApprovedArtwork(game)) return undefined
  const artwork = getApprovedArtwork(game)
  return artwork ? [artwork.src] : undefined
}
