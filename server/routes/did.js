import { Router } from 'express'
import fetch from 'node-fetch'

const router = Router()
const DID_API_URL = 'https://api.d-id.com'

router.post('/talks', async (req, res) => {
  const { sourceUrl, audioUrl } = req.body
  if (!audioUrl) return res.status(400).json({ error: 'audioUrl is required' })

  try {
    const response = await fetch(`${DID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: sourceUrl,
        script: {
          type: 'audio',
          audio_url: audioUrl,
        },
        config: { fluent: true, pad_audio: 0 },
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)
    res.json(data)
  } catch (err) {
    console.error('D-ID error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/talks/:id', async (req, res) => {
  try {
    const response = await fetch(`${DID_API_URL}/talks/${req.params.id}`, {
      headers: { Authorization: `Basic ${process.env.DID_API_KEY}` },
    })
    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)
    res.json(data)
  } catch (err) {
    console.error('D-ID error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
