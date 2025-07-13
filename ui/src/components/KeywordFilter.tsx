import React from 'react';
import { Tag } from 'lucide-react';

interface KeywordFilterProps {
  keywords: string[];
  selectedKeyword: string | null;
  onKeywordSelect: (keyword: string | null) => void;
}

export function KeywordFilter({ keywords, selectedKeyword, onKeywordSelect }: KeywordFilterProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Filter by Keyword</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onKeywordSelect(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedKeyword === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {keywords.map((keyword) => (
          <button
            key={keyword}
            onClick={() => onKeywordSelect(keyword)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedKeyword === keyword
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {keyword}
          </button>
        ))}
      </div>
    </div>
  );
}