import { NextResponse } from 'next/server'

const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const ESPN_NEWS_URL = 'https://now.core.api.espn.com/v1/sports/news?limit=5'

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

async function getSportsContext(): Promise<string> {
  try {
    const response = await fetch(ESPN_NEWS_URL, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return ''
    }

    const data = await response.json()
    const headlines = Array.isArray(data.headlines) ? data.headlines.slice(0, 5) : []

    if (headlines.length === 0) {
      return ''
    }

    return headlines
      .map((headline: Record<string, unknown>, index: number) => {
        const title =
          typeof headline.headline === 'string'
            ? headline.headline
            : typeof headline.title === 'string'
              ? headline.title
              : 'Titular deportivo'

        const description =
          typeof headline.description === 'string'
            ? headline.description
            : typeof headline.linkText === 'string'
              ? headline.linkText
              : ''

        const summary = description ? `: ${description}` : ''
        return `${index + 1}. ${title}${summary}`
      })
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

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing OpenRouter API key. Add `openrouter` to your .env file.' },
        { status: 500 }
      )
    }

    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL
    const sportsContext = await getSportsContext()
    const history = normalizeHistory(body.history)
    const systemPrompt = [
      'You are SportsBot, a helpful sports assistant.',
      'Always answer in Spanish.',
      'Be concise, clear, and practical.',
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
