'use client';

interface DataSourceIndicatorProps {
  source: 'supabase' | 'local' | 'fallback';
  lastUpdated: Date | null;
  error?: string;
  onSourceToggle?: () => void;
  isToggleable?: boolean;
}

export default function DataSourceIndicator({ source, lastUpdated, error, onSourceToggle, isToggleable = false }: DataSourceIndicatorProps) {
  const getIndicatorConfig = () => {
    switch (source) {
      case 'supabase':
        return {
          icon: '🟢',
          label: 'Supabase',
          description: 'Real-time database',
          color: 'text-green-700 bg-green-50 border-green-200'
        };
      case 'local':
        return {
          icon: '🟡',
          label: 'Local Files',
          description: 'Demonstration data',
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200'
        };
      case 'fallback':
      default:
        return {
          icon: '🔴',
          label: 'Fallback',
          description: error || 'No data source',
          color: 'text-red-700 bg-red-50 border-red-200'
        };
    }
  };

  const config = getIndicatorConfig();

  return (
    <div 
      className={`fixed bottom-4 right-4 z-40 px-3 py-2 rounded-lg border ${config.color} shadow-lg ${
        isToggleable ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
      }`}
      onClick={isToggleable ? onSourceToggle : undefined}
      title={isToggleable ? 'Click to toggle data source' : undefined}
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm">{config.icon}</span>
        <div className="text-xs">
          <div className="font-medium">{config.label}</div>
          <div className="opacity-75">{config.description}</div>
          {lastUpdated && (
            <div className="opacity-60 mt-1">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {isToggleable && (
            <div className="opacity-50 text-xs mt-1">
              Click to toggle
            </div>
          )}
        </div>
      </div>
    </div>
  );
}