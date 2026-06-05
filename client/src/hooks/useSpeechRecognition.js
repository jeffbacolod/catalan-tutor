import { useState, useEffect, useRef, useCallback } from 'react'

const SILENCE_DELAY_MS = 2500

export function useSpeechRecognition({ lang = 'ca-ES' } = {}) {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = true  // keep running until we explicitly stop

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      setTranscript(result[0].transcript)
      // Reset the silence timer on every new result
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop()
      }, SILENCE_DELAY_MS)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') setError(event.error)
      clearTimeout(silenceTimerRef.current)
      setIsListening(false)
    }

    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current)
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [lang])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setTranscript('')
    setError(null)
    clearTimeout(silenceTimerRef.current)
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      // already started — ignore
    }
  }, [])

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimerRef.current)
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const clearTranscript = useCallback(() => setTranscript(''), [])

  return { transcript, isListening, isSupported, startListening, stopListening, clearTranscript, error }
}
