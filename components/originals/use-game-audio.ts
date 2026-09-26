'use client'
import { useEffect } from 'react'
import { useDemoSession } from './demo-session'
import { audioPreferences } from '@/lib/originals/session'
import type { AudioMix } from '@/lib/originals/audio-mix'
interface GameAudio { setMix(mix:AudioMix):void;setEnabled(on:boolean):void;unlock():void }
/** Preference state stays in the existing session. Trusted gestures alone unlock audio. */
export function useGameAudio(audio:GameAudio){
 const {wallet,session}=useDemoSession(),{music,sfx}=audioPreferences(session.settings)
 useEffect(()=>{audio.setMix({music,sfx});audio.setEnabled(music||sfx)},[audio,music,sfx])
 useEffect(()=>{const gesture=(event:Event)=>{if(!event.isTrusted)return;const mix=audioPreferences(wallet.getSnapshot().session.settings);audio.setMix(mix);audio.setEnabled(mix.music||mix.sfx);if(mix.music||mix.sfx)audio.unlock()};window.addEventListener('click',gesture);window.addEventListener('keydown',gesture);return()=>{window.removeEventListener('click',gesture);window.removeEventListener('keydown',gesture)}},[audio,wallet])
}
