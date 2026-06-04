import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

router.post('/chat', async (req, res) => {
  const { messages } = req.body
  if (!messages?.length) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  try {
    const systemMessage = messages.find((m) => m.role === 'system')
    const conversationMessages = messages.filter((m) => m.role !== 'system')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemMessage?.content,
      messages: conversationMessages,
    })

    res.json({ reply: response.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
