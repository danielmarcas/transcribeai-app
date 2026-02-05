import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateStoragePath, getSignedUploadUrl } from '@/lib/storage';
import {
  authenticationError,
  validationError,
  successResponse,
  serverError,
} from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return authenticationError();
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { fileName, fileSize, contentType } = body;

    if (!fileName) {
      return validationError('fileName is required');
    }

    if (!fileSize) {
      return validationError('fileSize is required');
    }

    // Generate unique storage path
    const storagePath = generateStoragePath(userId, fileName);

    // Get presigned upload URL
    const { signedUrl, token, path } = await getSignedUploadUrl(storagePath);

    return successResponse({
      signedUrl,
      token,
      storagePath: path,
      fileName,
    });
  } catch (error: any) {
    console.error('[Upload API] Error:', error);
    return serverError('Failed to generate upload URL', error.message);
  }
}
