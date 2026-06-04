import { Router } from 'express'
import fetch from 'node-fetch'

const router = Router()

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // "Bella" — adjust as needed

router.post('/tts', async (req, res) => {
  const { text, voiceId = DEFAULT_VOICE_ID } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  try {
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
