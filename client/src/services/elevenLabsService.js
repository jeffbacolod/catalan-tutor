export async function synthesizeSpeech(text) {
  const response = await fetch('/api/elevenlabs/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) {
    throw new Error(`ElevenLabs TTS error: ${response.statusText}`)
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
