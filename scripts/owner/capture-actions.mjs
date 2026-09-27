/** Capture-only driver; uses real controls and observes actual game phases. */
export function advanceScene({ elapsed, variant, seconds, act }) {
        let actions = 0
        const click = selector => { const target = document.querySelector(selector); if (target && !target.disabled && !target.closest('fieldset:disabled')) { target.click(); actions++; return true } return false }
        if (act) {
          const control = document.querySelector('[data-game-controls]')
          const continuation = [...document.querySelectorAll('[data-game-unit] button')].find(b => !b.disabled && /^CONTINUAR/i.test(b.textContent.trim()))
          if (continuation) { continuation.click(); actions++ }
          else if (click('[data-action="start"]') || click('[data-mines-start]') || click('[data-blackjack-deal]') || click('[data-slot-spin]')) {}
          else if (elapsed > 3 + variant % 4 && click('[data-action="cashout"]')) {}
          else if (document.querySelector('[data-tile]')) { if (elapsed > 7) click('[data-mines-cash]'); else click(`[data-tile="${(variant * 3 + Math.floor(elapsed)) % 25}"]`) }
          else if (click(`[data-blackjack-action="${elapsed < 4 ? 'hit' : 'stand'}"]`)) {}
          // Place and spin in separate render turns: the real engine checks the
          // ticket revision captured by React's current event handler.
          else if (document.querySelector('[data-roulette-spin]')) { if (!click('[data-roulette-spin]')) click('[data-bet="red:red"]') }
          else if (control) {
            const buttons = [...control.querySelectorAll('button')].filter(b => !b.disabled && !b.closest('fieldset:disabled'))
            const label = b => b.textContent.trim().replace(/^[^A-Za-zÀ-ÿ]+/, '')
            const candidate = buttons.find(b => /^(COMEÇAR|SOLTAR BOLA|GIRAR|DISTRIBUIR CARTAS|PARAR|CONTINUAR)/i.test(label(b))) || (elapsed > 4 ? buttons.find(b => /^RETIRAR/i.test(label(b))) : null)
            if (candidate) { candidate.click(); actions++ }
            else { const bet = buttons.find(b => /^Vermelho/.test(b.textContent.trim())); if (bet) { bet.click(); actions++ } }
          }
        }
        if (elapsed >= seconds - 1.8) document.querySelector('.social-end').dataset.visible = 'true'
        for (const animation of document.getAnimations()) {
          if (!window.ownerAnimations.has(animation)) { window.ownerAnimations.set(animation, elapsed); animation.pause() }
          animation.currentTime = (elapsed - window.ownerAnimations.get(animation)) * 1000
        }
        const attributes = ['data-phase','data-slot-phase','data-mines-phase','data-blackjack-phase','data-roulette-phase','data-result','data-stopped']
        let phase = [...document.querySelectorAll(attributes.map(key => `[${key}]`).join(','))].map(el => attributes.map(key => el.getAttribute(key)).filter(value => value !== null).join(':')).join('|')
        const game = document.querySelector('#owner-social-stage').dataset.game
        if (game === 'samba-drop') {
          const dropping = document.querySelector('[data-game-controls] button')?.disabled
          phase = dropping ? 'dropping' : document.querySelector('[data-game-viewport] [aria-live]')?.textContent.includes('×') ? 'landed' : 'ready'
        } else if (game === 'skuptu-levanta') {
          const button = document.querySelector('[data-game-controls] button')
          phase = document.querySelector('[data-failed=true]') ? 'failed' : /RETIRAR/.test(button?.textContent || '') ? 'lifting' : button?.disabled ? 'preparing' : 'ready'
        }
        return { actions, phase }
      }
