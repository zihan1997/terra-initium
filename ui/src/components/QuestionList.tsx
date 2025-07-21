import React from 'react';
import { QuestionCard } from './QuestionCard';
import type { Question, QuestionScore } from '../types/Question';

interface QuestionListProps {
  questions: Question[];
  isMockMode?: boolean;
  gptToken?: string;
  scores?: QuestionScore[];
  onScoreChange?: (questionId: number, score: number) => void;
  onAudioSubmit?: (questionId: number, audio: Blob) => void;
}

export function QuestionList({ 
  questions,
  isMockMode = false,
  gptToken,
  scores = [],
  onScoreChange,
  onAudioSubmit
}: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        No questions available.
      </div>
    );
  }

  const scoresMap = new Map(scores.map(s => [s.questionId, s]));

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <QuestionCard 
          key={question.id} 
          question={question}
          isMockMode={isMockMode}
          gptToken={gptToken}
          score={scoresMap.get(question.id)}
          onScoreChange={
            onScoreChange 
              ? (score) => onScoreChange(question.id, score)
              : undefined
          }
          onAudioSubmit={
            onAudioSubmit
              ? (audio) => onAudioSubmit(question.id, audio)
              : undefined
          }
        />
      ))}
    </div>
  );
}