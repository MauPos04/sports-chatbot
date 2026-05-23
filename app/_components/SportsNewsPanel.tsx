'use client'

import { useCallback, useEffect, useState } from 'react'

import type { SportsNewsItem } from '@/app/lib/sports-news'

interface SportsNewsPanelProps {
  initialNews: SportsNewsItem[]
}

export default function SportsNewsPanel({ initialNews }: SportsNewsPanelProps) {
  const [news, setNews] = useState<SportsNewsItem[]>(initialNews)
  const [isLoading, setIsLoading] = useState(false)
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
      setError('Unable to load news')
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
      hour12: false,
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border-4 border-green-600 bg-gradient-to-b from-green-800 to-emerald-900 shadow-2xl">
      <div className="flex items-center justify-between bg-gradient-to-r from-green-700 to-emerald-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-green-700 shadow-lg">
            📰
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Sports News</h3>
            <p className="text-xs text-green-100">Latest headlines from ESPN</p>
          </div>
        </div>
        <button
          onClick={() => void fetchNews()}
          className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"
          title="Refresh news"
        >
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm animate-pulse">
                <div className="mb-2 h-4 w-3/4 rounded bg-white/20"></div>
                <div className="mb-2 h-3 w-1/2 rounded bg-white/20"></div>
                <div className="h-3 w-1/4 rounded bg-white/20"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">⚠️</div>
            <p className="text-sm text-white/80">{error}</p>
            <button
              onClick={() => void fetchNews()}
              className="mt-3 rounded-lg bg-white/20 px-4 py-2 text-sm text-white transition-colors hover:bg-white/30"
            >
              Try again
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">🗞️</div>
            <p className="text-sm text-white/80">No news available</p>
          </div>
        ) : (
          news.map((item, index) => {
            const visibleImage = item.image && !hiddenImages.has(item.image) ? item.image : null

            return (
              <div
                key={`${item.url}-${index}`}
                className="group cursor-pointer rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-all hover:bg-white/20"
                onClick={() => window.open(item.url, '_blank')}
              >
                {visibleImage && (
                  <div className="mb-3 overflow-hidden rounded-lg">
                    {/* ESPN serves images from multiple CDNs, so native img keeps fallback handling simple. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={visibleImage}
                      alt={item.title}
                      onError={() => hideBrokenImage(visibleImage)}
                      className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <h4 className="mb-2 line-clamp-2 text-sm font-semibold text-white transition-colors group-hover:text-green-200">
                  {item.title}
                </h4>
                <p className="mb-2 line-clamp-2 text-xs text-green-100">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-green-200">{item.source}</span>
                  <span className="text-xs text-green-200/70" suppressHydrationWarning>
                    {formatDate(item.publishedAt)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-green-700 bg-green-900/50 px-4 py-3">
        <p className="text-center text-xs text-green-200">Powered by ESPN API - Manually refreshed</p>
      </div>
    </div>
  )
}
