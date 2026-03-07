# 🎵 Spotifight

> A real-time multiplayer music game powered by Spotify

**Spotifight** is a social music game where players listen to music together and compete in rhythm-based challenges. Connect your Spotify Premium account, gather your friends, and let the music battle begin!

## ✨ Features

- 🎮 **Real-time Multiplayer** - Create or join rooms with simple 4-digit codes
- 🎧 **Synchronized Music Playback** - All players hear music at the same time via Spotify
- 🎯 **Music Pairs Game Mode** - Find your musical match by identifying who heard the same song
- 📱 **Mobile-Friendly** - Play on any device with wake lock support to prevent screen sleep
- 🔄 **Instant Reconnection** - Automatically rejoin if you lose connection
- 📊 **Live Scoring** - Track points in real-time across multiple rounds
- 🔗 **QR Code Sharing** - Easy room joining via QR codes

## 🎮 How to Play

### Music Pairs

1. **Create a Room** - One player becomes the host and creates a game room
2. **Invite Friends** - Share the 4-digit room code or QR code
3. **Connect Spotify** - All players must have Spotify Premium and connect their accounts
4. **Listen & Match** - Each pair of players hears the same song (but different from other pairs!)
5. **Find Your Pair** - Select who you think heard your song
6. **Score Points** - Both players in a correct match earn 2 points
7. **Play Rounds** - Keep playing to rack up the highest score!

**Pro tip:** If there's an odd number of players, one lucky person gets their own unique song (and can still score by selecting themselves!)

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm/pnpm/yarn
- **Spotify Premium account** (required for playback)
- **Spotify Developer App** (get your Client ID at [developer.spotify.com](https://developer.spotify.com/dashboard))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dimitarrskv/spotifight.git
   cd spotifight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create `server/.env`:
   ```env
   PORT=3001
   CLIENT_URL=http://localhost:5173
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   ```

   Create `client/.env`:
   ```env
   VITE_SERVER_URL=http://localhost:3001
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/spotify-callback
   ```

4. **Configure Spotify App**
   - Go to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Add `http://localhost:5173/spotify-callback` to your app's Redirect URIs
   - Save changes

5. **Run the development servers**

   In one terminal (backend):
   ```bash
   cd server
   npm run dev
   ```

   In another terminal (frontend):
   ```bash
   cd client
   npm run dev
   ```

6. **Open the game**
   - Navigate to `http://localhost:5173`
   - Create a room and start playing!

## 🏗️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **Socket.io Client** - Real-time communication
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime
- **Express** - Web server
- **Socket.io** - WebSocket server
- **TypeScript** - Type safety

### Infrastructure
- **Vercel** - Frontend hosting
- **Fly.io** - Backend hosting with WebSocket support
- **Spotify Web API** - Music playback control

## 📁 Project Structure

```
spotifight/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context providers (Game, Socket, Spotify)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and API clients
│   │   └── pages/       # Page components (Home, Lobby, Playing)
│   └── package.json
├── server/              # Node.js backend
│   ├── src/
│   │   ├── games/       # Game logic implementations
│   │   ├── rooms/       # Room and player management
│   │   ├── socket/      # WebSocket event handlers
│   │   └── spotify/     # Spotify API integration
│   └── package.json
├── shared/              # Shared TypeScript types
│   └── src/types.ts     # Common interfaces and enums
└── README.md
```

## 🎯 Game Modes

### Music Pairs (Available Now)
Players are secretly paired up and hear the same song. The challenge? Figure out who your music match is before time runs out!

### Coming Soon
- **Odd One Out** - Find the player hearing a different song
- **Name That Tune** - Race to identify the song title
- **Lyric Battle** - Complete the lyrics as fast as you can

## 🌐 Deployment

Spotifight can be deployed for free using Vercel (frontend) and Fly.io (backend).

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Summary

**Frontend (Vercel):**
- Import repository to Vercel
- Set root directory to `client`
- Configure environment variables
- Auto-deploys on every push!

**Backend (Fly.io):**
```bash
flyctl launch
flyctl secrets set CLIENT_URL=https://your-app.vercel.app
flyctl secrets set SPOTIFY_CLIENT_ID=your_client_id
flyctl deploy
```

**Cost:** $0/month on free tiers (with reasonable usage limits)

## 🛠️ Development

### Commands

```bash
# Install all dependencies
npm install

# Run development servers
cd server && npm run dev  # Backend on :3001
cd client && npm run dev  # Frontend on :5173

# Build for production
cd server && npm run build
cd client && npm run build

# Type checking
npm run typecheck
```

### Environment Variables Reference

| Variable | Location | Description |
|----------|----------|-------------|
| `PORT` | server | Server port (default: 3001) |
| `CLIENT_URL` | server | Frontend URL for CORS |
| `SPOTIFY_CLIENT_ID` | both | Your Spotify app client ID |
| `VITE_SERVER_URL` | client | Backend WebSocket URL |
| `VITE_SPOTIFY_REDIRECT_URI` | client | OAuth callback URL |

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

- 🐛 Report bugs by opening an [issue](https://github.com/dimitarrskv/spotifight/issues)
- 💡 Suggest new game modes or features
- 🎨 Improve UI/UX design
- 📝 Improve documentation
- 🔧 Submit pull requests

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with clear commit messages
4. Test thoroughly (create a room, play a game, test edge cases)
5. Submit a pull request

## 📋 Roadmap

- [ ] Additional game modes (Odd One Out, Name That Tune)
- [ ] Custom room settings (round count, listen duration)
- [ ] Player avatars and profiles
- [ ] Game replay and highlights
- [ ] Tournament mode with brackets
- [ ] Playlist integration (play from specific playlists)
- [ ] Mobile app versions

## ⚠️ Requirements & Limitations

### Requirements
- **Spotify Premium** - Required for playback control via Spotify Web API
- **Active Spotify session** - Players must have Spotify open on a device
- **Modern browser** - Chrome, Firefox, Safari, or Edge (latest versions)

### Known Limitations
- Playback timing may vary slightly between devices (±1-2 seconds)
- Requires stable internet connection for real-time sync
- Maximum recommended players: 10 per room
- Music library limited to Spotify's catalog

## 🐛 Troubleshooting

### "No active Spotify device found"
- Open Spotify on your phone/computer and play any song
- Make sure you're logged into the same account
- Try refreshing the Spotify connection

### Connection issues
- Check that both frontend and backend are running
- Verify WebSocket connection (check browser console)
- Ensure CORS settings allow your frontend URL

### Music not syncing
- This is expected—devices can have 1-2 second variations
- The game accounts for this in scoring logic
- Ensure all players have stable internet

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- Inspired by party games like Jackbox and music quiz apps
- Thanks to all contributors and players!

## 📧 Contact

Have questions or feedback? Open an issue or reach out!

---

**Made with 🎵 by music lovers, for music lovers**

[⭐ Star this repo](https://github.com/dimitarrskv/spotifight) if you enjoy Spotifight!
