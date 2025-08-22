'use client';

import React from 'react';

interface IndexDescriptionCardProps {
  title: string;
  description: string;
  helpText?: string;
}

export default function IndexDescriptionCard({ 
  title, 
  description, 
  helpText 
}: IndexDescriptionCardProps) {
  return (
    <div className="climate-card p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 leading-tight">
          {title}
        </h2>
        {helpText && (
          <button
            className="ml-2 w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-50 flex-shrink-0"
            title={helpText}
          >
            ?
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}