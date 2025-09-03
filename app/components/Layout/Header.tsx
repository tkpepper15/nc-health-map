'use client';

import React from 'react';

interface HeaderProps {
  activeTab: 'index' | 'data' | 'project';
  onTabChange: (tab: 'index' | 'data' | 'project') => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const tabs = [
    { id: 'index', label: 'Map' },
    { id: 'data', label: 'Data' },
    { id: 'project', label: 'Project' }
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">
              <span className="hidden sm:inline">North Carolina Healthcare Vulnerability Index</span>
              <span className="sm:hidden">NC HCVI</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-label="Open navigation menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}