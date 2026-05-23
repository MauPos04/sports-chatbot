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

const FALLBACK_ARTICLES: SportsNewsItem[] = [
  {
    title: 'Leyendas del futbol: los mejores jugadores de la historia',
    description: 'Un analisis de los futbolistas que han dejado huella imborrable en el deporte rey.',
    url: 'https://www.espn.com/soccer',
    publishedAt: new Date().toISOString(),
    source: 'ESPN Sports',
    image: null,
  },
  {
    title: 'NBA: los equipos favoritos para esta temporada',
    description: 'Analisis de los contendientes al titulo de la NBA este ano.',
    url: 'https://www.espn.com/nba',
    publishedAt: new Date().toISOString(),
    source: 'ESPN Basketball',
    image: null,
  },
  {
    title: 'Tenis: Novak Djokovic continua haciendo historia',
    description: 'El serbio sigue rompiendo records en el circuito profesional de tenis.',
    url: 'https://www.espn.com/tennis',
    publishedAt: new Date().toISOString(),
    source: 'ESPN Tennis',
    image: null,
  },
  {
    title: 'Formula 1: Max Verstappen domina la temporada',
    description: 'El piloto neerlandes de Red Bull Racing muestra su supremacia en la pista.',
    url: 'https://www.espn.com/f1',
    publishedAt: new Date().toISOString(),
    source: 'ESPN F1',
    image: null,
  },
  {
    title: 'Champions League: los mejores momentos de la edicion',
    description: 'Repasamos las jugadas mas destacadas de la maxima competencia europea de clubes.',
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

    const articles = headlines.map((headline) => ({
      title: headline.headline || headline.title || 'Sin titulo',
      description: headline.description || headline.linkText || 'Sin descripcion',
      url: headline.links?.web?.href || headline.links?.mobile?.href || '#',
      publishedAt: headline.published || headline.originallyPosted || new Date().toISOString(),
      source: 'ESPN',
      image: headline.images?.[0]?.url || null,
    }))

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
