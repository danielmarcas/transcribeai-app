# Quick Start Guide

Get TranscribeAI running locally in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- AssemblyAI API key (free tier: 5 hours/month)
- Google OAuth credentials (optional, for Google Sign In)

## Step 1: Clone & Install

```bash
git clone https://github.com/danielmarcas/transcribeai-app.git
cd transcribeai-app
npm install
```

## Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `/migrations/001_initial_schema.sql`
3. Go to **Storage** → Create bucket named `transcriptions` (private)
4. Get your credentials from **Settings** → **API**:
   - Project URL
   - Anon (public) key
   - Service role key

## Step 3: Get AssemblyAI API Key

1. Sign up at [assemblyai.com](https://www.assemblyai.com/)
2. Go to **Dashboard** → **API Keys**
3. Copy your API key

## Step 4: Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AssemblyAI (REQUIRED)
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# NextAuth (REQUIRED)
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (OPTIONAL - for Google Sign In)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

### Get Google OAuth credentials (optional):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret

## Step 5: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Test Transcription

1. Click **Sign Up** (use Google or wait for email auth implementation)
2. Go to **Transcribe**
3. Upload a small audio file (MP3, WAV) or paste a YouTube URL
4. Watch the progress bar
5. View results with speaker ID, sentiment, topics, summary!

## Optional: YouTube URL Support

For YouTube transcription, you need a yt-dlp service on Railway:

1. Deploy [this repo](https://github.com/your-ytdlp-service) to Railway
2. Add the Railway URL to `.env.local`:
   ```env
   YOUTUBE_EXTRACTOR_URL=https://your-service.railway.app/extract
   ```

## Troubleshooting

### "Failed to fetch transcription"
- Check that Supabase URL and keys are correct
- Verify the database migrations ran successfully
- Check browser console for errors

### "API authentication error"
- Verify your AssemblyAI API key is valid
- Check if you have API credits remaining

### "Unauthorized"
- Make sure NEXTAUTH_SECRET is set
- Try signing out and back in
- Clear browser cookies

### "Failed to upload file"
- Check Supabase Storage bucket exists and is named "transcriptions"
- Verify Storage policies allow uploads

## What's Next?

- **Add Stripe**: Set up payments for Pro subscriptions
- **Custom Vocabulary**: Add domain-specific words for better accuracy
- **Export Formats**: Download transcripts as DOCX, PDF
- **Folders**: Organize transcriptions
- **Teams**: Invite collaborators

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deploying to Vercel.

## Support

- GitHub Issues: [github.com/danielmarcas/transcribeai-app/issues](https://github.com/danielmarcas/transcribeai-app/issues)
- Email: support@transcribeai.com

## License

MIT
