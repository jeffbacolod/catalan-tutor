// Wraps the browser Web Speech API (SpeechRecognition).
// Returns { transcript, isListening, startListening, stopListening, error }.
// No external library — browser-native only.

import { useState, useEffect, useRef, useCallback } from 'react'

export function useSpeechRecognition({ lang = 'ca-ES' } = {}) {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('SpeechRecognition is not supported in this browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      setTranscript(event.results[0][0].transcript)
    }
    recognition.onerror = (event) => {
      setError(event.error)
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
  }, [lang])

  const startListening = useCallback(() => {
    setTranscript('')
    setError(null)
    recognitionRef.current?.start()
    setIsListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { transcript, isListening, startListening, stopListening, error }
}
