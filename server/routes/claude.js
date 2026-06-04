import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
let anthropic
function getClient() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return anthropic
}

router.post('/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  // Anthropic requires strictly alternating user/assistant turns.
  // Filter to only valid roles and collapse consecutive same-role messages.
  const valid = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .reduce((acc, m) => {
      if (acc.length && acc[acc.length - 1].role === m.role) {
        acc[acc.length - 1] = { role: m.role, content: `${acc[acc.length - 1].content}\n${m.content}` }
      } else {
        acc.push({ role: m.role, content: m.content })
      }
      return acc
    }, [])

  // Must start with a user message
  if (!valid.length || valid[0].role !== 'user') {
    return res.status(400).json({ error: 'Conversation must start with a user message' })
  }

  try {
    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: valid,
    })

    res.json({ reply: response.content[0].text })
  } catch (err) {
    console.error('Claude API error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
