'use client'

import SportsChatbot from './_components/SportsChatbot'
import SportsNewsPanel from './_components/SportsNewsPanel'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            ⚽ Sports Chatbot 🏀
          </h1>
          <p className="text-green-100 text-lg">
            Tu asistente deportivo con noticias en tiempo real
          </p>
        </header>
        
        {/* Layout de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo de noticias - 1 columna en móvil, 1 de 3 en desktop */}
          <div className="lg:col-span-1 h-[600px] lg:h-[700px]">
            <SportsNewsPanel />
          </div>
          
          {/* Panel derecho del chatbot - 1 columna en móvil, 2 de 3 en desktop */}
          <div className="lg:col-span-2 h-[600px] lg:h-[700px]">
            <SportsChatbot />
          </div>
        </div>
      </div>
    </div>
  )
}
