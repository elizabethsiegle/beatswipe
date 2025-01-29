# BeatSwipe 🎵

A real-time multiplayer rhythm game built with Cloudflare Workers, Durable Objects, and WebSocket technology. Players use their phones as controllers to catch musical notes and avoid obstacles in a synchronized gaming experience.

## Features 🌟

- Real-time multiplayer gameplay using WebSocket connections
- Mobile-friendly controller interface
- AI-generated usernames using Cloudflare's AI capabilities
- Live leaderboard system
- Retro-styled neon visual design
- Cross-device compatibility
- Persistent score tracking

## Technology Stack 🛠️

- **Backend:**
  - Cloudflare Workers
  - Durable Objects (for state management)
  - WebSocket API
  - Cloudflare AI (for username generation)

- **Frontend:**
  - Pure JavaScript
  - HTML5
  - CSS3 (with animations)

## How to Play 🎮

1. **Host:**
   - Visit the main game page
   - Wait for players to join
   - Click "Start Game" when ready

2. **Players:**
   - Visit the `/play` URL on your mobile device
   - Tap the screen once to connect
   - Move your finger around to control your character
   - Catch musical notes (🎵) for points
   - Avoid obstacles (🌵) to prevent losing points

## Game Rules 📋

- Each game session lasts 20 seconds
- Catching musical notes: +10 points
- Hitting obstacles: -50 points
- Highest score wins!

## Development 💻

### Prerequisites

- Node.js
- Wrangler CLI (Cloudflare Workers toolkit)
- Cloudflare account

### Setup

1. Clone the repository:
```bash
git clone https://github.com/elizabethsiegle/beatswipe.git
```

2. Install dependencies:
```bash
npm install
```

3. Configure your Cloudflare credentials:
```bash
wrangler login
```

3. Run the development server:
```bash
npm run dev
```

### Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Architecture 🏗️

- `worker.ts`: Main Worker script handling routing and WebSocket connections
- `game_session.ts`: Durable Object implementation for game state management
- Static HTML/CSS/JS for game interface and controller

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.


