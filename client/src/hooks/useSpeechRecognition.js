import { useState, useEffect, useRef, useCallback } from 'react'

export function useSpeechRecognition({ lang = 'ca-ES' } = {}) {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      setTranscript(result[0].transcript)
    }
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') setError(event.error)
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
  }, [lang])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setTranscript('')
    setError(null)
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      // already started — ignore
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const clearTranscript = useCallback(() => setTranscript(''), [])

  return { transcript, isListening, isSupported, startListening, stopListening, clearTranscript, error }
}
