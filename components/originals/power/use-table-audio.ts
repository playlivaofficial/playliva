'use client'
import { useEffect, useState } from 'react'
import { createPowerAudio } from '@/lib/originals/power-audio'
export function useTableAudio(kind:'raio'|'brasil21',sound:boolean,active:boolean){
  const [audio]=useState(()=>createPowerAudio(kind))
  useEffect(()=>{audio.setEnabled(sound)},[audio,sound])
  useEffect(()=>{audio.active(active)},[audio,active])
  useEffect(()=>{const visible=()=>audio.setVisible(document.visibilityState!=='hidden');visible();document.addEventListener('visibilitychange',visible);return()=>{document.removeEventListener('visibilitychange',visible);audio.dispose()}},[audio])
  return audio
}
