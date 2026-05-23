# ⚽ Sports Chatbot - Tu Asistente Deportivo 🏀

Un chatbot deportivo interactivo construido con Next.js 16, React, TypeScript y Tailwind CSS. Proporciona noticias deportivas en tiempo real e información sobre varios deportes.

## 🎯 Características

- 📰 **Noticias en tiempo real**: Obtén las últimas noticias deportivas usando la API de ESPN
- 📊 **Panel de noticias lateral**: Panel izquierdo con noticias deportivas actualizadas automáticamente
- ⚽ **Múltiples deportes**: Información sobre fútbol, baloncesto, tenis, F1 y más
- 💬 **Interfaz de chat moderna**: Diseño intuitivo con temática deportiva
- 🎨 **Diseño atractivo**: Interfaz con gradientes verdes y estilo profesional
- ⚡ **Rendimiento optimizado**: Construido con las últimas tecnologías de Next.js
- 📱 **Responsive**: Diseño de dos columnas en desktop, apilado en móvil

## 🚀 Tecnologías Utilizadas

- **Next.js 16** - Framework React con App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **ESPN API** - Fuente de noticias deportivas

## 📦 Instalación

1. Clona el repositorio o navega al directorio del proyecto:
```bash
cd sports-chatbot
```

2. Instala las dependencias:
```bash
npm install
# o
yarn install
# o
pnpm install
```

## 🎮 Cómo Usar

1. Inicia el servidor de desarrollo:
```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

2. Abre tu navegador en [http://localhost:3000](http://localhost:3000)

3. Interactúa con la aplicación:
   - **Panel izquierdo**: Revisa las noticias deportivas actualizadas automáticamente
   - **Click en noticias**: Abre el artículo completo en una nueva pestaña
   - **Botón de actualizar**: Refresca las noticias manualmente
   - **Chatbot derecho**: Escribe "noticias" para ver las últimas noticias deportivas
   - Pregunta sobre deportes específicos: "fútbol", "baloncesto", "tenis", "F1"
   - Usa los botones de acceso rápido para preguntas comunes
   - Escribe "ayuda" para ver todos los comandos disponibles

## 🏗️ Estructura del Proyecto

```
sports-chatbot/
├── app/
│   ├── _components/
│   │   ├── SportsChatbot.tsx     # Componente principal del chatbot
│   │   └── SportsNewsPanel.tsx   # Panel lateral de noticias deportivas
│   ├── api/
│   │   └── sports-news/
│   │       └── route.ts          # API endpoint para noticias deportivas
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Página principal con diseño de dos columnas
│   └── globals.css               # Estilos globales
├── public/                       # Archivos estáticos
└── package.json                 # Dependencias del proyecto
```

## 🔧 Funcionalidades del Chatbot

El chatbot puede responder a:

- 📰 **Noticias deportivas**: Últimas noticias de ESPN
- ⚽ **Fútbol**: Información sobre ligas, equipos y jugadores
- 🏀 **Baloncesto**: Datos de la NBA y equipos destacados
- 🎾 **Tenis**: Información sobre jugadores y torneos
- 🏎️ **Fórmula 1**: Noticias y clasificaciones
- ❓ **Ayuda**: Lista de comandos disponibles

## 📰 Panel de Noticias

El panel izquierdo de noticias incluye:

- **Noticias en tiempo real**: Se actualiza automáticamente desde ESPN
- **Imágenes**: Cada noticia incluye su imagen destacada
- **Categorías variadas**: Fútbol, cricket, béisbol, baloncesto y más
- **Enlaces directos**: Click en cualquier noticia para leer el artículo completo
- **Botón de actualización**: Refrescar manualmente las noticias
- **Fechas formateadas**: Muestra cuándo fue publicada cada noticia
- **Diseño scrollable**: Navega fácilmente por todas las noticias

## 🎨 Características de Diseño

- **Layout de dos columnas**: Panel izquierdo para noticias, derecho para chat
- Interfaz con temática deportiva (colores verdes y esmeralda)
- Gradientes modernos y sombras elegantes
- Animaciones suaves y transiciones
- Diseño responsive para todos los dispositivos
- Iconos deportivos y emojis para mejor experiencia visual
- Panel de noticias con imágenes y actualización automática

## 📝 API Integration

El proyecto utiliza la API de ESPN NOW para obtener noticias deportivas:
- Endpoint: `https://now.core.api.espn.com/v1/sports/news`
- Cache: 5 minutos para optimizar el rendimiento
- Fallback: Noticias mock si la API falla

## 🚀 Deploy

La forma más fácil de desplegar es usando [Vercel](https://vercel.com/new):

```bash
npm run build
```

O sigue la [documentación de despliegue de Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para otras plataformas.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🔗 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [ESPN API Documentation](https://github.com/pseudo-r/Public-ESPN-API)

---

¡Disfruta usando tu asistente deportivo! 🏆
