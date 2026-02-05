'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/lib/utils';

export default function TranscribePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    setError('');
    setUploading(true);
    setUploadProgress(10);

    try {
      if (mode === 'file') {
        if (!file) {
          setError('Please select a file');
          setUploading(false);
          return;
        }

        // Get presigned upload URL
        const uploadRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
          }),
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.message || 'Failed to get upload URL');
        }

        const { signedUrl, storagePath } = await uploadRes.json();
        setUploadProgress(30);

        // Upload file to storage
        const uploadFileRes = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadFileRes.ok) {
          throw new Error('Failed to upload file');
        }

        setUploadProgress(60);

        // Submit transcription
        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storagePath,
            fileName: file.name,
            fileSize: file.size,
          }),
        });

        if (!transcribeRes.ok) {
          const error = await transcribeRes.json();
          throw new Error(error.message || 'Failed to start transcription');
        }

        const result = await transcribeRes.json();
        setUploadProgress(100);

        // Redirect to status page
        router.push(`/transcription/${result.transcription.id}`);
      } else {
        // URL mode
        if (!url) {
          setError('Please enter a URL');
          setUploading(false);
          return;
        }

        setUploadProgress(50);

        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioUrl: url,
            fileName: 'URL Transcription',
          }),
        });

        if (!transcribeRes.ok) {
          const error = await transcribeRes.json();
          throw new Error(error.message || 'Failed to start transcription');
        }

        const result = await transcribeRes.json();
        setUploadProgress(100);

        // Redirect to status page
        router.push(`/transcription/${result.transcription.id}`);
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'An error occurred');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transcribe Audio or Video</h1>
          <p className="text-gray-600">
            Upload a file or paste a URL to get started. Supports MP3, MP4, WAV, YouTube, and more.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setMode('file')}
            variant={mode === 'file' ? 'default' : 'outline'}
            className="flex-1"
          >
            📁 Upload File
          </Button>
          <Button
            onClick={() => setMode('url')}
            variant={mode === 'url' ? 'default' : 'outline'}
            className="flex-1"
          >
            🔗 Paste URL
          </Button>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'file' ? 'Upload File' : 'Paste URL'}</CardTitle>
            <CardDescription>
              {mode === 'file'
                ? 'Drag and drop or click to select a file. Max 100MB for trial users, 5GB for Pro.'
                : 'Paste a YouTube, TikTok, Instagram, or other video URL.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'file' ? (
              <div>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  {file ? (
                    <div>
                      <p className="text-lg font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        Drag and drop your file here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        MP3, MP4, WAV, M4A, FLAC, OGG, AAC, and more
                      </p>
                    </div>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="audio/*,video/*"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-lg py-6"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Supports YouTube, TikTok, Instagram, Twitter, Vimeo, and 1000+ platforms
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {uploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    {uploadProgress < 60 ? 'Uploading...' : 'Starting transcription...'}
                  </p>
                  <p className="text-sm text-gray-500">{uploadProgress}%</p>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={uploading || (mode === 'file' ? !file : !url)}
                className="flex-1"
                size="lg"
              >
                {uploading ? 'Processing...' : 'Start Transcription'}
              </Button>
              {(file || url) && !uploading && (
                <Button
                  onClick={() => {
                    setFile(null);
                    setUrl('');
                    setError('');
                  }}
                  variant="outline"
                  size="lg"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '👥', label: 'Speaker ID' },
            { icon: '📊', label: 'Sentiment' },
            { icon: '🏷️', label: 'Topics' },
            { icon: '📝', label: 'Summary' },
          ].map((feature) => (
            <div key={feature.label} className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl mb-1">{feature.icon}</div>
              <p className="text-sm font-medium text-gray-700">{feature.label}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
