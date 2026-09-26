export interface AudioMix { music:boolean; sfx:boolean }
/** Preference gates sit AFTER automated buses: a music fade can never unmute a preference. */
export function createAudioMix(){
 let prefs:AudioMix={music:true,sfx:true},context:AudioContext|null=null,music:GainNode|null=null,sfx:GainNode|null=null
 function apply(){if(!context)return;for(const [node,on] of [[music,prefs.music],[sfx,prefs.sfx]] as const){if(!node)continue;const at=context.currentTime;node.gain.cancelScheduledValues(at);node.gain.setValueAtTime(node.gain.value,at);node.gain.linearRampToValueAtTime(on?1:0,at+.035)}}
 return {setMix(next:AudioMix){prefs=next;apply()},connect(ctx:AudioContext,musicBus:GainNode,sfxBus:GainNode,master:GainNode){context=ctx;music=ctx.createGain();sfx=ctx.createGain();music.gain.value=prefs.music?1:0;sfx.gain.value=prefs.sfx?1:0;musicBus.connect(music);sfxBus.connect(sfx);music.connect(master);sfx.connect(master)}}
}
