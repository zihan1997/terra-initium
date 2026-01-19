import React from 'react';
import { Filter } from 'lucide-react';

interface InterviewFilterProps {
  positions: string[];
  clients: string[];
  selectedPosition: string | null;
  selectedClient: string | null;
  onPositionSelect: (position: string | null) => void;
  onClientSelect: (client: string | null) => void;
}

export function InterviewFilter({
  positions,
  clients,
  selectedPosition,
  selectedClient,
  onPositionSelect,
  onClientSelect,
}: InterviewFilterProps) {
  return (
    <div className="mb-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter by Position</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onPositionSelect(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedPosition === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {positions.map((position) => (
            <button
              key={position}
              onClick={() => onPositionSelect(position)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedPosition === position
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {position}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter by Client</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onClientSelect(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedClient === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {clients.map((client) => (
            <button
              key={client}
              onClick={() => onClientSelect(client)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedClient === client
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {client}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
