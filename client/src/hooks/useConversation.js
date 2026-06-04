import { useState, useCallback } from 'react'
import { sendMessage } from '../services/claudeService'

const SYSTEM_PROMPT = `You are a friendly Catalan language tutor. Always respond in Catalan. After each response, if the user made a grammar or vocabulary mistake, add a brief gentle correction introduced by "✏️ Correcció:" followed by the correction in Catalan. Keep responses short and conversational.`

export function useConversation() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendUserMessage = useCallback(async (text) => {
    const userMessage = { role: 'user', content: text }
    const next = [...messages, userMessage]
    setMessages(next)
    setIsLoading(true)
    setError(null)

    try {
      const { reply } = await sendMessage(next, SYSTEM_PROMPT)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const clearConversation = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendUserMessage, clearConversation }
}
