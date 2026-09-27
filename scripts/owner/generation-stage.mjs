import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
export async function installGenerationStage(page, job) {
  const logo = await readFile(resolve('social/brand/playliva-lockup.svg'), 'utf8')
  await page.evaluate(({ job, logo }) => {
    const unit = document.querySelector('[data-game-unit]')
    if (!unit) throw new Error('Game viewport unavailable.')
    const ancestor = unit.closest('[data-three-game],[data-power-game],[data-original-id]')
    const stage = document.createElement('main'); stage.id = 'owner-social-stage'; stage.dataset.game = job.gameSlug
    stage.innerHTML = `<header>${logo}<span>PLAYLIVA ORIGINALS</span></header><section class="social-copy"><h1></h1><p></p></section><section class="social-game"></section><footer><strong>JOGUE GRÁTIS NO PLAYLIVA</strong><p>18+ · Créditos virtuais sem valor monetário<br>Sem depósitos ou apostas com dinheiro real</p></footer><aside class="social-end"><h2></h2><p>Jogue grátis em playliva.com</p></aside>`
    stage.querySelector('h1').textContent = job.creative.hook
    stage.querySelector('.social-copy p').textContent = job.creative.gameTitle
    stage.querySelector('h2').textContent = job.creative.gameTitle
    if (ancestor) stage.querySelector('.social-game').className += ` ${ancestor.className}`
    document.body.append(stage); stage.querySelector('.social-game').append(unit)
    // Capture-only layout. No repository game source or production response changes.
    const style = document.createElement('style')
    style.textContent = `html,body{width:1080px!important;height:1920px!important;margin:0!important;overflow:hidden!important}body>:not(#owner-social-stage){display:none!important}#owner-social-stage{position:fixed;inset:0;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,#123f35,#031713 80%);color:#fff;font-family:Arial,sans-serif}#owner-social-stage header{position:absolute;top:110px;left:64px;right:100px;display:flex;align-items:center;gap:40px;font-size:19px;font-weight:800;letter-spacing:.08em;color:#77edc4}#owner-social-stage header svg{width:260px;height:70px}.social-copy{position:absolute;top:235px;left:64px;right:116px}.social-copy h1{font-size:64px;line-height:1.04;letter-spacing:-.035em;font-weight:900;text-wrap:balance;margin:0}.social-copy p{font-size:28px;color:#a7ded0;margin-top:20px}.social-game{position:absolute;left:40px;top:550px;width:960px;max-height:970px;display:flex;align-items:center;justify-content:center}.social-game [data-game-unit]{width:960px!important;max-width:none!important;margin:0!important}.social-game [data-game-viewport]{border:2px solid #7ddfc177!important;box-shadow:0 18px 50px #0008;border-radius:28px!important}.social-game [data-game-controls]{display:none!important}#owner-social-stage footer{position:absolute;left:64px;right:110px;top:1570px}#owner-social-stage footer strong{display:inline-block;padding:22px 30px;background:#b9ff5f;color:#08251c;border-radius:30px;font-size:25px;font-weight:900}#owner-social-stage footer p{font-size:20px;line-height:1.5;color:#a9c8bf;margin-top:24px}.social-end{position:absolute;inset:0;background:radial-gradient(ellipse at center,#17634f,#031713);display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .35s}.social-end[data-visible=true]{opacity:1}.social-end h2{font-size:70px;max-width:800px;text-align:center}.social-end p{font-size:34px;color:#b9ff5f}`
    document.head.append(style)
    const framing = document.createElement('style')
    framing.textContent = '.social-game{height:920px;max-height:920px}.social-game [data-game-viewport]{min-height:700px}#owner-social-stage[data-game=crash] [data-game-viewport]>div,#owner-social-stage[data-game=liva-ginga] [data-game-viewport]>div{height:800px!important;min-height:800px!important}.social-game [data-mines-phase],.social-game [data-blackjack-phase],.social-game [data-roulette-phase],.social-game [data-slot-phase]{min-height:750px!important}'
    document.head.append(framing)
  }, { job, logo })
}
