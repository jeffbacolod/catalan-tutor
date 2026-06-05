import { useRef, useCallback } from 'react'
import { synthesizeSpeech } from '../services/elevenLabsService'

export function useTTS() {
  const audioRef = useRef(null)

  const speak = useCallback(async (text) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
    }

    try {
      const url = await synthesizeSpeech(text)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
      }
      await audio.play()
    } catch (err) {
      console.error('TTS playback error:', err)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
    }
  }, [])

  return { speak, stop }
}
