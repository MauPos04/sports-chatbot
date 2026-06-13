import { NextResponse } from 'next/server'

import { getSportsNews, type SportsNewsItem } from '@/app/lib/sports-news'

const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'
const NEWS_BATCH_SIZE = 3
const APP_TIME_ZONE = 'America/Bogota'
const DEFAULT_FREE_MODEL_LIMIT = 5

type HistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatRequestBody = {
  message?: string
  history?: HistoryMessage[]
}

type ChatCompletionResult = {
  reply: string
  model: string
}

type OpenRouterModelInfo = {
  id?: unknown
  name?: unknown
  architecture?: {
    input_modalities?: unknown
    output_modalities?: unknown
  }
}

type FreeModelCandidate = {
  id: string
  score: number
  canUseForText: boolean
}

type ScoreboardLeague = {
  label: string
  url: string
  keywords: string[]
}

type SportsEvent = {
  league: string
  name: string
  status: string
  time: string
  venue: string
}

const SCOREBOARD_LEAGUES: ScoreboardLeague[] = [
  {
    label: 'MLB',
    url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    keywords: ['mlb', 'baseball'],
  },
  {
    label: 'NBA',
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    keywords: ['nba', 'basketball'],
  },
  {
    label: 'NFL',
    url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    keywords: ['nfl', 'football'],
  },
  {
    label: 'NHL',
    url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    keywords: ['nhl', 'hockey'],
  },
  {
    label: 'MLS',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
    keywords: ['mls', 'soccer', 'football'],
  },
]

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

function getConfiguredOpenRouterModels(): string[] {
  const configuredModel = process.env.OPENROUTER_MODEL || DEFAULT_MODEL
  const configuredFallbacks = (process.env.OPENROUTER_FALLBACK_MODELS || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)

  return Array.from(new Set([configuredModel, ...configuredFallbacks]))
}

function getFreeModelLimit(): number {
  const parsed = Number(process.env.OPENROUTER_FREE_MODEL_LIMIT)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_FREE_MODEL_LIMIT
  }

  return Math.min(Math.floor(parsed), 10)
}

function hasTextModality(value: unknown): boolean {
  return Array.isArray(value) && value.includes('text')
}

function scoreFreeModel(id: string, name: string, originalIndex: number): number {
  const searchable = `${id} ${name}`.toLowerCase()
  let score = 1000 - originalIndex

  for (const keyword of ['instruct', 'chat']) {
    if (searchable.includes(keyword)) {
      score += 100
    }
  }

  for (const keyword of ['safety', 'moderation', 'embedding', 'image', 'audio']) {
    if (searchable.includes(keyword)) {
      score -= 500
    }
  }

  return score
}

async function getDynamicFreeOpenRouterModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      console.error(`OpenRouter models request failed: ${response.status}`)
      return []
    }

    const data = await response.json()
    const models = Array.isArray(data?.data) ? data.data : []

    const freeModelCandidates: FreeModelCandidate[] = models
      .map((model: OpenRouterModelInfo, index: number) => {
        const id = typeof model.id === 'string' ? model.id : ''
        const name = typeof model.name === 'string' ? model.name : ''
        const inputModalities = model.architecture?.input_modalities
        const outputModalities = model.architecture?.output_modalities
        const declaresTextModalities =
          hasTextModality(inputModalities) && hasTextModality(outputModalities)
        const hasNoModalityData = inputModalities === undefined && outputModalities === undefined

        return {
          id,
          score: scoreFreeModel(id, name, index),
          canUseForText: declaresTextModalities || hasNoModalityData,
        }
      })

    return freeModelCandidates
      .filter((model) => model.id.endsWith(':free') && model.canUseForText)
      .sort((a, b) => b.score - a.score)
      .slice(0, getFreeModelLimit())
      .map((model) => model.id)
  } catch (error) {
    console.error('OpenRouter models request failed:', error)
    return []
  }
}

async function getOpenRouterModels(apiKey: string): Promise<string[]> {
  const configuredModels = getConfiguredOpenRouterModels()
  const freeModels = await getDynamicFreeOpenRouterModels(apiKey)

  return Array.from(new Set([...configuredModels, ...freeModels]))
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

function getLocalDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatEventTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString))
}

