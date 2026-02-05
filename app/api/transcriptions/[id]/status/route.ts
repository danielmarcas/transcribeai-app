import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssemblyAI } from 'assemblyai';
import { getTranscription, updateTranscriptionStatus, supabase } from '@/lib/supabase';
import { authenticationError, notFoundError, successResponse } from '@/lib/api-errors';

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return authenticationError();
    }

    const userId = (session.user as any).id;
    const transcriptionId = parseInt(params.id);

    // Get transcription from database
    const { data: transcription, error } = await getTranscription(transcriptionId, userId);

    if (error || !transcription) {
      return notFoundError('Transcription not found');
    }

    // If already completed or failed, return current status
    if (transcription.status === 'completed' || transcription.status === 'failed') {
      return successResponse({
        id: transcription.id,
        status: transcription.status,
        progress: transcription.status === 'completed' ? 100 : transcription.progress,
        transcription_text: transcription.transcription_text,
        speakers: transcription.speakers,
        sentiment_analysis: transcription.sentiment_analysis,
        topics: transcription.topics,
        summary: transcription.summary,
        entities: transcription.entities,
        highlights: transcription.highlights,
        words: transcription.words,
        duration: transcription.duration,
        language: transcription.language,
        created_at: transcription.created_at,
        completed_at: transcription.completed_at,
        error: transcription.error,
      });
    }

    // Check status with AssemblyAI
    if (!transcription.assemblyai_id) {
      return notFoundError('AssemblyAI ID not found');
    }

    console.log('[Status API] Checking AssemblyAI status for:', transcription.assemblyai_id);

    const assemblyTranscript = await assemblyai.transcripts.get(transcription.assemblyai_id);

    console.log('[Status API] AssemblyAI status:', assemblyTranscript.status);

    // Update progress based on status
    let progress = transcription.progress || 10;

    if (assemblyTranscript.status === 'queued') {
      progress = 10;
    } else if (assemblyTranscript.status === 'processing') {
      progress = Math.min(progress + 10, 90);
    } else if (assemblyTranscript.status === 'completed') {
      progress = 100;

      // Extract all data from AssemblyAI response
      const transcriptionText = assemblyTranscript.text || '';

      // Extract speakers with word-level timing
      const speakers = assemblyTranscript.utterances?.map((utterance: any) => ({
        speaker: utterance.speaker,
        text: utterance.text,
        start: utterance.start,
        end: utterance.end,
        confidence: utterance.confidence,
        words: utterance.words || [],
      })) || [];

      // Extract sentiment analysis
      const sentiment_analysis = assemblyTranscript.sentiment_analysis_results?.map((result: any) => ({
        text: result.text,
        sentiment: result.sentiment,
        confidence: result.confidence,
        start: result.start,
        end: result.end,
      })) || [];

      // Extract topics
      const topics = assemblyTranscript.iab_categories_result?.results?.map((result: any) => result.text) || [];

      // Extract summary
      const summary = assemblyTranscript.summary || '';

      // Extract entities
      const entities = assemblyTranscript.entities?.map((entity: any) => ({
        type: entity.entity_type,
        text: entity.text,
        start: entity.start,
        end: entity.end,
      })) || [];

      // Extract highlights
      const highlights = assemblyTranscript.auto_highlights_result?.results?.map((result: any) => ({
        text: result.text,
        count: result.count,
        rank: result.rank,
        timestamps: result.timestamps,
      })) || [];

      // Extract word-level timing
      const words = assemblyTranscript.words || [];

      // Update database with completed transcription
      await updateTranscriptionStatus(transcriptionId, {
        status: 'completed',
        progress: 100,
        transcription_text: transcriptionText,
        speakers,
        sentiment_analysis,
        topics,
        summary,
        entities,
        highlights,
        words,
        duration: assemblyTranscript.audio_duration,
        language: assemblyTranscript.language_code,
        completed_at: new Date().toISOString(),
      });

      // Increment user's trial transcription count
      const { data: user } = await supabase
        .from('users')
        .select('trial_transcriptions_used, subscription_status')
        .eq('id', userId)
        .single();

      if (user && user.subscription_status === 'trialing') {
        await supabase
          .from('users')
          .update({ trial_transcriptions_used: (user.trial_transcriptions_used || 0) + 1 })
          .eq('id', userId);
      }

      return successResponse({
        id: transcriptionId,
        status: 'completed',
        progress: 100,
        transcription_text: transcriptionText,
        speakers,
        sentiment_analysis,
        topics,
        summary,
        entities,
        highlights,
        words,
        duration: assemblyTranscript.audio_duration,
        language: assemblyTranscript.language_code,
        completed_at: new Date().toISOString(),
      });
    } else if (assemblyTranscript.status === 'error') {
      // Handle error
      await updateTranscriptionStatus(transcriptionId, {
        status: 'failed',
        error: assemblyTranscript.error || 'Transcription failed',
        progress,
      });

      return successResponse({
        id: transcriptionId,
        status: 'failed',
        progress,
        error: assemblyTranscript.error || 'Transcription failed',
      });
    }

    // Update progress in database
    await updateTranscriptionStatus(transcriptionId, {
      progress,
    });

    return successResponse({
      id: transcriptionId,
      status: assemblyTranscript.status,
      progress,
    });
  } catch (error: any) {
    console.error('[Status API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check transcription status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
