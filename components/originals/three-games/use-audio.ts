'use client'
import { useEffect, useState } from 'react'
import { createThreeAudio } from '@/lib/originals/three-game-audio'
import type { ThreeGameKind } from '@/lib/originals/three-game-definitions'
import { useGameAudio } from '../use-game-audio'
export function useThreeAudio(kind:ThreeGameKind) {
 const [audio]=useState(()=>createThreeAudio(kind));useGameAudio(audio)
 useEffect(()=>{const visible=()=>audio.setVisible(document.visibilityState!=='hidden');visible();document.addEventListener('visibilitychange',visible);return()=>{document.removeEventListener('visibilitychange',visible);audio.dispose()}},[audio])
 return audio
}
