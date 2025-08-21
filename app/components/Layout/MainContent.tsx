'use client';

import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export default function MainContent({ children, sidebarOpen, onSidebarToggle }: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col relative">
      {/* Mobile header with menu button */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-16 z-30">
        <button
          onClick={onSidebarToggle}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm font-medium">Controls</span>
        </button>
      </div>

      {/* Desktop sidebar toggle button */}
      <div className="hidden lg:block absolute top-4 left-4 z-40">
        <button
          onClick={onSidebarToggle}
          className="bg-white shadow-lg rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            )}
          </svg>
        </button>
      </div>

      {/* Main content area - Optimized for map display */}
      <main className="flex-1 relative w-full overflow-hidden bg-slate-50">
        <div className="h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}