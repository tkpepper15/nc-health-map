'use client';

import React, { useState } from 'react';

export default function DataUpdatePanelFixed() {
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus('Starting update...');
    
    try {
      const response = await fetch('/api/process-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        setUpdateStatus(`✅ Updated ${result.counts?.combined_records || 0} counties successfully!`);
        setLastUpdated(new Date());
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateStatus(''), 3000);
        
        // Trigger a page refresh to show new data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error(`Update failed: ${response.statusText}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update failed';
      setUpdateStatus(`❌ ${errorMsg}`);
      setTimeout(() => setUpdateStatus(''), 5000);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Data Management</h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-600">Connected</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded text-sm font-medium ${
            isUpdating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isUpdating && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          <span>
            {isUpdating ? 'Processing...' : 'Refresh Data'}
          </span>
        </button>
        
        {updateStatus && (
          <div className={`text-xs p-2 rounded ${
            updateStatus.includes('❌') 
              ? 'bg-red-50 text-red-700'
              : updateStatus.includes('✅')
              ? 'bg-green-50 text-green-700'
              : 'bg-blue-50 text-blue-700'
          }`}>
            {updateStatus}
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          {lastUpdated ? `Updated: ${lastUpdated.toLocaleDateString()}` : 'Click to refresh from Supabase database'}
        </div>
      </div>
    </div>
  );
}