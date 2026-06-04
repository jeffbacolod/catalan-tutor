// Manages the full conversation state: message history, loading state, and
// the orchestration between Claude (AI response), ElevenLabs (TTS), and D-ID (avatar).

import { useState, useCallback } from 'react'
import { sendMessage } from '../services/claudeService'
import { synthesizeSpeech } from '../services/elevenLabsService'
import { createTalkStream } from '../services/didService'

const SYSTEM_PROMPT = `You are a friendly Catalan language tutor.
Respond exclusively in Catalan unless the student asks for an English explanation.
Keep responses concise and encouraging.`

export function useConversation() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [avatarStream, setAvatarStream] = useState(null)

  const sendUserMessage = useCallback(async (text) => {
    const userMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)
    setError(null)

    try {
      const { reply } = await sendMessage([
        { role: 'system', content: SYSTEM_PROMPT },
        ...updatedMessages,
      ])

      const assistantMessage = { role: 'assistant', content: reply }
      setMessages((prev) => [...prev, assistantMessage])

      const audioUrl = await synthesizeSpeech(reply)
      const stream = await createTalkStream(null, audioUrl)
      setAvatarStream(stream)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const clearConversation = useCallback(() => {
    setMessages([])
    setAvatarStream(null)
    setError(null)
  }, [])

  return { messages, isLoading, error, avatarStream, sendUserMessage, clearConversation }
}
