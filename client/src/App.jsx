import { useState, useEffect, useRef } from 'react'
import { useConversation } from './hooks/useConversation'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import './App.css'

function SenyeraFlag({ className = '' }) {
  return (
    <svg viewBox="0 0 270 180" xmlns="http://www.w3.org/2000/svg" className={`flag-svg ${className}`} aria-label="Catalan flag">
      <rect width="270" height="180" fill="#FCDD09" />
      <rect y="20" width="270" height="20" fill="#C60B1E" />
      <rect y="60" width="270" height="20" fill="#C60B1E" />
      <rect y="100" width="270" height="20" fill="#C60B1E" />
      <rect y="140" width="270" height="20" fill="#C60B1E" />
    </svg>
  )
}

function SpainFlag({ className = '' }) {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" className={`flag-svg ${className}`} aria-label="Spanish flag">
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </svg>
  )
}

function UKFlag({ className = '' }) {
  return (
    <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className={`flag-svg ${className}`} aria-label="UK flag">
      <rect width="60" height="30" fill="#012169" />
      {/* White saltire */}
      <line x1="0" y1="0" x2="60" y2="30" stroke="white" strokeWidth="7" />
      <line x1="60" y1="0" x2="0" y2="30" stroke="white" strokeWidth="7" />
      {/* Red saltire */}
      <line x1="0" y1="0" x2="60" y2="30" stroke="#C8102E" strokeWidth="3.5" />
      <line x1="60" y1="0" x2="0" y2="30" stroke="#C8102E" strokeWidth="3.5" />
      {/* White cross */}
      <rect x="24" y="0" width="12" height="30" fill="white" />
      <rect x="0" y="11" width="60" height="8" fill="white" />
      {/* Red cross */}
      <rect x="26.5" y="0" width="7" height="30" fill="#C8102E" />
      <rect x="0" y="12.5" width="60" height="5" fill="#C8102E" />
    </svg>
  )
}

const LANG_CONFIG = {
  en: {
    label: 'English',
    flag: <UKFlag className="lang-btn__flag-svg" />,
    speakPrompt: 'I speak…',
    nativeLocale: 'en-US',
    placeholder: 'Write in Catalan… (Enter to send)',
    listening: 'Listening…',
    emptyHint: 'Try: "Hello, my name is [name]. Can we practice Catalan?"',
    levelPrompt: 'When I make mistakes, explain in…',
    continueLabel: 'Continue',
    levels: {
      beginner:  { label: 'English',           flag: <UKFlag className="lang-btn__flag-svg" /> },
      immersion: { label: 'Català', flag: <SenyeraFlag className="lang-btn__flag-svg" /> },
    },
  },
  es: {
    label: 'Español',
    flag: <SpainFlag className="lang-btn__flag-svg" />,
    speakPrompt: 'Hablo…',
    nativeLocale: 'es-ES',
    placeholder: 'Escribe en catalán… (Enter para enviar)',
    listening: 'Escuchando…',
    emptyHint: 'Prueba: "Hola, me llamo [nombre]. ¿Podemos practicar el catalán?"',
    levelPrompt: 'Cuando cometa errores, explica en…',
    continueLabel: 'Continuar',
    levels: {
      beginner:  { label: 'Español',           flag: <SpainFlag className="lang-btn__flag-svg" /> },
      immersion: { label: 'Català', flag: <SenyeraFlag className="lang-btn__flag-svg" /> },
    },
  },
}

