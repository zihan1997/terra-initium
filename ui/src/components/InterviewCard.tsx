import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Building2, User, Briefcase } from 'lucide-react';
import type { Interview } from '../types/Interview';

interface InterviewCardProps {
  interview: Interview;
}

export function InterviewCard({ interview }: InterviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border-gray-100 rounded-lg shadow-md p-4 mb-4 transition-all duration-200 hover:shadow-lg border">
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {interview.position}
              </span>
              <span className="flex items-center gap-1 text-gray-600 text-sm">
                <Calendar className="w-4 h-4" />
                {interview.date}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Client:</span>
                <span>{interview.client}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Vendor:</span>
                <span>{interview.vendor}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Interviewer:</span>
                <span>{interview.interviewer}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Candidate:</span>
                <span>{interview.candidate}</span>
              </div>
            </div>
          </div>

          <button
            className="ml-4 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={isExpanded ? "Collapse questions" : "Expand questions"}
          >
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {interview.questions.length} question{interview.questions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {isExpanded && interview.questions.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Interview Questions:</h4>
          {interview.questions.map((question, index) => (
            <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <div
                  className="flex-1 prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700"
                  dangerouslySetInnerHTML={{ __html: question.text }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
