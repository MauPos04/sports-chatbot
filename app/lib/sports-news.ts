export interface SportsNewsItem {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
  image: string | null
}

type EspnHeadline = {
  headline?: string
  title?: string
  description?: string
  linkText?: string
  published?: string
  originallyPosted?: string
  links?: {
    web?: { href?: string }
    mobile?: { href?: string }
  }
  images?: Array<{ url?: string }>
}

async function getWorkingImageUrl(headline: EspnHeadline): Promise<string | null> {
  for (const image of headline.images || []) {
    if (!image.url) continue

    try {
      const response = await fetch(image.url, { method: 'HEAD' })
      const contentType = response.headers.get('content-type') || ''

      if (response.ok && contentType.startsWith('image/')) {
        return image.url
      }
    } catch {
      continue
    }
  }

  return null
}

const FALLBACK_ARTICLES: SportsNewsItem[] = [
  {
    title: 'Soccer legends: the best players in history',
    description: 'A look at the players who shaped the world game.',
    url: 'https://www.espn.com/soccer',
    publishedAt: new Date().toISOString(),
    source: 'ESPN Sports',
    image: null,
  },
  {
    title: 'NBA: title favorites this season',
    description: 'A look at the strongest contenders for this year NBA title.',
    url: 'https://www.espn.com/nba',
    publishedAt: new Date().toISOString(),
    source: 'ESPN Basketball',
    image: null,
  },
  {
    title: 'Tennis: Novak Djokovic continues making history',
    description: 'The Serbian star keeps setting records on the professional tennis tour.',
    url: 'https://www.espn.com/tennis',
    publishedAt: new Date().toISOString(),
    source: 'ESPN Tennis',
    image: null,
  },
  {
    title: 'Formula 1: Max Verstappen controls the season',
    description: 'The Red Bull Racing driver continues to show his pace on track.',
    url: 'https://www.espn.com/f1',
    publishedAt: new Date().toISOString(),
    source: 'ESPN F1',
    image: null,
  },
  {
    title: 'Champions League: best moments of the edition',
    description: 'A recap of standout plays from Europe top club competition.',
    url: 'https://www.espn.com/soccer',
    publishedAt: new Date().toISOString(),
    source: 'ESPN Soccer',
    image: null,
  },
]

export async function getSportsNews(limit = 10): Promise<{
  articles: SportsNewsItem[]
  source: string
}> {
  try {
    const response = await fetch(`https://now.core.api.espn.com/v1/sports/news?limit=${limit}`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error('ESPN API request failed')
    }

    const espnData = await response.json()
    const headlines: EspnHeadline[] = Array.isArray(espnData.headlines) ? espnData.headlines : []

    const articles = await Promise.all(headlines.map(async (headline) => ({
      title: headline.headline || headline.title || 'Untitled headline',
      description: headline.description || headline.linkText || 'No description available',
      url: headline.links?.web?.href || headline.links?.mobile?.href || '#',
      publishedAt: headline.published || headline.originallyPosted || new Date().toISOString(),
      source: 'ESPN',
      image: await getWorkingImageUrl(headline),
    })))

    return {
      articles: articles.slice(0, limit),
      source: 'ESPN NOW API',
    }
  } catch (error) {
    console.error('Error fetching sports news:', error)

    return {
      articles: FALLBACK_ARTICLES.slice(0, limit),
      source: 'fallback',
    }
  }
}

export async function getSportsHeadlinesContext(limit = 5): Promise<string> {
  const { articles } = await getSportsNews(limit)

  return articles
    .slice(0, limit)
    .map((article, index) => `${index + 1}. ${article.title}: ${article.description}`)
    .join('\n')
}
