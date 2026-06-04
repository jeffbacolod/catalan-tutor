// Requests TTS audio from the backend /api/elevenlabs proxy.
// Returns an audio blob URL suitable for HTMLAudioElement playback.

export async function synthesizeSpeech(text, voiceId) {
  const response = await fetch('/api/elevenlabs/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  })
  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`)
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
