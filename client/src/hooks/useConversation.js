import { useState, useCallback } from 'react'
import { sendMessage } from '../services/claudeService'

const CORRECTION_VOICE = `Focus corrections on grammar and vocabulary only — do not correct spelling or accent marks, since the message was spoken aloud.`
const CORRECTION_TEXT = `Correct everything including spelling and accent marks, since the message was typed.`

// Four combinations of (nativeLang, explanationLang):
//   en + en  → respond in Catalan, explain corrections in simple English
//   en + ca  → full Catalan immersion, never use English
//   es + es  → respond in Catalan, explain corrections in simple Spanish
//   es + ca  → full Catalan immersion, never use Spanish
function buildSystemPrompt(inputMethod, nativeLang, explanationLang) {
  const correctionScope = inputMethod === 'voice' ? CORRECTION_VOICE : CORRECTION_TEXT

  let base
  if (explanationLang === 'ca') {
    base = `You are a friendly Catalan language tutor in full immersion mode. Always respond exclusively in Catalan — never use English or Spanish under any circumstances. After each response, if the user made a mistake, add a brief gentle correction introduced by "✏️ Correcció:" written entirely in Catalan. Keep responses short and conversational.`
  } else if (nativeLang === 'en') {
    base = `You are a friendly Catalan language tutor for a native English speaker. Always respond in Catalan. After each response, if the user made a mistake, add a brief gentle correction introduced by "✏️ Correcció:" and explain the correction in simple, plain English so it is easy to understand. Keep responses short and conversational.`
  } else {
    base = `You are a friendly Catalan language tutor for a native Spanish speaker. Always respond in Catalan. After each response, if the user made a mistake, add a brief gentle correction introduced by "✏️ Correcció:" and explain the correction in simple, plain Spanish so it is easy to understand. Keep responses short and conversational.`
  }

  return `${base} ${correctionScope}`
}

export function useConversation(nativeLang = 'en', explanationLang = 'en') {
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
      const { reply } = await sendMessage(next, buildSystemPrompt(inputMethod, nativeLang, explanationLang))
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [messages, nativeLang, explanationLang])

  const clearConversation = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendUserMessage, clearConversation }
}
