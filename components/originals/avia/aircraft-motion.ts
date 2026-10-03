/** Presentation only: never determines a round, multiplier, cashout or payout. */
type AircraftPhase = 'betting' | 'flying' | 'result'
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => value * value * (3 - 2 * value)

function flightPose(elapsed: number, multiplier: number) {
  const launch = smooth(clamp(elapsed / 2400))
  const speed = clamp(Math.log(Math.max(100, multiplier) / 100) / Math.log(8)) * launch
  return {
    x: -6 + 9 * launch + 2.5 * speed,
    y: -3 * launch - speed + Math.sin(elapsed / 1700) * .45 * launch,
    bank: 2 - 4 * launch + Math.sin(elapsed / 1400) * .7 * launch,
    scale: 1 + .025 * speed,
    trail: (.22 + .28 * speed) * launch,
    trailLength: 1 + .7 * speed,
  }
}

export function aircraftPresentation(phase: AircraftPhase, elapsed: number, multiplier: number, resultElapsed = 0, reduced = false) {
  const pose = flightPose(phase === 'betting' ? 0 : Math.max(0, elapsed), multiplier)
  const departure = phase === 'result' ? smooth(clamp(resultElapsed / 650)) : 0
  const x = reduced ? 0 : pose.x + departure * 220
  const y = reduced ? phase === 'flying' ? -3 : 0 : pose.y - departure * 70
  const bank = reduced ? 0 : pose.bank - departure * 16
  const scale = reduced ? 1 : pose.scale * (1 - departure * .25)
  return {
    transform: `translate(${x}%, ${y}%) rotate(${bank}deg) scale(${scale})`,
    opacity: phase === 'result' ? 1 - departure : 1,
    trail: phase === 'flying' && !reduced ? pose.trail : 0,
    trailLength: pose.trailLength,
  }
}
