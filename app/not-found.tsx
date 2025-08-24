'use client';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="mb-4">Could not find the requested resource.</p>
        <a href="/" className="text-blue-600 hover:underline">
          Return Home
        </a>
      </div>
    </div>
  );
}