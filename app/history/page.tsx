'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';

interface Transcription {
  id: number;
  filename: string;
  status: string;
  created_at: string;
  duration?: number;
  language?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from /api/transcriptions
    // For now, we'll show a placeholder
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="px-6 py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading history...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Transcription History</h1>
            <p className="text-gray-600">
              View and manage all your transcriptions.
            </p>
          </div>
          <Button onClick={() => router.push('/transcribe')}>
            New Transcription
          </Button>
        </div>

        {/* Transcriptions List */}
        {transcriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No transcriptions yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by uploading your first audio or video file.
                </p>
                <Button onClick={() => router.push('/transcribe')}>
                  Create First Transcription
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transcriptions.map((transcription) => (
              <Card
                key={transcription.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/transcription/${transcription.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {transcription.filename}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Status:{' '}
                          <span
                            className={`font-medium ${
                              transcription.status === 'completed'
                                ? 'text-green-600'
                                : transcription.status === 'failed'
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {transcription.status}
                          </span>
                        </span>
                        {transcription.duration && (
                          <span>Duration: {formatDuration(transcription.duration)}</span>
                        )}
                        {transcription.language && (
                          <span>Language: {transcription.language.toUpperCase()}</span>
                        )}
                        <span>
                          {new Date(transcription.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
