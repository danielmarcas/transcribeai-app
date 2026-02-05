'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-black">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-3xl font-bold text-black">TranscribeAI</h1>
          </div>
          <p className="text-gray-600 font-medium">AI-Powered Audio & Video Transcription</p>
          <p className="text-sm text-gray-500 mt-1">99.8% accuracy • 99+ languages • Speaker ID</p>
        </div>

        {/* Auth Card */}
        <Card className="p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6 text-black">
            Welcome
          </h2>

          <div className="space-y-4">
            {/* Sign In Button */}
            <Link href="/signin" className="block">
              <Button className="w-full" size="lg">
                Sign In
              </Button>
            </Link>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Sign Up Button */}
            <Link href="/signup" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Start Free Trial
              </Button>
            </Link>

            {/* Trial Info */}
            <p className="text-center text-sm text-gray-600 mt-4">
              🎉 3 free transcriptions • 7-day trial • No credit card required
            </p>
          </div>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          {[
            { icon: '👥', label: 'Speaker ID' },
            { icon: '📊', label: 'Sentiment' },
            { icon: '🏷️', label: 'Topics' },
            { icon: '📝', label: 'Summary' },
          ].map((feature) => (
            <div key={feature.label} className="bg-white rounded-lg p-3 border">
              <div className="text-2xl mb-1">{feature.icon}</div>
              <p className="text-xs font-medium text-gray-700">{feature.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
