import React, { useEffect, useState } from 'react';
import { QuestionList } from './components/QuestionList';
import { KeywordFilter } from './components/KeywordFilter';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { MockInterviewModal } from './components/MockInterviewModal';
import { MockInterviewTimer } from './components/MockInterviewTimer';
import { ResultsModal } from './components/ResultsModal';
import { loadQuestions } from './utils/loadQuestions';
import {
  filterQuestions,
  extractUniqueKeywords,
  shuffleArray,
} from './utils/filterQuestions';
import type { Question, MockInterviewSettings, QuestionScore, MockInterviewResults } from './types/Question';
import { Clock, X } from 'lucide-react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [mockSettings, setMockSettings] = useState<MockInterviewSettings>({
    duration: 30,
    selectedQuestions: [],
    isActive: false,
  });
  const [scores, setScores] = useState<QuestionScore[]>([]);
  const [results, setResults] = useState<MockInterviewResults | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [gptToken, setGptToken] = useState<string>('');

  // Load GPT token from localStorage on component mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('gpt-token');
    if (savedToken) {
      setGptToken(savedToken);
    }
  }, []);

  const handleTokenChange = (token: string) => {
    setGptToken(token);
    if (token) {
      sessionStorage.setItem('gpt-token', token);
    } else {
      sessionStorage.removeItem('gpt-token');
    }
  };

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const data = await loadQuestions();
        data.sort((a, b) => {
          if (a.top !== b.top) {
            return b.top ? 1 : -1;
          }
          if (a.keyword.localeCompare(b.keyword) !== 0) {
            return a.keyword.localeCompare(b.keyword);
          }
          return a.id - b.id;
        });
        setQuestions(data);
        setError(null);
      } catch (err) {
        setError('Failed to load interview questions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  const keywords = extractUniqueKeywords(questions);
  const filteredQuestions = mockSettings.isActive
    ? questions.filter(q => mockSettings.selectedQuestions.includes(q.id))
    : filterQuestions(questions, selectedKeyword);

  const handleStartMock = (duration: number, selectedQuestions: number[]) => {
    // Shuffle the selected questions
    const shuffledQuestions = shuffleArray([...selectedQuestions]);
    const initialScores = shuffledQuestions.map(id => ({
      questionId: id,
      score: 0,
      isSubmitted: false
    }));
    setScores(initialScores);
    setMockSettings({
      duration,
      selectedQuestions: shuffledQuestions,
      isActive: true,
      startTime: new Date(),
    });
  };

  const handleScoreChange = (questionId: number, score: number) => {
    setScores(prev => prev.map(s => 
      s.questionId === questionId 
        ? { ...s, score }
        : s
    ));
  };

  const handleAudioSubmit = async (questionId: number, audio: Blob) => {
    // Set submitting state
    setScores(prev => prev.map(s => 
      s.questionId === questionId 
        ? { ...s, isSubmitting: true, userAudio: audio }
        : s
    ));

    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      // Create FormData for the API call
      const formData = new FormData();
      formData.append('audio', audio, `question_${questionId}.wav`);
      formData.append('question', question.question);
      formData.append('correctAnswer', question.answer);
      formData.append('token', gptToken);

      const response = await fetch('/evaluate-question/', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      console.log("result", result);
      
      // Update with AI score and set manual score to match
      setScores(prev => prev.map(s => 
        s.questionId === questionId 
          ? { ...s, 
            isSubmitting: false, 
            aiScore: result.score, 
            score: result.score, 
            aiExplanation: result.explanation 
          }
          : s
      ));
      
    } catch (error) {
      console.error('Error submitting audio:', error);
      // Reset submitting state on error
      setScores(prev => prev.map(s => 
        s.questionId === questionId 
          ? { ...s, isSubmitting: false }
          : s
      ));
      alert('Error submitting audio. Please try again.');
    }
  };

  const handleEndMock = () => {
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const maxPossibleScore = scores.length * 5;
    
    setResults({
      scores,
      totalScore,
      maxPossibleScore,
      completedAt: new Date()
    });

    setMockSettings({
      duration: 30,
      selectedQuestions: [],
      isActive: false,
    });
    
    setIsResultsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Interview Questions
          </h1>
          <p className="mt-2 text-gray-600">
            Prepare for your next interview with these common questions
          </p>
          {!mockSettings.isActive && (
            <button
              onClick={() => setIsMockModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Clock className="w-5 h-5 mr-2" />
              Start Mock Interview
            </button>
          )}
          {!gptToken && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                💡 Add your OpenAI GPT token in settings to enable AI-powered answer evaluation
              </p>
            </div>
          )}
        </header>

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            {!mockSettings.isActive && (
              <KeywordFilter
                keywords={keywords}
                selectedKeyword={selectedKeyword}
                onKeywordSelect={setSelectedKeyword}
              />
            )}
            <QuestionList 
              questions={filteredQuestions}
              isMockMode={mockSettings.isActive}
              gptToken={gptToken}
              scores={scores}
              onScoreChange={mockSettings.isActive ? handleScoreChange : undefined}
              onAudioSubmit={mockSettings.isActive ? handleAudioSubmit : undefined}
            />
          </>
        )}
      </div>

      <MockInterviewModal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
        questions={questions}
        onStart={handleStartMock}
      />

      {mockSettings.isActive && mockSettings.startTime && (
        <>
          <MockInterviewTimer
            duration={mockSettings.duration}
            startTime={mockSettings.startTime}
            onTimeUp={handleEndMock}
          />
          <button
            onClick={handleEndMock}
            className="fixed top-4 right-32 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <X className="w-5 h-5" />
            End Mock Interview
          </button>
        </>
      )}

      {results && (
        <ResultsModal
          isOpen={isResultsModalOpen}
          onClose={() => setIsResultsModalOpen(false)}
          results={results}
          questions={questions}
        />
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        gptToken={gptToken}
        onTokenChange={handleTokenChange}
      />
    </div>
  );
}