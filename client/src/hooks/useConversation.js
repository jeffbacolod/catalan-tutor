import { useState, useCallback } from 'react'
import { sendMessage } from '../services/claudeService'

const BASE_PROMPT = `You are a friendly Catalan language tutor. Always respond in Catalan. After each response, if the user made a mistake, add a brief gentle correction introduced by "✏️ Correcció:" followed by the correction in Catalan. Keep responses short and conversational.`

const CORRECTION_VOICE = `Focus corrections on grammar and vocabulary only — do not correct spelling or accent marks, since the message was spoken aloud.`
const CORRECTION_TEXT = `Correct everything including spelling and accent marks, since the message was typed.`

function buildSystemPrompt(inputMethod) {
  return `${BASE_PROMPT} ${inputMethod === 'voice' ? CORRECTION_VOICE : CORRECTION_TEXT}`
}

export function useConversation() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendUserMessage = useCallback(async (text, inputMethod = 'text') => {
    const userMessage = { role: 'user', content: text, inputMethod }
    const next = [...messages, userMessage]
    setMessages(next)
    setIsLoading(true)
    setError(null)

    try {
      const { reply } = await sendMessage(next, buildSystemPrompt(inputMethod))
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