function assistantMessageLooksLikeNews(content: string): boolean {
  const normalized = normalizeText(content)

  return (
    normalized.includes('sports headlines') ||
    normalized.includes('source: espn') ||
    normalized.includes('read more:') ||
    normalized.includes('[read more]')
  )
}

function countDisplayedNewsItems(history: HistoryMessage[]): number {
  return history
    .filter((message) => message.role === 'assistant' && assistantMessageLooksLikeNews(message.content))
    .reduce((total, message) => {
      const numberedItems = message.content.match(/^\d+\.\s/gm)?.length || 0
      const markdownItems = message.content.match(/\[Read more\]/gi)?.length || 0
      const plainLinks = message.content.match(/Read more:/gi)?.length || 0

      return total + Math.max(numberedItems, markdownItems, plainLinks, NEWS_BATCH_SIZE)
    }, 0)
}

function isNewsRequest(message: string, history: HistoryMessage[]): boolean {
  const text = normalizeText(message)
  const lastAssistant = getLastAssistantMessage(history)
  const followsNews = assistantMessageLooksLikeNews(lastAssistant)
  const asksForNews = [
    'news',
    'headline',
    'headlines',
    'latest',
    'what happened today',
    'sports news',
    'noticia',
    'noticias',
  ].some((keyword) => text.includes(keyword))
  const asksForMore = [
    'more',
    'what else',
    'another',
    'next',
    'continue',
    'que mas',
    'que otras',
  ].some((keyword) => text === keyword || text.includes(keyword))

  return asksForNews || (followsNews && asksForMore)
}

function isScheduleRequest(message: string): boolean {
  const text = normalizeText(message)

  return [
    'games today',
    'today games',
    "today's games",
    'matches today',
    'fixtures today',
    'schedule today',
    'who plays today',
    'partidos hoy',
    'juegos hoy',
    'quien juega hoy',
    'nba today',
    'mlb today',
    'nfl today',
    'nhl today',
  ].some((keyword) => text.includes(keyword))
}

function selectScoreboardLeagues(message: string): ScoreboardLeague[] {
  const text = normalizeText(message)
  const selected = SCOREBOARD_LEAGUES.filter((league) =>
    league.keywords.some((keyword) => text.includes(keyword))
  )

  return selected.length > 0 ? selected : SCOREBOARD_LEAGUES
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
    return 'I could not find more fresh ESPN headlines right now. Try asking for a specific sport or check again in a few minutes.'
  }

  const header = offset === 0 ? "Here are today's sports headlines:" : 'Here are more sports headlines:'
  const body = batch
    .map((article, index) => {
      const position = offset + index + 1
      const description = cleanDescription(article.description)

      return [
        `${position}. ${article.title}`,
        description,
        `Source: ${article.source}`,
        `Read more: ${article.url}`,
      ].join('\n')
    })
    .join('\n\n')
  const footer =
    offset + NEWS_BATCH_SIZE < articles.length
      ? 'Type "more" to see additional headlines.'
      : 'Those are the ESPN headlines available right now.'

  return `${header}\n\n${body}\n\n${footer}`
}

function parseScoreboardEvents(data: unknown, league: string): SportsEvent[] {
  if (!data || typeof data !== 'object' || !('events' in data) || !Array.isArray(data.events)) {
    return []
  }

  const todayKey = getLocalDateKey(new Date())

  return data.events
    .filter((event): event is Record<string, unknown> => Boolean(event && typeof event === 'object'))
    .filter((event) => {
      return typeof event.date === 'string' && getLocalDateKey(new Date(event.date)) === todayKey
    })
    .map((event) => {
      const competition =
        Array.isArray(event.competitions) && event.competitions[0] && typeof event.competitions[0] === 'object'
          ? (event.competitions[0] as Record<string, unknown>)
          : {}
      const venue = competition.venue && typeof competition.venue === 'object'
        ? (competition.venue as Record<string, unknown>)
        : {}
      const status = event.status && typeof event.status === 'object'
        ? (event.status as Record<string, unknown>)
        : {}
      const statusType = status.type && typeof status.type === 'object'
        ? (status.type as Record<string, unknown>)
        : {}

      return {
        league,
        name: typeof event.name === 'string' ? event.name : 'Game',
        status: typeof statusType.description === 'string' ? statusType.description : 'Scheduled',
        time: typeof event.date === 'string' ? formatEventTime(event.date) : 'TBD',
        venue: typeof venue.fullName === 'string' ? venue.fullName : 'Venue TBD',
      }
    })
}

