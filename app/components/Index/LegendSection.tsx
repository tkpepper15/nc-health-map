'use client';

import React from 'react';

interface LegendItem {
  label: string;
  color: string;
  description?: string;
}

interface LegendSectionProps {
  title: string;
  helpText?: string;
  items: LegendItem[];
}

export default function LegendSection({ title, helpText, items }: LegendSectionProps) {
  return (
    <div className="climate-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {helpText && (
          <button
            className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-50"
            title={helpText}
          >
            ?
          </button>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0 legend-dot" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}