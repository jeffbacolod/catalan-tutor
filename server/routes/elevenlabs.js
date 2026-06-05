import { Router } from 'express'
import fetch from 'node-fetch'

const router = Router()

let cachedVoiceId = null

async function getFirstVoiceId() {
  if (cachedVoiceId) return cachedVoiceId
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
  })
  if (!res.ok) throw new Error(`ElevenLabs voices fetch failed: ${res.status}`)
  const { voices } = await res.json()
  if (!voices?.length) throw new Error('No voices available on ElevenLabs account')
  cachedVoiceId = voices[0].voice_id
  console.log(`ElevenLabs: using voice "${voices[0].name}" (${cachedVoiceId})`)
  return cachedVoiceId
}

router.post('/tts', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  try {
    const voiceId = await getFirstVoiceId()
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: err })
    }

    res.set('Content-Type', 'audio/mpeg')
    response.body.pipe(res)
  } catch (err) {
    console.error('ElevenLabs error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
