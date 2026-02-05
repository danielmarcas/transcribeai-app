import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side client with service role (full access)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Check if user has access to transcription features
 */
export async function checkUserAccess(userId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('subscription_status, trial_transcriptions_used, trial_ends_at')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return {
      has_access: false,
      limit_reached: false,
      trial_ended: false,
    };
  }

  // Check if user has active subscription
  const hasActiveSubscription = isActiveSubscription(user.subscription_status);

  // Check trial status
  const trialEnded = user.trial_ends_at
    ? new Date(user.trial_ends_at) < new Date()
    : false;
  const trialLimitReached = (user.trial_transcriptions_used || 0) >= 3;

  return {
    has_access: hasActiveSubscription || (!trialEnded && !trialLimitReached),
    limit_reached: trialLimitReached,
    trial_ended: trialEnded,
    transcriptions_used: user.trial_transcriptions_used || 0,
    subscription_status: user.subscription_status,
  };
}

/**
 * Check if subscription status is active
 */
export function isActiveSubscription(status: string): boolean {
  const activeStatuses = ['active', 'Active Unlimited', 'trialing'];
  return activeStatuses.includes(status);
}

/**
 * Save transcription to database
 */
export async function saveTranscription(data: {
  user_id: string;
  organization_id?: string;
  filename: string;
  original_filename: string;
  file_size: number;
  storage_path: string;
  file_size_mb: number;
  transcription_text: string;
  status: string;
  progress: number;
  assemblyai_id?: string;
  started_at: string;
  api_provider: string;
  folder_id?: string;
  speakers?: any;
  sentiment_analysis?: any;
  topics?: string[];
  summary?: string;
  entities?: any;
  highlights?: any;
  words?: any;
  duration?: number;
  language?: string;
}) {
  return await supabase.from('transcriptions').insert(data).select().single();
}

/**
 * Update transcription status
 */
export async function updateTranscriptionStatus(
  id: number,
  updates: {
    status?: string;
    progress?: number;
    transcription_text?: string;
    completed_at?: string;
    error?: string;
    speakers?: any;
    sentiment_analysis?: any;
    topics?: string[];
    summary?: string;
    entities?: any;
    highlights?: any;
    words?: any;
    duration?: number;
    language?: string;
  }
) {
  return await supabase
    .from('transcriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
}

/**
 * Get transcription by ID
 */
export async function getTranscription(id: number, userId?: string) {
  let query = supabase.from('transcriptions').select('*').eq('id', id);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  return await query.single();
}

/**
 * Get user's transcription history
 */
export async function getUserTranscriptions(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
    folder_id?: string;
  }
) {
  let query = supabase
    .from('transcriptions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.folder_id) {
    query = query.eq('folder_id', options.folder_id);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  return await query;
}
