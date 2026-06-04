import { useState, useEffect, useRef } from 'react'
import { useConversation } from './hooks/useConversation'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import './App.css'

const LANG_CONFIG = {
  en: {
    label: 'English',
    flag: '🇬🇧',
    tagline: 'I speak English',
    locale: 'en-US',
    placeholder: 'Write in Catalan… (Enter to send)',
    listening: 'Listening…',
    emptyHint: 'Try: "Hello, my name is [name]. Can we practice Catalan?"',
  },
  es: {
    label: 'Español',
    flag: '🇪🇸',
    tagline: 'Hablo español',
    locale: 'es-ES',
    placeholder: 'Escribe en catalán… (Enter para enviar)',
    listening: 'Escuchando…',
    emptyHint: 'Prueba: "Hola, me llamo [nombre]. ¿Podemos practicar el catalán?"',
  },
  ca: {
    label: 'Català',
    flag: '🏴󠁥󠁳󠁣󠁴󠁿',
    tagline: 'Parlo català',
    locale: 'ca-ES',
    placeholder: 'Escriu en català… (Enter per enviar)',
    listening: 'Escoltant…',
    emptyHint: 'Prova: "Hola, em dic [nom]. Podem practicar el català?"',
  },
}

export default function App() {
  const [nativeLang, setNativeLang] = useState(null)
  const lang = nativeLang ? LANG_CONFIG[nativeLang] : null

  const { messages, isLoading, error, sendUserMessage, clearConversation } = useConversation(nativeLang ?? 'ca')
  const { transcript, isListening, isSupported, startListening, stopListening, clearTranscript } =
    useSpeechRecognition({ lang: lang?.locale ?? 'ca-ES' })
  const [inputText, setInputText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (transcript) setInputText(transcript)
  }, [transcript])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (!isListening && transcript.trim()) {
      handleSubmit(transcript.trim(), 'voice')
      clearTranscript()
    }
  }, [isListening]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(text, inputMethod = 'text') {
    const trimmed = (text || inputText).trim()
    if (!trimmed || isLoading) return
    setInputText('')
    clearTranscript()
    sendUserMessage(trimmed, inputMethod)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function toggleMic() {
    if (isListening) stopListening()
    else startListening()
  }

  function handleNewConversation() {
    clearConversation()
    setNativeLang(null)
    setInputText('')
    clearTranscript()
  }

  if (!nativeLang) {
    return (
      <div className="app">
        <header className="header">
          <h1>🇪🇸 CatalanTutor</h1>
          <p className="subtitle">Practica el català amb IA</p>
        </header>
        <main className="lang-selector">
          <p className="lang-selector__prompt">
            What's your native language?<br />
            ¿Cuál es tu idioma nativo?<br />
            Quina és la teva llengua materna?
          </p>
          <div className="lang-selector__grid">
            {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
              <button
                key={code}
                className="lang-btn"
                onClick={() => setNativeLang(code)}
              >
                <span className="lang-btn__flag">{cfg.flag}</span>
                <span className="lang-btn__label">{cfg.label}</span>
                <span className="lang-btn__tagline">{cfg.tagline}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🇪🇸 CatalanTutor</h1>
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
        <button
          className={`btn-mic ${isListening ? 'btn-mic--active' : ''} ${!isSupported ? 'btn-mic--disabled' : ''}`}
          onClick={toggleMic}
          disabled={!isSupported || isLoading}
          title={!isSupported ? 'Speech recognition not supported in this browser' : isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? '⏹' : '🎙'}
        </button>

        <textarea
          className="text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? lang.listening : lang.placeholder}
          disabled={isLoading}
          rows={1}
        />

        <button
          className="btn-send"
          onClick={() => handleSubmit()}
          disabled={!inputText.trim() || isLoading}
        >
          Enviar
        </button>
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
