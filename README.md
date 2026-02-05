# TranscribeAI

AI-powered audio and video transcription SaaS platform with AssemblyAI integration.

## Features

- 🎙️ **Audio & Video Transcription** - Support for MP3, MP4, WAV, M4A, and more
- 🎬 **URL Transcription** - YouTube, TikTok, Instagram, and 1000+ platforms
- 👥 **Speaker Diarization** - Automatic "who said what" identification
- 📊 **Sentiment Analysis** - Detect positive/negative tone
- 🏷️ **Topic Detection** - Auto-categorize content
- 📝 **AI Summarization** - Bullet-point summaries
- 🔍 **Entity Recognition** - Extract names, companies, locations
- ⭐ **Auto Highlights** - Key phrase extraction
- 📚 **Custom Vocabulary** - Boost accuracy with domain-specific words
- 💾 **Multiple Export Formats** - TXT, SRT, VTT, DOCX, PDF

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Transcription:** AssemblyAI API
- **Database:** Supabase (PostgreSQL)
- **Authentication:** NextAuth.js (Google OAuth + Email/Password)
- **Payments:** Stripe
- **Storage:** Supabase Storage
- **Analytics:** PostHog

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- AssemblyAI API key
- Google OAuth credentials (optional)
- Stripe account (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/danielmarcas/transcribeai-app.git
cd transcribeai-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`:
   - Supabase URL and keys
   - AssemblyAI API key
   - NextAuth secret
   - Google OAuth credentials
   - Stripe keys

5. Run database migrations (see `/migrations/` folder)

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
transcribeai-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── transcribe/       # Main transcription endpoint
│   │   ├── transcriptions/   # Status polling & management
│   │   └── upload/           # File upload presigned URLs
│   ├── dashboard/            # User dashboard
│   └── transcribe/           # Transcription upload UI
├── components/               # React components
│   ├── ui/                   # UI primitives (Radix UI)
│   ├── layouts/              # Layout components
│   └── transcription/        # Transcription-specific components
├── lib/                      # Utilities & integrations
│   ├── api-errors.ts         # Consistent error handling
│   ├── auth.ts               # NextAuth configuration
│   ├── storage.ts            # Supabase Storage utilities
│   ├── supabase.ts           # Supabase client & DB helpers
│   └── youtube-extractor.ts  # Video URL extraction
├── docs/                     # Documentation
├── migrations/               # Database migrations
└── public/                   # Static assets
```

## API Endpoints

### POST /api/transcribe
Submit a new transcription (file or URL).

**Request body:**
```json
{
  "storagePath": "user123/audio.mp3",  // For file uploads
  "fileName": "audio.mp3",
  "fileSize": 1024000,
  "audioUrl": "https://youtube.com/watch?v=...",  // For URL transcriptions
  "language": "en",
  "folder_id": null
}
```

**Response:**
```json
{
  "success": true,
  "transcription": {
    "id": 123,
    "filename": "audio.mp3",
    "status": "processing",
    "progress": 10,
    "assemblyai_id": "abc123",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/transcriptions/[id]/status
Poll transcription status and get results.

**Response (processing):**
```json
{
  "id": 123,
  "status": "processing",
  "progress": 45
}
```

**Response (completed):**
```json
{
  "id": 123,
  "status": "completed",
  "progress": 100,
  "transcription_text": "Full transcript...",
  "speakers": [...],
  "sentiment_analysis": [...],
  "topics": [...],
  "summary": "...",
  "entities": [...],
  "highlights": [...],
  "duration": 120,
  "language": "en"
}
```

### POST /api/upload/presigned
Get presigned URL for file upload.

**Request body:**
```json
{
  "fileName": "audio.mp3",
  "fileSize": 1024000,
  "contentType": "audio/mpeg"
}
```

**Response:**
```json
{
  "signedUrl": "https://...",
  "storagePath": "user123/timestamp_audio.mp3"
}
```

## Subscription Tiers

| Feature | Trial | Pro |
|---------|-------|-----|
| Transcriptions | 3 | Unlimited |
| File Size Limit | 100MB | 5GB |
| Duration | 7 days | Unlimited |
| All AI Features | ✅ | ✅ |

## AssemblyAI Features Enabled

- **Speech Model:** Nano (fast, excellent accuracy)
- **Speaker Labels:** Auto-detect speakers
- **Sentiment Analysis:** Per-sentence sentiment
- **Topic Detection:** IAB categories + content safety
- **Summarization:** Bullet-point summaries
- **Entity Detection:** Names, companies, locations
- **Auto Highlights:** Key phrases
- **Format Text:** Smart capitalization & punctuation
- **Disfluencies Removal:** Remove "um", "uh"
- **Custom Vocabulary:** User-defined word boost

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Database Schema

See `/docs/DATABASE_SCHEMA.md` for full schema documentation.

Key tables:
- `users` - User accounts and subscription status
- `transcriptions` - Transcription records with AI features
- `custom_vocabulary` - User-defined vocabulary for accuracy
- `folders` - Organization of transcriptions

## Deployment

Recommended platform: **Vercel**

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

For detailed deployment instructions, see `/docs/DEPLOYMENT.md`.

## License

MIT

## Support

For support, email support@transcribeai.com or open an issue on GitHub.

## Credits

Built with ❤️ using AssemblyAI, Next.js, and Supabase.
