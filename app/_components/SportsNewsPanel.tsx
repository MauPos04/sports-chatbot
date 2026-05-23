'use client'

import { useCallback, useEffect, useState } from 'react'

interface NewsItem {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
  image: string | null
}

export default function SportsNewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiddenImages, setHiddenImages] = useState<Set<string>>(new Set())

  const loadNews = useCallback(async () => {
    try {
      const response = await fetch('/api/sports-news')
      if (!response.ok) throw new Error('Failed to fetch news')
      const data = await response.json()
      setNews(data.articles || [])
      setHiddenImages(new Set())
      setError(null)
    } catch (err) {
      setError('Error al cargar noticias')
      console.error('Error fetching news:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchNews = async () => {
    setIsLoading(true)
    await loadNews()
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadNews, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadNews])

  const hideBrokenImage = (image: string) => {
    setHiddenImages((current) => new Set(current).add(image))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return (
    <div className="h-full bg-gradient-to-b from-green-800 to-emerald-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border-4 border-green-600">
      {/* Header del Panel */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-lg">
            📰
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Noticias Deportivas</h3>
            <p className="text-green-100 text-xs">Últimas noticias de ESPN</p>
          </div>
        </div>
        <button
          onClick={fetchNews}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          title="Actualizar noticias"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Lista de Noticias */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-white/20 rounded mb-2 w-1/2"></div>
                <div className="h-3 bg-white/20 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-white/80 text-sm">{error}</p>
            <button
              onClick={fetchNews}
              className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-white/80 text-sm">No hay noticias disponibles</p>
          </div>
        ) : (
          news.map((item, index) => {
            const visibleImage = item.image && !hiddenImages.has(item.image) ? item.image : null

            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer group"
                onClick={() => window.open(item.url, '_blank')}
              >
                {visibleImage && (
                  <div className="mb-3 rounded-lg overflow-hidden">
                    <img
                      src={visibleImage}
                      alt={item.title}
                      onError={() => hideBrokenImage(visibleImage)}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <h4 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-green-200 transition-colors">
                  {item.title}
                </h4>
                <p className="text-green-100 text-xs line-clamp-2 mb-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-green-200 text-xs font-medium">
                    {item.source}
                  </span>
                  <span className="text-green-200/70 text-xs" suppressHydrationWarning>
                    {formatDate(item.publishedAt)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-green-900/50 px-4 py-3 border-t border-green-700">
        <p className="text-center text-green-200 text-xs">
          Powered by ESPN API • Actualizado automáticamente
        </p>
      </div>
    </div>
  )
}
