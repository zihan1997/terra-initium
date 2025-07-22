export interface Question {
  id: number;
  question: string;
  answer: string;
  keyword: string;
  frequency: number;
  top: boolean;
}

export interface MockInterviewSettings {
  duration: number; // in minutes
  selectedQuestions: number[]; // array of question IDs
  isActive: boolean;
  startTime?: Date;
}

export interface QuestionScore {
  questionId: number;
  score: number; // 0-5
  userAudio?: Blob;
  isRecording?: boolean;
  hasRecording?: boolean;
  isSubmitting?: boolean;
  aiScore?: number;
  aiExplanation?: string;
}

export interface MockInterviewResults {
  scores: QuestionScore[];
  totalScore: number;
  maxPossibleScore: number;
  completedAt: Date;
  aiScores?: { questionId: number; score: number }[];
}