export default function App() {
  const [nativeLang, setNativeLang] = useState(null)
  const [level, setLevel] = useState(null)
  const [started, setStarted] = useState(false)
  const lang = nativeLang ? LANG_CONFIG[nativeLang] : null
  const locale = level === 'immersion' ? 'ca-ES' : (lang?.nativeLocale ?? 'ca-ES')

  const { messages, isLoading, error, sendUserMessage, clearConversation } = useConversation(nativeLang ?? 'en', level ?? 'beginner')
  const { transcript, isListening, isSupported, startListening, stopListening, clearTranscript } =
    useSpeechRecognition({ lang: locale })
  const [inputText, setInputText] = useState('')
  const [isVoicePending, setIsVoicePending] = useState(false)
  const bottomRef = useRef(null)
  const voiceTimerRef = useRef(null)

  useEffect(() => {
    if (transcript) setInputText(transcript)
  }, [transcript])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // When mic stops and we have a transcript, wait 2.5s before auto-submitting
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      setIsVoicePending(true)
      voiceTimerRef.current = setTimeout(() => {
        setIsVoicePending(false)
        handleSubmit(transcript.trim(), 'voice')
        clearTranscript()
      }, 2500)
    }
    return () => clearTimeout(voiceTimerRef.current)
  }, [isListening]) // eslint-disable-line react-hooks/exhaustive-deps

  function cancelVoicePending() {
    clearTimeout(voiceTimerRef.current)
    setIsVoicePending(false)
  }

  function handleSubmit(text, inputMethod = 'text') {
    const trimmed = (text || inputText).trim()
    if (!trimmed || isLoading) return
    setInputText('')
    clearTranscript()
    sendUserMessage(trimmed, inputMethod)
  }

  function handleSendVoice() {
    cancelVoicePending()
    const trimmed = inputText.trim()
    if (!trimmed || isLoading) return
    setInputText('')
    clearTranscript()
    sendUserMessage(trimmed, 'voice')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      isVoicePending ? handleSendVoice() : handleSubmit()
    }
  }

  function toggleMic() {
    if (isVoicePending) {
      // Cancel pending submit and resume recording
      cancelVoicePending()
      clearTranscript()
      setInputText('')
      startListening()
    } else if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  function handleNewConversation() {
    clearConversation()
    setNativeLang(null)
    setLevel(null)
    setStarted(false)
    setInputText('')
    clearTranscript()
    cancelVoicePending()
  }

  if (!started) {
    return (
      <div className="app">
        <header className="header">
          <h1><SenyeraFlag className="header-flag" /> CatalanTutor</h1>
          <p className="subtitle">Practica el català amb IA</p>
        </header>
        <main className="setup-page">

          <section className="setup-step">
            <div className="lang-selector__grid">
              {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
                <div key={code} className="lang-option">
                  <p className="lang-option__prompt">{cfg.speakPrompt}</p>
                  <button
                    className={`lang-btn ${nativeLang === code ? 'lang-btn--active' : ''}`}
                    onClick={() => { setNativeLang(code); setLevel(null) }}
                  >
                    <span className="lang-btn__flag">{cfg.flag}</span>
                    <span className="lang-btn__label">{cfg.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {nativeLang && (
            <hr className="setup-divider" />
          )}

          {nativeLang && (
            <section className="setup-step setup-step--reveal" key={nativeLang}>
              <p className="setup-prompt">{lang.levelPrompt}</p>
              <div className="lang-selector__grid">
                {Object.entries(lang.levels).map(([code, cfg]) => (
                  <button
                    key={code}
                    className={`lang-btn ${level === code ? 'lang-btn--active' : ''}`}
                    onClick={() => setLevel(code)}
                  >
                    <span className="lang-btn__flag">{cfg.flag}</span>
                    <span className="lang-btn__label">{cfg.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {nativeLang && level && (
            <button className="btn-continue" onClick={() => setStarted(true)}>
              {lang.continueLabel} →
            </button>
          )}

        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1><SenyeraFlag className="header-flag" /> CatalanTutor</h1>
        <p className="subtitle">Practica el català amb IA</p>
        <button className="btn-clear" onClick={handleNewConversation}>
          Nova conversa
        </button>
      </header>

      <main className="chat-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Bon dia! Comença a escriure o prem el micròfon per parlar en català.</p>
            <p className="hint">{lang.emptyHint}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message message--${msg.role}`}>
            <span className="message__label">
              {msg.role === 'user' ? 'Tu' : 'Tutor'}
            </span>
            <div className="message__bubble">
              {msg.role === 'assistant'
                ? renderAssistantMessage(msg.content)
                : msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message message--assistant">
            <span className="message__label">Tutor</span>
            <div className="message__bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            Error: {error}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer className="input-area">
        {isVoicePending && (
          <div className="voice-status">
            <span>Sending in 2s — tap 🎙 to keep speaking</span>
          </div>
        )}
        <div className="input-row">
          <button
            className={`btn-mic ${isListening ? 'btn-mic--active' : ''} ${isVoicePending ? 'btn-mic--pending' : ''} ${!isSupported ? 'btn-mic--disabled' : ''}`}
            onClick={toggleMic}
            disabled={!isSupported || isLoading}
            title={
              !isSupported ? 'Speech recognition not supported in this browser'
              : isVoicePending ? 'Tap to keep speaking'
              : isListening ? 'Stop listening'
              : 'Start listening'
            }
          >
            {isListening ? '⏹' : '🎙'}
          </button>

          <textarea
            className="text-input"
            value={inputText}
            onChange={(e) => { cancelVoicePending(); setInputText(e.target.value) }}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? lang.listening : lang.placeholder}
            disabled={isLoading}
            rows={1}
          />

          <button
            className="btn-send"
            onClick={() => isVoicePending ? handleSendVoice() : handleSubmit()}
            disabled={!inputText.trim() || isLoading}
          >
            Enviar
          </button>
        </div>
      </footer>
    </div>
  )
}

function renderAssistantMessage(content) {
  const correctionMatch = content.split(/(✏️ Correcció:.*)$/s)
  if (correctionMatch.length < 2) return <p>{content}</p>
  return (
    <>
      <p>{correctionMatch[0].trim()}</p>
      <p className="correction">{correctionMatch[1].trim()}</p>
    </>
  )
}
