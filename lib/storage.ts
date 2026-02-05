import { supabase } from './supabase';

const STORAGE_BUCKET = 'transcriptions';

/**
 * Get a signed URL for a file in storage
 * @param path - Storage path to the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getStorageUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('[Storage] Error creating signed URL:', error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error('No signed URL returned from storage');
  }

  return data.signedUrl;
}

/**
 * Get a signed upload URL for uploading files
 * @param path - Storage path where file will be uploaded
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedUploadUrl(path: string, expiresIn: number = 3600) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);

  if (error) {
    console.error('[Storage] Error creating signed upload URL:', error);
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error('No signed upload URL returned from storage');
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path,
  };
}

/**
 * Delete a file from storage
 */
export async function deleteStorageFile(path: string) {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    console.error('[Storage] Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }

  return true;
}

/**
 * Generate a unique storage path for a user's file
 */
export function generateStoragePath(userId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${timestamp}_${sanitizedFilename}`;
}
