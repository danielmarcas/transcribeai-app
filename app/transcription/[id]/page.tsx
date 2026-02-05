'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatDuration, formatTimestamp } from '@/lib/utils';

interface Transcription {
  id: number;
  status: string;
  progress: number;
  transcription_text?: string;
  speakers?: any[];
  sentiment_analysis?: any[];
  topics?: string[];
  summary?: string;
  entities?: any[];
  highlights?: any[];
  words?: any[];
  duration?: number;
  language?: string;
  error?: string;
  filename?: string;
  created_at?: string;
  completed_at?: string;
}

export default function TranscriptionPage() {
  const params = useParams();
  const id = params.id as string;
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/transcriptions/${id}/status`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to fetch transcription');
        }

        const data = await res.json();
        setTranscription(data);
        setLoading(false);

        // Continue polling if processing
        if (data.status === 'processing' || data.status === 'queued') {
          setTimeout(fetchStatus, 3000); // Poll every 3 seconds
        }
      } catch (err: any) {
        console.error('Error fetching transcription:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStatus();
  }, [id]);

  const downloadTranscript = (format: 'txt' | 'srt' | 'vtt' | 'json') => {
    if (!transcription?.transcription_text) return;

    let content = '';
    let mimeType = 'text/plain';
    let extension = format;

    switch (format) {
      case 'txt':
        content = transcription.transcription_text;
        break;
      case 'json':
        content = JSON.stringify(transcription, null, 2);
        mimeType = 'application/json';
        break;
      case 'srt':
      case 'vtt':
        // Generate subtitle format from words
        if (transcription.words && transcription.words.length > 0) {
          content = generateSubtitles(transcription.words, format);
          mimeType = format === 'srt' ? 'application/x-subrip' : 'text/vtt';
        } else {
          content = transcription.transcription_text;
        }
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${id}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateSubtitles = (words: any[], format: 'srt' | 'vtt'): string => {
    const lines: string[] = [];
    const wordsPerLine = 10;

    if (format === 'vtt') {
      lines.push('WEBVTT\n');
    }

    for (let i = 0; i < words.length; i += wordsPerLine) {
      const chunk = words.slice(i, i + wordsPerLine);
      const text = chunk.map(w => w.text).join(' ');
      const start = chunk[0].start;
      const end = chunk[chunk.length - 1].end;

      if (format === 'srt') {
        lines.push(`${Math.floor(i / wordsPerLine) + 1}`);
        lines.push(`${formatSrtTime(start)} --> ${formatSrtTime(end)}`);
        lines.push(text);
        lines.push('');
      } else {
        lines.push(`${formatVttTime(start)} --> ${formatVttTime(end)}`);
        lines.push(text);
        lines.push('');
      }
    }

    return lines.join('\n');
  };

  const formatSrtTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor(ms % 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  };

  const formatVttTime = (ms: number): string => {
    return formatSrtTime(ms).replace(',', '.');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transcription...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !transcription) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error || 'Transcription not found'}</p>
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isProcessing = transcription.status === 'processing' || transcription.status === 'queued';
  const isCompleted = transcription.status === 'completed';
  const isFailed = transcription.status === 'failed';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {transcription.filename || `Transcription #${id}`}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Status: <span className={`font-medium ${isCompleted ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-blue-600'}`}>
              {transcription.status}
            </span></span>
            {transcription.duration && (
              <span>Duration: {formatDuration(transcription.duration)}</span>
            )}
            {transcription.language && (
              <span>Language: {transcription.language.toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Processing Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {transcription.progress < 30 ? 'Queued...' : transcription.progress < 60 ? 'Analyzing audio...' : 'Generating transcript...'}
                    </p>
                    <p className="text-sm text-gray-500">{transcription.progress}%</p>
                  </div>
                  <Progress value={transcription.progress} />
                </div>
                <p className="text-sm text-gray-600">
                  This may take a few minutes depending on the length of your audio/video.
                  You can close this page and come back later.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Status */}
        {isFailed && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Transcription Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{transcription.error || 'An unknown error occurred'}</p>
            </CardContent>
          </Card>
        )}

        {/* Completed Transcription */}
        {isCompleted && (
          <>
            {/* Download Buttons */}
            <div className="mb-6 flex flex-wrap gap-3">
              <Button onClick={() => downloadTranscript('txt')} variant="outline">
                Download TXT
              </Button>
              <Button onClick={() => downloadTranscript('srt')} variant="outline">
                Download SRT
              </Button>
              <Button onClick={() => downloadTranscript('vtt')} variant="outline">
                Download VTT
              </Button>
              <Button onClick={() => downloadTranscript('json')} variant="outline">
                Download JSON
              </Button>
            </div>

            {/* Summary */}
            {transcription.summary && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-700">{transcription.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Topics & Highlights */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {transcription.topics && transcription.topics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {transcription.topics.slice(0, 10).map((topic, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {transcription.highlights && transcription.highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {transcription.highlights.slice(0, 5).map((highlight: any, i: number) => (
                        <li key={i} className="text-sm text-gray-700">
                          ⭐ {highlight.text}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Full Transcript */}
            <Card>
              <CardHeader>
                <CardTitle>Full Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                {transcription.speakers && transcription.speakers.length > 0 ? (
                  <div className="space-y-4">
                    {transcription.speakers.map((speaker: any, i: number) => (
                      <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">
                            {speaker.speaker}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(speaker.start)}
                          </span>
                        </div>
                        <p className="text-gray-700">{speaker.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-gray-700">
                    {transcription.transcription_text}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
