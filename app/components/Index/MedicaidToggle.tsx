'use client';

interface MedicaidToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function MedicaidToggle({ isEnabled, onToggle }: MedicaidToggleProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">SVI Overlay</span>
          <p className="text-xs text-gray-500">Show social vulnerability</p>
        </div>
        <div className="relative">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-8 h-4 rounded-full transition-colors ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}>
            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${
              isEnabled ? 'translate-x-4' : 'translate-x-0'
            } mt-0.5 ml-0.5`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}