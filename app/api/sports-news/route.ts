import { NextResponse } from 'next/server'

interface EspnHeadline {
  headline?: string
  title?: string
  description?: string
  linkText?: string
  links?: {
    web?: { href?: string }
    mobile?: { href?: string }
  }
  published?: string
  originallyPosted?: string
  images?: { url?: string }[]
}

async function getWorkingImageUrl(headline: EspnHeadline) {
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

export async function GET() {
  try {
    // Usar la API de ESPN NOW para noticias deportivas en tiempo real
    const espnResponse = await fetch('https://now.core.api.espn.com/v1/sports/news?limit=10', {
      next: { revalidate: 300 } // Cache por 5 minutos
    })

    if (!espnResponse.ok) {
      throw new Error('ESPN API request failed')
    }

    const espnData = await espnResponse.json()

    // Transformar los datos de ESPN NOW al formato que necesitamos
    const articles = await Promise.all(((espnData.headlines as EspnHeadline[] | undefined) || []).map(async (headline) => ({
      title: headline.headline || headline.title || 'Sin título',
      description: headline.description || headline.linkText || 'Sin descripción',
      url: headline.links?.web?.href || headline.links?.mobile?.href || '#',
      publishedAt: headline.published || headline.originallyPosted || new Date().toISOString(),
      source: 'ESPN',
      image: await getWorkingImageUrl(headline)
    })))

    return NextResponse.json({
      articles: articles.slice(0, 10),
      source: 'ESPN NOW API'
    })

  } catch (error) {
    console.error('Error fetching sports news:', error)
    
    // Fallback a un conjunto de noticias mock si la API falla
    const mockArticles = [
      {
        title: 'Leyendas del fútbol: Los mejores jugadores de la historia',
        description: 'Un análisis de los futbolistas que han dejado huella imborrable en el deporte rey.',
        url: 'https://www.espn.com/soccer',
        publishedAt: new Date().toISOString(),
        source: 'ESPN Sports'
      },
      {
        title: 'NBA: Los equipos favoritos para esta temporada',
        description: 'Análisis de los contendientes al título de la NBA este año.',
        url: 'https://www.espn.com/nba',
        publishedAt: new Date().toISOString(),
        source: 'ESPN Basketball'
      },
      {
        title: 'Tenis: Novak Djokovic continúa haciendo historia',
        description: 'El serbio sigue rompiendo récords en el circuito profesional de tenis.',
        url: 'https://www.espn.com/tennis',
        publishedAt: new Date().toISOString(),
        source: 'ESPN Tennis'
      },
      {
        title: 'Fórmula 1: Max Verstappen domina la temporada',
        description: 'El piloto neerlandés de Red Bull Racing muestra su supremacía en la pista.',
        url: 'https://www.espn.com/f1',
        publishedAt: new Date().toISOString(),
        source: 'ESPN F1'
      },
      {
        title: 'Champions League: Los mejores momentos de la edición',
        description: 'Repasamos las jugadas más destacadas de la máxima competencia europea de clubes.',
        url: 'https://www.espn.com/soccer',
        publishedAt: new Date().toISOString(),
        source: 'ESPN Soccer'
      }
    ]

    return NextResponse.json({
      articles: mockArticles,
      source: 'fallback'
    })
  }
}

export const dynamic = 'force-dynamic'
