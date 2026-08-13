import type { Game } from './types'

/**
 * Single source of truth for whether a game's real artwork is safe to
 * publish — used by `<GameArtwork>` for on-page rendering AND by page
 * metadata for Open Graph / Twitter card images, so a fake or unapproved
 * asset can never leak into a link preview even if it never renders in
 * the UI itself.
 *
 * Real artwork requires ALL of:
 *   - an `image` path is set
 *   - `assetStatus` is `official` or `approved` (never `pending`/`placeholder`)
 *   - `assetRightsStatus` is `approved` (never `permission-required`/`unknown`)
 */
export function hasApprovedArtwork(game: Game): boolean {
  return (
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
  return hasApprovedArtwork(game) ? [game.image as string] : undefined
}
