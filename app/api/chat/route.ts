import { NextResponse } from 'next/server'

import { getSportsNews, type SportsNewsItem } from '@/app/lib/sports-news'

const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const NEWS_BATCH_SIZE = 3

type HistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatRequestBody = {
  message?: string
  history?: HistoryMessage[]
}

function normalizeHistory(history: unknown): HistoryMessage[] {
  if (!Array.isArray(history)) {
    return []
  }

  return history
    .filter((item): item is HistoryMessage => {
      return Boolean(
        item &&
          typeof item === 'object' &&
          'role' in item &&
          'content' in item &&
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.content === 'string'
      )
    })
    .slice(-8)
}

function normalizeAssistantReply(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim()
  }

  if (!Array.isArray(content)) {
    return ''
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part
      }

      if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
        return part.text
      }

      return ''
    })
    .join('\n')
    .trim()
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getLastAssistantMessage(history: HistoryMessage[]): string {
  return [...history].reverse().find((message) => message.role === 'assistant')?.content || ''
}

function assistantMessageLooksLikeNews(content: string): boolean {
  const normalized = normalizeText(content)

  return (
    normalized.includes('noticias deportivas') ||
    normalized.includes('fuente: espn') ||
    normalized.includes('leer mas:') ||
    normalized.includes('[leer mas]')
  )
}

function countDisplayedNewsItems(history: HistoryMessage[]): number {
  return history
    .filter((message) => message.role === 'assistant' && assistantMessageLooksLikeNews(message.content))
    .reduce((total, message) => {
      const numberedItems = message.content.match(/^\d+\.\s/gm)?.length || 0
      const markdownItems = message.content.match(/\[Leer m[aá]s\]/gi)?.length || 0
      const plainLinks = message.content.match(/Leer m[aá]s:/gi)?.length || 0

      return total + Math.max(numberedItems, markdownItems, plainLinks, NEWS_BATCH_SIZE)
    }, 0)
}

function isNewsRequest(message: string, history: HistoryMessage[]): boolean {
  const text = normalizeText(message)
  const lastAssistant = getLastAssistantMessage(history)
  const followsNews = assistantMessageLooksLikeNews(lastAssistant)
  const asksForNews = [
    'noticia',
    'noticias',
    'titular',
    'titulares',
    'que hay hoy',
    'que paso hoy',
    'actualidad',
  ].some((keyword) => text.includes(keyword))
  const asksForMore = [
    'que mas',
    'que otras',
    'que otra',
    'otra mas',
    'otras mas',
    'mas',
    'siguiente',
    'continua',
    'continuar',
  ].some((keyword) => text === keyword || text.includes(keyword))

  return asksForNews || (followsNews && asksForMore)
}

function cleanDescription(description: string): string {
  const normalized = description.replace(/\s+/g, ' ').trim()

  if (normalized.length <= 180) {
    return normalized
  }

  return `${normalized.slice(0, 177).trim()}...`
}

function formatNewsReply(articles: SportsNewsItem[], offset: number): string {
  const batch = articles.slice(offset, offset + NEWS_BATCH_SIZE)

  if (batch.length === 0) {
    return 'No encontre mas noticias nuevas en ESPN ahora mismo. Puedes pedirme noticias de un deporte especifico o intentar de nuevo en unos minutos.'
  }

  const header =
    offset === 0
      ? 'Estas son noticias deportivas de hoy:'
      : 'Estas son otras noticias deportivas:'
  const body = batch
    .map((article, index) => {
      const position = offset + index + 1
      const description = cleanDescription(article.description)

      return [
        `${position}. ${article.title}`,
        description,
        `Fuente: ${article.source}`,
        `Leer mas: ${article.url}`,
      ].join('\n')
    })
    .join('\n\n')
  const footer =
    offset + NEWS_BATCH_SIZE < articles.length
      ? 'Escribe "que mas" para ver otras noticias.'
      : 'Por ahora esas son las noticias disponibles en ESPN.'

  return `${header}\n\n${body}\n\n${footer}`
}

async function getNewsReply(history: HistoryMessage[], isFollowUp: boolean): Promise<string> {
  const { articles } = await getSportsNews(12)
  const offset = isFollowUp ? countDisplayedNewsItems(history) : 0

  return formatNewsReply(articles, offset)
}

async function getSportsContext(): Promise<string> {
  try {
    const { articles } = await getSportsNews(5)

    if (articles.length === 0) {
      return ''
    }

    return articles
      .map((article, index) => `${index + 1}. ${article.title}: ${article.description}`)
      .join('\n')
  } catch (error) {
    console.error('Failed to fetch ESPN context for chat:', error)
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody
    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    const apiKey = process.env.openrouter || process.env.OPENROUTER_API_KEY
    const history = normalizeHistory(body.history)
    const lastAssistant = getLastAssistantMessage(history)

    if (isNewsRequest(message, history)) {
      const isFollowUp = assistantMessageLooksLikeNews(lastAssistant) && !normalizeText(message).includes('noticia')

      return NextResponse.json({
        reply: await getNewsReply(history, isFollowUp),
        model: 'espn-news',
      })
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing OpenRouter API key. Add `openrouter` to your .env file.' },
        { status: 500 }
      )
    }

    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL
    const sportsContext = await getSportsContext()
    const systemPrompt = [
      'You are SportsBot, a helpful sports assistant.',
      'Always answer in Spanish.',
      'Be concise, clear, and practical.',
      'Do not use raw Markdown tables. Prefer short paragraphs or numbered lists with plain URLs.',
      'If the user asks for fresh or live information and it is not present in the provided context, say so clearly.',
      'If useful, use these recent ESPN headlines as context:',
      sportsContext || 'No recent headlines were available.',
    ].join('\n')

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Sports Chatbot',
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_completion_tokens: 350,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter request failed:', errorText)
      return NextResponse.json(
        { error: 'OpenRouter request failed.', details: errorText },
        { status: 502 }
      )
    }

    const data = await response.json()
    const reply = normalizeAssistantReply(data?.choices?.[0]?.message?.content)

    if (!reply) {
      return NextResponse.json(
        { error: 'OpenRouter returned an empty response.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      reply,
      model: data?.model || model,
    })
  } catch (error) {
    console.error('Chat route failed:', error)
    return NextResponse.json(
      { error: 'Unable to process the chat request right now.' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
