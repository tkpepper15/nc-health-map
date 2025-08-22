'use client';

import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

export default function MainContent({ children, sidebarOpen = false, onSidebarToggle }: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col relative">
      {/* Mobile header with menu button - only show if sidebar toggle is provided */}
      {onSidebarToggle && (
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
      )}


      {/* Main content area - Optimized for map display */}
      <main className="flex-1 relative w-full overflow-hidden bg-slate-100">
        <div className="h-full w-full content-scroll">
          {children}
        </div>
      </main>
    </div>
  );
}