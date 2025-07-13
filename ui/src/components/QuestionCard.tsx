import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Hash, Star } from 'lucide-react';
import type { Question, QuestionScore } from '../types/Question';

interface QuestionCardProps {
  question: Question;
  isMockMode?: boolean;
  score?: QuestionScore;
  onScoreChange?: (score: number) => void;
}

export function QuestionCard({ 
  question, 
  isMockMode = false,
  score,
  onScoreChange 
}: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedAnswer = question.answer 
    ? question.answer.replace(/style="color: black;"/g, 'class="text-gray-800"')
    : '';

  const scoreButtons = [0, 1, 2, 3, 4, 5];

  return (
    <div className={`${
      question.top ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'
    } rounded-lg shadow-md p-4 mb-4 transition-all duration-200 hover:shadow-lg border relative`}>
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
              {question.keyword}
            </span>
            {question.top && (
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-semibold">
                <Star className="w-4 h-4 fill-amber-500" />
                Top Question
              </span>
            )}
            <div className="flex items-center text-gray-600 text-sm">
              <Hash className="w-4 h-4 mr-1" />
              <span>{question.id}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{question.question}</h3>
        </div>
        <button 
          className="ml-4 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label={isExpanded ? "Collapse answer" : "Expand answer"}
        >
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>
      
      {isExpanded && formattedAnswer && (
        <div className="mt-4">
          <div 
            className="p-4 bg-gray-50 rounded-lg prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-800 prose-pre:text-gray-100"
            dangerouslySetInnerHTML={{ __html: formattedAnswer }}
          />
        </div>
      )}
      
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          Frequency: {question.frequency}
        </span>
        
        {isMockMode && (
          <div className="flex items-center gap-2">
            {scoreButtons.map((value) => (
              <button
                key={value}
                onClick={(e) => {
                  e.stopPropagation();
                  onScoreChange?.(value);
                }}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  score?.score === value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}