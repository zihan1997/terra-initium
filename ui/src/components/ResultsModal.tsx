import React from 'react';
import { X, Trophy, CheckCircle, XCircle } from 'lucide-react';
import type { Question, MockInterviewResults } from '../types/Question';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: MockInterviewResults;
  questions: Question[];
}

export function ResultsModal({ isOpen, onClose, results, questions }: ResultsModalProps) {
  if (!isOpen) return null;

  const percentage = Math.round((results.totalScore / results.maxPossibleScore) * 100);
  const questionsMap = new Map(questions.map(q => [q.id, q]));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Mock Interview Results
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {results.totalScore} / {results.maxPossibleScore}
            </div>
            <div className="text-xl text-gray-600">
              Score: {percentage}%
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {results.scores.map((score) => {
            const question = questionsMap.get(score.questionId);
            if (!question) return null;

            return (
              <div key={score.questionId} className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {score.score >= 4 ? (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {question.question}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                        Score: {score.score}/5
                      </span>
                      {question.top && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                          Top Question
                        </span>
                      )}
                    </div>
                    <div className="prose prose-sm">
                      <div
                        dangerouslySetInnerHTML={{ __html: question.answer }}
                        className="text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}