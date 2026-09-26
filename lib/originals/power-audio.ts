import { createSynth } from './synth'
export type TableCue='chip'|'remove'|'start'|'charge'|'feature'|'tick'|'land'|'deal'|'flip'|'hit'|'stand'|'double'|'win'|'power'|'loss'|'push'|'bust'
/** Original runtime synthesis only. One context, one scheduler per table. */
export function createPowerAudio(kind:'raio'|'brasil21') {
  const s=createSynth();let wanted=false,enabled=false,visible=true
  function loop(){
    if(!wanted||!enabled||!visible||s.looping)return
    s.startLoop(kind==='raio'?.15:.3,(i,at)=>{
      const notes=kind==='raio'?[110,146.83,164.81,220]:[130.81,164.81,196,164.81]
      if(i%2===0)s.tone(at,{frequency:notes[(i/2)%4],decay:.22,gain:.025,bus:s.music})
      if(kind==='raio')s.noise(at,{duration:.055,gain:.018,type:'highpass',frequency:2800,bus:s.music})
    })
    s.musicLevel(1,.12)
  }
  return{
    unlock(){s.unlock();loop()},
    setEnabled(v:boolean){enabled=v;s.setEnabled(v);if(v)loop()},
    setVisible(v:boolean){visible=v;if(!v)s.stopLoop();s.setVisible(v);if(v)loop()},
    active(v:boolean){wanted=v;if(v){s.musicLevel(1,.12);loop()}else s.stopLoop()},
    cue(cue:TableCue){
      const at=s.ready();if(at===null)return
      if(['chip','remove','tick','deal','hit','flip'].includes(cue)){
        s.noise(at,{duration:cue==='deal'?.065:.024,gain:.065,type:'bandpass',frequency:cue==='chip'?2800:1200})
        s.tone(at,{frequency:cue==='remove'?520:cue==='tick'?900:1400,decay:.04,gain:.045});return
      }
      if(cue==='charge'||cue==='start'){s.tone(at,{frequency:90,bend:620,bendSeconds:.35,decay:.4,gain:.075});return}
      if(cue==='land'){s.tone(at,{frequency:130,bend:65,bendSeconds:.07,decay:.12,gain:.16});s.noise(at,{duration:.07,gain:.09,type:'lowpass',frequency:900});return}
      const positive=['feature','win','power','double'].includes(cue)
      const notes=positive?[261.63,329.63,392,523.25]:cue==='push'?[293.66,293.66]:[220,196,164.81]
      notes.forEach((frequency,i)=>s.tone(at+i*.085,{frequency,decay:cue==='power'?.5:.18,gain:cue==='power'?.09:.055,type:'triangle'}))
    },
    dispose(){wanted=false;s.dispose()},
  }
}
