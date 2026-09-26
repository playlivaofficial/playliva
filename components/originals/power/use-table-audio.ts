'use client'
import { useEffect, useState } from 'react'
import { useGameAudio } from '../use-game-audio'
import { createPowerAudio } from '@/lib/originals/power-audio'
export function useTableAudio(kind:'raio'|'brasil21'|'blackjack'|'roulette'|'mines',sound:boolean,active:boolean){
  const [audio]=useState(()=>createPowerAudio(kind))
  useGameAudio(audio)
  useEffect(()=>{audio.setEnabled(sound)},[audio,sound])
  useEffect(()=>{audio.active(active)},[audio,active])
  useEffect(()=>{const visible=()=>audio.setVisible(document.visibilityState!=='hidden');visible();document.addEventListener('visibilitychange',visible);return()=>{document.removeEventListener('visibilitychange',visible);audio.dispose()}},[audio])
  return audio
}
