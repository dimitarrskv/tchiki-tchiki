# Spotifight Deployment Guide

This guide will help you deploy Spotifight using **Vercel** (frontend) and **Fly.io** (backend).

## Prerequisites

1. **GitHub account** - Push your code to GitHub
2. **Vercel account** - Sign up at https://vercel.com (free)
3. **Fly.io account** - Sign up at https://fly.io (free tier, requires credit card)
4. **Fly CLI** - Install: https://fly.io/docs/hands-on/install-flyctl/

---

## Part 1: Deploy Backend to Fly.io

### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Or use install script
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login to Fly.io

```bash
flyctl auth login
```

This will open your browser to authenticate.

### Step 3: Create Fly App

```bash
# From the root of your project
flyctl launch

# When prompted:
# - App name: Choose a unique name (e.g., "spotifight-yourname")
# - Region: Choose closest to you (e.g., "iad" for US East)
# - Would you like to set up a Postgresql database? → NO
# - Would you like to set up an Upstash Redis database? → NO
# - Would you like to deploy now? → NO (we need to set env vars first)
```

This will update your `fly.toml` with your app name.

### Step 4: Set Environment Variables

```bash
# Set the CLIENT_URL to your Vercel URL (you'll get this after deploying frontend)
# For now, use a placeholder - we'll update it later
flyctl secrets set CLIENT_URL=https://your-app.vercel.app

# Set your Spotify Client ID (from https://developer.spotify.com/dashboard)
flyctl secrets set SPOTIFY_CLIENT_ID=your_spotify_client_id_here
```

### Step 5: Deploy to Fly.io

```bash
flyctl deploy
```

This will:
- Build your Docker image
- Push it to Fly.io
- Start your server

### Step 6: Get Your Backend URL

```bash
flyctl status
```

Your backend URL will be: `https://your-app-name.fly.dev`

**Save this URL** - you'll need it for the frontend!

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add deployment configs"
git push origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 3: Set Environment Variables

In the Vercel project settings, add these environment variables:

```
VITE_SERVER_URL=https://your-app-name.fly.dev
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_SPOTIFY_REDIRECT_URI=https://your-vercel-app.vercel.app/spotify-callback
```

**Important:** Replace the URLs with your actual URLs!

### Step 4: Deploy

Click **"Deploy"** and wait for the build to complete (~1-2 minutes).

Your frontend will be live at: `https://your-app-name.vercel.app`

---

## Part 3: Update Backend with Frontend URL

Now that you have your Vercel URL, update the backend:

```bash
# Update the CLIENT_URL with your actual Vercel URL
flyctl secrets set CLIENT_URL=https://your-app-name.vercel.app

# This will automatically redeploy
```

---

## Part 4: Update Spotify App Settings

1. Go to https://developer.spotify.com/dashboard
2. Open your Spotify app
3. Click **"Edit Settings"**
4. Add to **Redirect URIs:**
   ```
   https://your-app-name.vercel.app/spotify-callback
   ```
5. Save changes

---

## Testing Your Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Test the game:
   - Create a room
   - Connect to Spotify
   - Try playing a game

### Check Backend Health

```bash
curl https://your-app-name.fly.dev/api/health
```

Should return: `{"status":"ok","rooms":0}`

---

## Monitoring & Logs

### View Fly.io logs

```bash
flyctl logs
```

### View Vercel logs

Go to: https://vercel.com → Your Project → Deployments → Click deployment → Logs

---

## Updating Your App

### Update Frontend (Vercel)

Just push to GitHub:
```bash
git push origin main
```

Vercel auto-deploys on every push!

### Update Backend (Fly.io)

```bash
flyctl deploy
```

---

## Troubleshooting

### Backend won't connect
- Check Fly.io logs: `flyctl logs`
- Verify env vars: `flyctl secrets list`
- Check health endpoint: `curl https://your-app.fly.dev/api/health`

### Frontend can't reach backend
- Check CORS: Make sure `CLIENT_URL` matches your Vercel URL exactly (no trailing slash)
- Check browser console for errors
- Verify `VITE_SERVER_URL` in Vercel env vars

### WebSocket connection fails
- Fly.io free tier should support WebSockets
- Check `auto_stop_machines = "off"` in fly.toml
- Try reconnecting (the app has retry logic)

---

## Cost Breakdown

- **Vercel**: Free (unlimited bandwidth for hobby projects)
- **Fly.io**: Free tier includes:
  - Up to 3 shared-cpu-1x 256MB VMs
  - 160GB outbound data transfer/month
  - Should be enough for moderate usage!

**Total: $0/month** (unless you exceed free tier limits)

---

## Next Steps

- Set up custom domain (optional)
- Monitor usage in Fly.io dashboard
- Add analytics (optional)
- Share with friends and play! 🎵🎮
