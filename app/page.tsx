'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Client-side page to avoid SSR issues

// Dynamically import the full client app
const ClientApp = dynamic(() => import('./ClientApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading North Carolina Healthcare Data...</p>
      </div>
    </div>
  ),
});

function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    }>
      <ClientApp />
    </Suspense>
  );
}

export default Home;