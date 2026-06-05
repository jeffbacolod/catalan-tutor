import { useState, useCallback } from 'react'
import { sendMessage } from '../services/claudeService'

const CORRECTION_VOICE = `Focus corrections on grammar and vocabulary only — do not correct spelling or accent marks, since the message was spoken aloud.`
const CORRECTION_TEXT = `Correct everything including spelling and accent marks, since the message was typed.`

function buildSystemPrompt(inputMethod, nativeLang, level) {
  const correctionScope = inputMethod === 'voice' ? CORRECTION_VOICE : CORRECTION_TEXT

  const base = level === 'immersion'
    ? `You are a friendly Catalan language tutor in full immersion mode. Always respond exclusively in Catalan — never use English or Spanish. After each response, if the user made a mistake, add a brief gentle correction introduced by "✏️ Correcció:" in Catalan only. Keep responses short and conversational.`
    : nativeLang === 'en'
    ? `You are a friendly Catalan language tutor for a native English speaker. Always respond in Catalan. After each response, if the user made a mistake, add a brief gentle correction introduced by "✏️ Correcció:" and explain the correction in English so the user understands it. Keep responses short and conversational.`
    : `You are a friendly Catalan language tutor for a native Spanish speaker. Always respond in Catalan. After each response, if the user made a mistake, add a brief gentle correction introduced by "✏️ Correcció:" and explain the correction in Spanish so the user understands it. Keep responses short and conversational.`

  return `${base} ${correctionScope}`
}

export function useConversation(nativeLang = 'en', level = 'beginner') {
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
      const { reply } = await sendMessage(next, buildSystemPrompt(inputMethod, nativeLang, level))
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [messages, nativeLang, level])

  const clearConversation = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendUserMessage, clearConversation }
}
