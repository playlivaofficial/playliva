import { createSynth, note } from './synth'
import type { AudioMix } from './audio-mix'
import type { ThreeGameKind } from './three-game-definitions'
export type ThreeCue = 'start'|'tick'|'anticipation'|'land'|'win'|'big'|'huge'|'cashout'|'fail'|'impact'|'stop'|'special'|'bonus'|'meter'|'retrigger'|'summary'
/** Original synthesis; one context and one scheduler, independent shared Music/SFX buses. */
export function createThreeAudio(kind: ThreeGameKind) {
 const s = createSynth({ musicGain: .105, sfxGain: .65 }), gym = kind === 'skuptu-levanta', slot = kind === 'carnaval-gold'
 let enabled = false, visible = true, active = false, bonus = false, disposed = false
 function music() {
   if(disposed || !enabled || !visible || !active) { s.stopLoop(); s.musicLevel(0,.1); return }
   s.startLoop(gym ? .24 : bonus ? .13 : .16, (i,at) => {
     const bus=s.music, pattern=slot?[0,3,7,10,7,3,5,7]:[0,7,3,5,10,7,5,3]
     if(i%4===0)s.tone(at,{frequency:gym?68:90,bend:38,decay:.16,gain:.35,bus})
     if(i%4===2)s.noise(at,{duration:.055,gain:.13,type:'bandpass',frequency:1400,bus})
     if(!gym && [1,3,6].includes(i%8))s.tone(at,{frequency:780+(i%3)*130,decay:.04,gain:.12,bus,partials:[[1.46,.22]]})
     if(i%2===0)s.tone(at,{type:'triangle',frequency:note(pattern[Math.floor(i/2)%8]-(gym?36:24)),decay:.2,gain:.18,bus})
     if(bonus && i%4===0)s.bell(at,note(pattern[Math.floor(i/4)%8]+3),.09,.25,bus)
   }); s.musicLevel(bonus?1:.62,.2)
 }
 return {
  setMix(mix:AudioMix){s.setMix(mix)},
  setEnabled(on:boolean){disposed=false;enabled=on;s.setEnabled(on);music()},
  unlock(){if(disposed)return;s.unlock();music()},
  setVisible(on:boolean){visible=on;s.setVisible(on);music()},
  active(on:boolean,free=false){active=on;if(bonus!==free){bonus=free;s.stopLoop()}music()},
  cue(cue:ThreeCue,index=0){
   if(disposed)return;const at=s.ready();if(at===null)return
   if(cue==='tick'||cue==='stop'){s.tone(at,{frequency:(gym?170:slot?360:740)+index*43,decay:slot?.08:.045,gain:.11,partials:[[2.4,.15]]});return}
   if(cue==='impact'||cue==='fail'){
    s.duck(at,.15,.7);s.tone(at,{frequency:cue==='impact'?88:140,bend:31,decay:.45,gain:.5});s.noise(at,{duration:.32,gain:.26,type:'lowpass',frequency:cue==='impact'?1900:800});
    if(cue==='impact')s.bell(at+.025,188,.14,.6);return
   }
   if(cue==='start'){s.noise(at,{duration:.1,gain:.12,type:'highpass',frequency:1400});s.tone(at,{frequency:gym?110:520,bend:gym?90:880,decay:.2,gain:.17});return}
   if(cue==='anticipation'){s.bell(at,740+index*90,.12,.32);return}
   const notes=cue==='huge'||cue==='bonus'||cue==='summary'?[0,4,7,12,16]:cue==='big'||cue==='cashout'?[0,4,7,12]:cue==='land'?[0,7]:[0,4,7]
   notes.forEach((n,i)=>s.bell(at+i*.075,note(n+(gym?-12:slot?0:5)),.16,cue==='huge'?.9:.35))
   if(cue==='bonus'||cue==='big'||cue==='huge')s.brass(at+.15,note(0),.55,.07)
  },
  dispose(){disposed=true;active=false;s.dispose()},
 }
}
