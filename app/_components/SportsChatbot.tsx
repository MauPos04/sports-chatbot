'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

const quickPrompts = ['partidos hoy', 'noticias de futbol', 'NBA hoy', 'tenis', 'ayuda']

function buildHistory(messages: Message[]): ChatHistoryItem[] {
  return messages.map((message) => ({
    role: message.sender === 'user' ? 'user' : 'assistant',
    content: message.text,
  }))
}

function createMessage(text: string, sender: 'user' | 'bot'): Message {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    text,
    sender,
    timestamp: new Date(),
  }
}

function renderInlineText(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const pattern = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/\S+))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      parts.push(
        <strong key={`${match.index}-strong`} className="font-semibold">
          {match[2]}
        </strong>
      )
    } else {
      const label = match[3] || match[5]
      const href = match[4] || match[5]

      parts.push(
        <a
          key={`${match.index}-link`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-green-700 underline decoration-green-300 underline-offset-2 hover:text-green-800"
        >
          {label}
        </a>
      )
    }

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function renderMessageText(text: string): ReactNode {
  return text.split('\n').map((line, index) =>
    line.trim() ? (
      <span key={index} className="block">
        {renderInlineText(line)}
      </span>
    ) : (
      <span key={index} className="block h-2" />
    )
  )
}

export default function SportsChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    createMessage(
      'Hola. Soy tu asistente deportivo. Puedo ayudarte con noticias, equipos, jugadores, ligas y preguntas generales de deportes. Que te gustaria consultar hoy?',
      'bot'
    ),
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (prefilledMessage?: string) => {
    const trimmedMessage = (prefilledMessage ?? inputValue).trim()

    if (!trimmedMessage || isLoading) {
      return
    }

    const userMessage = createMessage(trimmedMessage, 'user')
    const history = buildHistory(messages)

    setMessages((currentMessages) => [...currentMessages, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage,
          history,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'The chat request failed.')
      }

      const botMessage = createMessage(
        typeof data.reply === 'string' ? data.reply : 'No pude generar una respuesta en este momento.',
        'bot'
      )

      setMessages((currentMessages) => [...currentMessages, botMessage])
    } catch (error) {
      console.error('Chat request failed:', error)
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(
          'No pude responder en este momento. Revisa la configuracion de OpenRouter e intenta de nuevo.',
          'bot'
        ),
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSendMessage()
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border-4 border-green-600 bg-white/95 shadow-2xl backdrop-blur-lg">
      <div className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-green-700 shadow-lg">
          🏆
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">SportsBot</h2>
          <p className="flex items-center gap-1 text-xs text-green-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-300"></span>
            OpenRouter activo
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-md ${
                message.sender === 'user'
                  ? 'rounded-br-none bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'rounded-bl-none border-2 border-green-100 bg-white text-gray-800'
              }`}
            >
              <div className="text-xs leading-relaxed">{renderMessageText(message.text)}</div>
              <span
                className={`mt-1 block text-xs ${
                  message.sender === 'user' ? 'text-green-100' : 'text-gray-400'
                }`}
                suppressHydrationWarning
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-none border-2 border-green-100 bg-white px-4 py-3 shadow-md">
              <div className="flex gap-2">
                <span className="h-2 w-2 animate-bounce rounded-full bg-green-500" style={{ animationDelay: '0s' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-green-500" style={{ animationDelay: '0.2s' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-green-500" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t-2 border-green-200 bg-gradient-to-r from-gray-50 to-gray-100 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje sobre deportes..."
            className="flex-1 rounded-xl border-2 border-green-300 px-3 py-2 text-sm text-gray-700 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-200"
            disabled={isLoading}
          />
          <button
            onClick={() => void handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{isLoading ? 'Enviando...' : 'Enviar'}</span>
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void handleSendMessage(prompt)}
              className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 transition-colors hover:bg-green-200"
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
