import React from 'react';
import { InterviewCard } from './InterviewCard';
import type { Interview } from '../types/Interview';

interface InterviewListProps {
  interviews: Interview[];
}

export function InterviewList({ interviews }: InterviewListProps) {
  if (interviews.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        No interview records available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} />
      ))}
    </div>
  );
}
