'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface NewsItem {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
}

export default function SportsChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '¡Hola! 👋 Soy tu asistente deportivo. Puedo ayudarte con noticias deportivas, información sobre equipos, jugadores y mucho más. ¿Sobre qué deporte te gustaría saber hoy? ⚽🏀🎾',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getSportsNews = async (sportFilter?: string) => {
    try {
      const response = await fetch('/api/sports-news')
      if (!response.ok) throw new Error('Failed to fetch news')
      const data = await response.json()
      
      let filteredArticles = data.articles || []
      
      // Filtrar por deporte si se especifica
      if (sportFilter) {
        const keywords: { [key: string]: string[] } = {
          'fútbol': ['fútbol', 'soccer', 'football', 'premier', 'la liga', 'champions', 'barcelona', 'real madrid', 'messi', 'ronaldo', 'ligue', 'bundesliga', 'serie a'],
          'baloncesto': ['basket', 'nba', 'baloncesto', 'lebron', 'curry', 'lakers', 'warriors', 'celtics'],
          'tenis': ['tenis', 'djokovic', 'nadal', 'alcaraz', 'federer', 'wimbledon', 'roland garros', 'us open', 'australian open'],
          'beisbol': ['mlb', 'béisbol', 'baseball', 'world series']
        }
        
        const sportKeywords = keywords[sportFilter] || []
        filteredArticles = filteredArticles.filter((article: NewsItem) => {
          const titleLower = article.title.toLowerCase()
          const descLower = article.description?.toLowerCase() || ''
          return sportKeywords.some(keyword => 
            titleLower.includes(keyword) || descLower.includes(keyword)
          )
        })
      }
      
      if (filteredArticles.length > 0) {
        const news = filteredArticles.slice(0, 3).map((article: NewsItem) => 
          `📰 **${article.title}**\n${article.description?.substring(0, 120)}...\n[Leer más](${article.url})`
        ).join('\n\n')
        
        return news
      }
      
      return null
    } catch {
      return null
    }
  }

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Detectar preguntas sobre partidos hoy
    if (lowerMessage.includes('partido') || lowerMessage.includes('partidos') || lowerMessage.includes('hoy') || lowerMessage.includes('juegan') || lowerMessage.includes('encuentro')) {
      // Verificar si menciona un deporte específico
      if (lowerMessage.includes('fútbol') || lowerMessage.includes('futbol') || lowerMessage.includes('soccer')) {
        const news = await getSportsNews('fútbol')
        if (news) {
          return `⚽ **Partidos y noticias de fútbol hoy:**\n\n${news}\n\n¿Quieres saber sobre alguna liga o equipo en específico?`
        }
      } else if (lowerMessage.includes('baloncesto') || lowerMessage.includes('basket') || lowerMessage.includes('nba')) {
        const news = await getSportsNews('baloncesto')
        if (news) {
          return `🏀 **Partidos y noticias de baloncesto hoy:**\n\n${news}\n\n¿Te interesa algún equipo o jugador específico?`
        }
      } else if (lowerMessage.includes('tenis')) {
        const news = await getSportsNews('tenis')
        if (news) {
          return `🎾 **Partidos y noticias de tenis hoy:**\n\n${news}\n\n¿Quieres información sobre algún torneo específico?`
        }
      } else {
        // Si pregunta por partidos en general, mostrar noticias generales
        const news = await getSportsNews()
        if (news) {
          return `🔥 **Partidos y noticias deportivas de hoy:**\n\n${news}\n\nPara noticias específicas de un deporte, menciona: fútbol, baloncesto, tenis, etc.`
        }
      }
      
      return '📅 Actualmente no tengo información específica sobre partidos de hoy. Escribe "noticias" para ver las últimas noticias deportivas disponibles.'
    }
    
    // Respuestas basadas en palabras clave para noticias
    if (lowerMessage.includes('noticia') || lowerMessage.includes('news')) {
      // Verificar si menciona un deporte específico
      if (lowerMessage.includes('fútbol') || lowerMessage.includes('futbol') || lowerMessage.includes('soccer')) {
        const news = await getSportsNews('fútbol')
        if (news) {
          return `⚽ **Últimas noticias de fútbol:**\n\n${news}`
        }
      } else if (lowerMessage.includes('baloncesto') || lowerMessage.includes('basket') || lowerMessage.includes('nba')) {
        const news = await getSportsNews('baloncesto')
        if (news) {
          return `🏀 **Últimas noticias de baloncesto:**\n\n${news}`
        }
      } else if (lowerMessage.includes('tenis')) {
        const news = await getSportsNews('tenis')
        if (news) {
          return `🎾 **Últimas noticias de tenis:**\n\n${news}`
        }
      } else {
        // Noticias generales
        const news = await getSportsNews()
        if (news) {
          return `🔥 **Últimas noticias deportivas:**\n\n${news}`
        }
        return 'Lo siento, no pude obtener noticias en este momento. Intenta más tarde.'
      }
      
      return 'Lo siento, no encontré noticias específicas para ese deporte. Intenta con "noticias" para ver todas las noticias disponibles.'
    }
    
    // Respuestas específicas por deporte con noticias
    if (lowerMessage.includes('fútbol') || lowerMessage.includes('futbol') || lowerMessage.includes('soccer')) {
      const news = await getSportsNews('fútbol')
      if (news) {
        return `⚽ **Noticias de fútbol:**\n\n${news}\n\nEl fútbol es el deporte más popular del mundo. ¿Te gustaría saber sobre alguna liga específica como La Liga, Premier League o Champions League?`
      }
      return '⚽ **Fútbol:** El fútbol es el deporte más popular del mundo. Algunos de los mejores equipos incluyen Real Madrid, Barcelona, Manchester City, Bayern Munich y PSG. ¿Te gustaría saber sobre alguna liga específica como La Liga, Premier League o Champions League?'
    }
    
    if (lowerMessage.includes('baloncesto') || lowerMessage.includes('basket')) {
      const news = await getSportsNews('baloncesto')
      if (news) {
        return `🏀 **Noticias de baloncesto:**\n\n${news}\n\nLa NBA es la liga más importante. ¿Te interesa saber sobre algún equipo o jugador en particular?`
      }
      return '🏀 **Baloncesto:** La NBA es la liga más importante. Equipos como Lakers, Warriors, Celtics y Heat son muy populares. ¿Te interesa saber sobre algún equipo o jugador en particular?'
    }
    
    if (lowerMessage.includes('tenis')) {
      const news = await getSportsNews('tenis')
      if (news) {
        return `🎾 **Noticias de tenis:**\n\n${news}\n\n¿Te gustaría información sobre algún torneo como Wimbledon o Roland Garros?`
      }
      return `🎾 **Tenis:** Novak Djokovic, Rafael Nadal y Carlos Alcaraz dominan el circuito masculino, mientras que Iga Swiatek y Aryna Sabalenka lideran el femenino. ¿Te gustaría información sobre algún torneo como Wimbledon o Roland Garros?`
    }
    
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('help') || lowerMessage.includes('qué puedes')) {
      return `Puedo ayudarte con:

• Noticias deportivas en tiempo real
• Informacion sobre futbol
• Datos de baloncesto y NBA
• Resultados de tenis
• Estadisticas y rankings
• Partidos de hoy

Solo escribe sobre lo que te interesa y te dare informacion actualizada.`
    }
    
    // Respuesta por defecto
    return `Entiendo que te interesa "${userMessage}". Como asistente deportivo, puedo compartirte noticias y información sobre varios deportes. Escribe "noticias" para ver las últimas noticias deportivas, "partidos hoy" para ver los encuentros del día, o pregunta sobre un deporte específico como "fútbol", "baloncesto", "tenis", etc.`
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const botResponse = await generateBotResponse(inputValue)
      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    } catch {
      const errorMessage: Message = {
        id: messages.length + 2,
        text: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-full bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border-4 border-green-600 flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-lg">
          ⚽
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">SportsBot</h2>
          <p className="text-green-100 text-xs flex items-center gap-1">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
            En línea
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-md ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-br-none'
                  : 'bg-white border-2 border-green-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap text-xs leading-relaxed">
                {message.text}
              </p>
              <span className={`text-xs mt-1 block ${
                message.sender === 'user' ? 'text-green-100' : 'text-gray-400'
              }`} suppressHydrationWarning>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-green-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-md">
              <div className="flex gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-green-200 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje sobre deportes..."
            className="flex-1 px-3 py-2 rounded-xl border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-700 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-1 text-sm"
          >
            {isLoading ? (
              <span>Enviando...</span>
            ) : (
              <>
                <span>Enviar</span>
                <span className="text-sm">🚀</span>
              </>
            )}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setInputValue('partidos hoy')}
            className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors"
          >
            📅 Partidos hoy
          </button>
          <button
            onClick={() => setInputValue('noticias')}
            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
          >
            📰 Noticias
          </button>
          <button
            onClick={() => setInputValue('fútbol')}
            className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors"
          >
            ⚽ Fútbol
          </button>
          <button
            onClick={() => setInputValue('baloncesto')}
            className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs hover:bg-orange-200 transition-colors"
          >
            🏀 Baloncesto
          </button>
          <button
            onClick={() => setInputValue('tenis')}
            className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs hover:bg-yellow-200 transition-colors"
          >
            🎾 Tenis
          </button>
          <button
            onClick={() => setInputValue('ayuda')}
            className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition-colors"
          >
            ❓ Ayuda
          </button>
        </div>
      </div>
    </div>
  )
}
