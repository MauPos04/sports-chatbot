import SportsChatbot from './_components/SportsChatbot'
import SportsNewsPanel from './_components/SportsNewsPanel'
import { getSportsNews } from './lib/sports-news'

export default async function Home() {
  const { articles } = await getSportsNews(10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white md:text-5xl">
            ⚽ Sports Chatbot 🏀
          </h1>
          <p className="text-lg text-green-100">Your sports assistant for real-time news and game updates</p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-[600px] lg:col-span-1 lg:h-[700px]">
            <SportsNewsPanel initialNews={articles} />
          </div>

          <div className="h-[600px] lg:col-span-2 lg:h-[700px]">
            <SportsChatbot />
          </div>
        </div>
      </div>
    </div>
  )
}
