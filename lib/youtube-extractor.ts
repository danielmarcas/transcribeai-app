/**
 * YouTube and video platform URL extractor
 * Supports YouTube, TikTok, Instagram, Twitter, and 1000+ platforms via yt-dlp
 */

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
const SUPPORTED_PLATFORMS = [
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'vimeo.com',
  'dailymotion.com',
  'twitch.tv',
];

/**
 * Check if URL is from a supported video platform
 */
export function isSupportedVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return SUPPORTED_PLATFORMS.some((platform) =>
      urlObj.hostname.includes(platform)
    );
  } catch {
    return false;
  }
}

/**
 * Extract audio URL and metadata from video platform URL
 * Uses yt-dlp service (Railway)
 */
export async function extractYouTubeAudioUrl(videoUrl: string): Promise<{
  audioUrl: string;
  title: string;
  duration: number;
  thumbnail?: string;
}> {
  const extractorUrl = process.env.YOUTUBE_EXTRACTOR_URL;

  if (!extractorUrl) {
    throw new Error(
      'YOUTUBE_EXTRACTOR_URL not configured. Please set up yt-dlp service on Railway.'
    );
  }

  try {
    console.log('[YouTube Extractor] Fetching audio URL for:', videoUrl);

    const response = await fetch(extractorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to extract audio: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      audioUrl: data.audioUrl,
      title: data.title || 'Video',
      duration: data.duration || 0,
      thumbnail: data.thumbnail,
    };
  } catch (error: any) {
    console.error('[YouTube Extractor] Error:', error);
    throw new Error(`Failed to extract audio from video: ${error.message}`);
  }
}
