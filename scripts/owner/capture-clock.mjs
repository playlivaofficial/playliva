/** Pause only after assets/controls are ready, before the first gameplay action.
 * The former +100ms target raced with heavy 3D rendering. This margin advances
 * idle time only; every subsequent gameplay frame still advances exactly 1/30s.
 */
export async function pauseCaptureClock(page) {
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 30000))
}

export function hasReadyCaptureControl() {
  const buttons = document.querySelectorAll('[data-game-controls] button,[data-game-unit] [data-bet="red:red"]')
  return [...buttons].some(button => !button.disabled && !button.closest('fieldset:disabled') && (
    button.matches('[data-action="start"],[data-mines-start],[data-blackjack-deal],[data-slot-spin],[data-bet="red:red"]') ||
    /^(COMEÇAR|SOLTAR BOLA|GIRAR|DISTRIBUIR CARTAS|Vermelho)/i.test(button.textContent.trim().replace(/^[^A-Za-zÀ-ÿ]+/, ''))
  ))
}
