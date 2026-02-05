import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssemblyAI } from 'assemblyai';
import {
  checkUserAccess,
  saveTranscription,
  isActiveSubscription,
  supabase,
} from '@/lib/supabase';
import { getStorageUrl } from '@/lib/storage';
import {
  authenticationError,
  validationError,
  successResponse,
  serverError,
} from '@/lib/api-errors';
import { isSupportedVideoUrl, extractYouTubeAudioUrl } from '@/lib/youtube-extractor';

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

// Configure route for large file processing
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[Transcribe API - AssemblyAI] Request received');

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('[Transcribe API] Unauthorized - no session');
      return authenticationError('Please sign in to transcribe files');
    }

    const userId = (session.user as any).id;
    console.log('[Transcribe API] User ID:', userId);

    // Check if user has access
    const access = await checkUserAccess(userId);
    console.log('[Transcribe API] Access check:', access);

    if (!access.has_access) {
      console.log('[Transcribe API] Access denied');
      return NextResponse.json(
        {
          error: 'Access denied',
          message: access.limit_reached
            ? 'You have reached your trial limit (3 transcriptions). Please subscribe to continue.'
            : 'Your trial has ended. Please subscribe to continue.',
          access,
        },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const {
      storagePath,
      fileName,
      fileSize,
      language,
      audioUrl,
      inputLanguage,
      outputLanguage,
      folder_id,
    } = body;

    if (!storagePath && !audioUrl) {
      return validationError('No storage path or audio URL provided');
    }

    let transcriptionUrl: string;
    let effectiveFileName: string;

    // Handle URL-based transcription (YouTube, TikTok, Instagram, etc.)
    if (audioUrl) {
      console.log(`[Transcribe API] Processing URL: ${audioUrl}`);

      if (isSupportedVideoUrl(audioUrl)) {
        console.log('[Transcribe API] Supported video platform detected, extracting audio...');

        try {
          const videoData = await extractYouTubeAudioUrl(audioUrl);
          transcriptionUrl = videoData.audioUrl;
          effectiveFileName = fileName || videoData.title;

          console.log('[Transcribe API] Video audio extracted:');
          console.log('  - Title:', videoData.title);
          console.log('  - Duration:', videoData.duration, 'seconds');
        } catch (videoError: any) {
          console.error('[Transcribe API] Video extraction failed:', videoError);

          return NextResponse.json(
            {
              error: 'Video extraction failed',
              message: videoError.message || 'Could not extract audio from video',
              suggestion:
                'Download the video and upload the file directly, or try a different video URL.',
            },
            { status: 400 }
          );
        }
      } else {
        // Direct media URL
        console.log(`[Transcribe API] Using direct URL: ${audioUrl}`);
        transcriptionUrl = audioUrl;
        effectiveFileName = fileName || 'URL-based transcription';
      }
    } else {
      // Handle file upload transcription
      const fileSizeMB = fileSize / (1024 * 1024);
      console.log(`[Transcribe API] File: ${fileName}, Size: ${fileSizeMB.toFixed(2)}MB`);

      // Check user's subscription status to determine file size limit
      const { data: user } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', userId)
        .single();

      const isTrialUser = !user || !isActiveSubscription(user.subscription_status);

      // File size limits based on subscription
      const TRIAL_MAX_SIZE_MB = 100;
      const PAID_MAX_SIZE_MB = 5 * 1024; // 5GB

      const maxSizeMB = isTrialUser ? TRIAL_MAX_SIZE_MB : PAID_MAX_SIZE_MB;
      const limitText = isTrialUser ? '100MB' : '5GB';

      if (fileSizeMB > maxSizeMB) {
        console.log(
          `[Transcribe API] File size (${fileSizeMB.toFixed(1)}MB) exceeds ${limitText} limit`
        );
        return validationError(
          `Your file is ${fileSizeMB.toFixed(1)}MB. The maximum file size for ${isTrialUser ? 'trial' : 'paid'} users is ${limitText}. ${isTrialUser ? 'Upgrade to Pro to transcribe files up to 5GB!' : 'Please use a smaller file.'}`,
          { fileSize: fileSizeMB, maxSize: maxSizeMB, isTrialUser }
        );
      }

      console.log(`[Transcribe API] File size OK (${fileSizeMB.toFixed(1)}MB / ${limitText})`);

      try {
        // Get signed URL for the file
        transcriptionUrl = await getStorageUrl(storagePath, 3600);
        effectiveFileName = fileName;
        console.log('[Transcribe API] Signed URL generated successfully');
      } catch (storageError: any) {
        console.error('[Transcribe API] Storage URL generation failed:', storageError);
        return serverError(
          'Failed to access uploaded file. Please try uploading again.',
          storageError.message
        );
      }
    }

    // Fetch user's custom vocabulary for improved accuracy
    const { data: vocabularyData } = await supabase
      .from('custom_vocabulary')
      .select('word, phrases')
      .eq('user_id', userId);

    const customWords = vocabularyData?.map((v: any) => v.word) || [];
    const customPhrases = vocabularyData?.flatMap((v: any) => v.phrases || []) || [];
    const wordBoost = [...customWords, ...customPhrases].filter(Boolean);

    console.log('[Transcribe API] Starting AssemblyAI transcription...');
    console.log('[Transcribe API] Features enabled: speaker diarization, sentiment, topics, summary, entities');
    if (wordBoost.length > 0) {
      console.log(`[Transcribe API] Custom vocabulary: ${wordBoost.length} words/phrases`);
    }

    // Submit transcription to AssemblyAI with ALL premium features
    let transcript;
    try {
      transcript = await assemblyai.transcripts.submit({
        audio_url: transcriptionUrl,
        language_code: inputLanguage || language || undefined,

        // Custom vocabulary
        word_boost: wordBoost.length > 0 ? wordBoost : undefined,
        boost_param: wordBoost.length > 0 ? 'high' : undefined,

        // Core features
        speech_model: 'nano', // Fast model - excellent accuracy

        // Speaker diarization
        speaker_labels: true,
        speakers_expected: undefined,

        // Sentiment analysis
        sentiment_analysis: true,

        // Topic detection
        iab_categories: true,
        content_safety: true,

        // Summarization
        summarization: true,
        summary_model: 'informative',
        summary_type: 'bullets',

        // Entity detection
        entity_detection: true,

        // PII redaction (optional)
        redact_pii: false,

        // Additional features
        auto_highlights: true,

        // Formatting
        format_text: true,
        punctuate: true,
        disfluencies: false, // Remove "um", "uh"
      });
    } catch (assemblyError: any) {
      console.error('[Transcribe API] AssemblyAI Error:', assemblyError);

      let errorMessage = 'Transcription failed';

      if (assemblyError.message?.includes('not found') || assemblyError.message?.includes('404')) {
        errorMessage = 'Audio file not found. Please check the URL and try again.';
      } else if (assemblyError.message?.includes('unauthorized')) {
        errorMessage = 'API authentication error. Please contact support.';
      } else if (assemblyError.message?.includes('timeout')) {
        errorMessage = 'Transcription timed out. Please try a shorter file.';
      } else if (assemblyError.message?.includes('format') || assemblyError.message?.includes('codec')) {
        errorMessage = 'Unsupported format. Please use MP3, MP4, WAV, or M4A files.';
      } else if (assemblyError.message) {
        errorMessage = `Transcription error: ${assemblyError.message}`;
      }

      return serverError(errorMessage, assemblyError.message);
    }

    console.log('[Transcribe API] Transcription submitted:', transcript.id);

    if (transcript.status === 'error') {
      const errorMsg = transcript.error || 'Transcription failed - unknown error';
      console.error('[Transcribe API] Transcription failed:', errorMsg);
      return serverError('Transcription failed', errorMsg);
    }

    // Save to database with processing status
    let saved;
    try {
      console.log('[Transcribe API] Saving transcription record...');
      const { data, error } = await supabase
        .from('transcriptions')
        .insert({
          user_id: userId,
          filename: effectiveFileName,
          original_filename: effectiveFileName,
          file_size: Math.round(fileSize || 0),
          storage_path: storagePath || audioUrl,
          file_size_mb: parseFloat((fileSize ? fileSize / (1024 * 1024) : 0).toFixed(2)),
          transcription_text: '',
          status: 'processing',
          progress: 10,
          assemblyai_id: transcript.id,
          started_at: new Date().toISOString(),
          api_provider: 'assemblyai',
          folder_id: folder_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      saved = data;
      console.log('[Transcribe API] Saved to database with ID:', saved.id);
    } catch (dbError: any) {
      console.error('[Transcribe API] Database save failed:', dbError);
      return serverError(
        'Failed to save transcription. Please try again.',
        dbError.message
      );
    }

    // Return immediately with processing status
    // Frontend will poll /api/transcriptions/[id]/status for updates
    return successResponse({
      success: true,
      transcription: {
        id: saved.id,
        filename: effectiveFileName,
        status: 'processing',
        progress: 10,
        assemblyai_id: transcript.id,
        created_at: saved.created_at,
      },
      message: 'Transcription started. This may take a few minutes.',
    });
  } catch (error: any) {
    console.error('[Transcribe API] Unexpected error:', error);
    return serverError('An unexpected error occurred', error.message);
  }
}