async function getScheduleReply(message: string): Promise<string> {
  const leagues = selectScoreboardLeagues(message)
  const results = await Promise.all(
    leagues.map(async (league) => {
      try {
        const response = await fetch(league.url, {
          next: { revalidate: 120 },
        })

        if (!response.ok) {
          return []
        }

        return parseScoreboardEvents(await response.json(), league.label)
      } catch (error) {
        console.error(`Failed to fetch ${league.label} scoreboard:`, error)
        return []
      }
    })
  )
  const events = results.flat().slice(0, 12)

  if (events.length === 0) {
    return [
      "I could not find games scheduled for today in ESPN's MLB, NBA, NFL, NHL, or MLS scoreboards.",
      '',
      'Try asking for sports news, or ask for a specific league like "NBA today" or "MLB today".',
    ].join('\n')
  }

  const body = events
    .map((event, index) => {
      return [
        `${index + 1}. ${event.name}`,
        `${event.league} - ${event.status} at ${event.time}`,
        `Venue: ${event.venue}`,
      ].join('\n')
    })
    .join('\n\n')

  return `Here are games scheduled for today:\n\n${body}`
}

function getLocalFallbackReply(message: string): string {
  const text = normalizeText(message)

  if (text.includes('help') || text.includes('ayuda')) {
    return [
      'I can help with sports headlines, games, teams, players, and general sports questions.',
      '',
      'Try:',
      '1. games today',
      '2. sports news',
      '3. more',
      '4. NBA today',
    ].join('\n')
  }

  return [
    'I could not answer that clearly right now.',
    '',
    'Try asking again, or use "sports news" or "games today" for live ESPN-powered updates.',
  ].join('\n')
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

async function getOpenRouterReply(params: {
  apiKey: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
}): Promise<ChatCompletionResult | null> {
  for (const model of await getOpenRouterModels(params.apiKey)) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Sports Chatbot',
        },
        body: JSON.stringify({
          model,
          temperature: 0.5,
          max_completion_tokens: 350,
          messages: params.messages,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`OpenRouter request failed for ${model}:`, errorText)
        continue
      }

      const data = await response.json()
      const reply = normalizeAssistantReply(data?.choices?.[0]?.message?.content)

      if (!reply) {
        console.error(`OpenRouter returned an empty response for ${model}`)
        continue
      }

      return {
        reply,
        model: data?.model || model,
      }
    } catch (error) {
      console.error(`OpenRouter request failed for ${model}:`, error)
    }
  }

  return null
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

    if (isScheduleRequest(message)) {
      return NextResponse.json({
        reply: await getScheduleReply(message),
        model: 'espn-scoreboard',
      })
    }

    if (isNewsRequest(message, history)) {
      const isFollowUp = assistantMessageLooksLikeNews(lastAssistant) && !normalizeText(message).includes('news')

      return NextResponse.json({
        reply: await getNewsReply(history, isFollowUp),
        model: 'espn-news',
      })
    }

    if (!apiKey) {
      return NextResponse.json({
        reply: getLocalFallbackReply(message),
        model: 'sports-assistant',
      })
    }

    const sportsContext = await getSportsContext()
    const systemPrompt = [
      'You are SportsBot, a helpful sports assistant.',
      'Always reply in the same language as the user\'s last message (match the user\'s language, e.g. Spanish or English).',
      'Be concise, clear, and practical.',
      'Do not use raw Markdown tables. Prefer short paragraphs or numbered lists with plain URLs.',
      'If the user asks for fresh schedules, scores, or live games, tell them to use "games today" so ESPN scoreboard data can be used.',
      'If useful, use these recent ESPN headlines as context:',
      sportsContext || 'No recent headlines were available.',
    ].join('\n')

    const completion = await getOpenRouterReply({
      apiKey,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ],
    })

    if (!completion) {
      return NextResponse.json({
        reply: getLocalFallbackReply(message),
        model: 'sports-assistant',
      })
    }

    return NextResponse.json({
      reply: completion.reply,
      model: completion.model,
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
