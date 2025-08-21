'use client';

import { useState } from 'react';
import { getDataLayersByCategory } from '../../utils/dataLayers';

interface MetricsPanelProps {
  selectedMetrics: string[];
  onMetricChange: (metric: string) => void;
}

export default function MetricsPanel({ selectedMetrics, onMetricChange }: MetricsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['composite']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Get data layers organized by category (CCVI methodology)
  const dataLayers = getDataLayersByCategory();
  
  // Create metrics structure from data layers
  const metrics = {
    composite: {
      title: 'COMPOSITE INDEX',
      items: dataLayers.composite?.map(layer => ({
        id: layer.id,
        label: layer.name,
        checked: selectedMetrics.includes(layer.id)
      })) || []
    },
    'healthcare-access': {
      title: 'Healthcare Access',
      items: dataLayers['healthcare-access']?.map(layer => ({
        id: layer.id,
        label: layer.name,
        checked: selectedMetrics.includes(layer.id)
      })) || []
    },
    'policy-risk': {
      title: 'Policy Impact Risk',
      items: dataLayers['policy-risk']?.map(layer => ({
        id: layer.id,
        label: layer.name,
        checked: selectedMetrics.includes(layer.id)
      })) || []
    },
    'economic-vulnerability': {
      title: 'Economic Vulnerability',
      items: dataLayers['economic-vulnerability']?.map(layer => ({
        id: layer.id,
        label: layer.name,
        checked: selectedMetrics.includes(layer.id)
      })) || []
    }
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {Object.entries(metrics).map(([sectionKey, section]) => (
        <div key={sectionKey} className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleSection(sectionKey)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <h4 className="font-medium text-gray-900">{section.title}</h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isExpanded(sectionKey) ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded(sectionKey) && (
            <div className="px-6 pb-4 space-y-3">
              {section.items.map((item) => (
                <label key={item.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(item.id)}
                    onChange={() => onMetricChange(item.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}