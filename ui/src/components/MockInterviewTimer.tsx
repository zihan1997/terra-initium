import React, { useEffect, useState } from 'react';
import { Timer, AlertCircle } from 'lucide-react';

interface MockInterviewTimerProps {
  duration: number;
  startTime: Date;
  onTimeUp: () => void;
}

export function MockInterviewTimer({ duration, startTime, onTimeUp }: MockInterviewTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = duration * 60 - elapsed;
      
      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
        setIsWarning(remaining <= 300); // Warning when 5 minutes or less remaining
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, startTime, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`fixed top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
      isWarning ? 'bg-red-100' : 'bg-white'
    }`}>
      {isWarning ? (
        <AlertCircle className="w-5 h-5 text-red-600" />
      ) : (
        <Timer className="w-5 h-5 text-indigo-600" />
      )}
      <span className={`font-mono text-lg font-bold ${
        isWarning ? 'text-red-600' : 'text-indigo-600'
      }`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}