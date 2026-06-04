import { useState, useEffect, useRef } from 'react'
import { useConversation } from './hooks/useConversation'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import './App.css'

export default function App() {
  const { messages, isLoading, error, sendUserMessage, clearConversation } = useConversation()
  const { transcript, isListening, isSupported, startListening, stopListening, clearTranscript } =
    useSpeechRecognition()
  const [inputText, setInputText] = useState('')
  const bottomRef = useRef(null)

  // Keep input in sync with live transcript
  useEffect(() => {
    if (transcript) setInputText(transcript)
  }, [transcript])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // When mic stops and we have a transcript, auto-submit
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
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🇪🇸 CatalanTutor</h1>
        <p className="subtitle">Practica el català amb IA</p>
        {messages.length > 0 && (
          <button className="btn-clear" onClick={clearConversation}>
            Nova conversa
          </button>
        )}
      </header>

      <main className="chat-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Bon dia! Comença a escriure o prem el micròfon per parlar en català.</p>
            <p className="hint">Try: "Hola, em dic [name]. Puc practicar català contigo?"</p>
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
          placeholder={isListening ? 'Escoltant…' : 'Escriu en català… (Enter per enviar)'}
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
  // Split off the correction line so it can be styled differently
  const correctionMatch = content.split(/(✏️ Correcció:.*)$/s)
  if (correctionMatch.length < 2) return <p>{content}</p>
  return (
    <>
      <p>{correctionMatch[0].trim()}</p>
      <p className="correction">{correctionMatch[1].trim()}</p>
    </>
  )
}
