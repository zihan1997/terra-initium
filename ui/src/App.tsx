import React, { useEffect, useState } from 'react';
import { QuestionList } from './components/QuestionList';
import { KeywordFilter } from './components/KeywordFilter';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { MockInterviewModal } from './components/MockInterviewModal';
import { MockInterviewTimer } from './components/MockInterviewTimer';
import { ResultsModal } from './components/ResultsModal';
import { InterviewList } from './components/InterviewList';
import { InterviewFilter } from './components/InterviewFilter';
import { loadQuestions } from './service/loadQuestions';
import { loadInterviews } from './service/InterviewService';
import {
  filterQuestions,
  extractUniqueKeywords,
  shuffleArray,
  sortByTopAndKeyword,
} from './utils/QuestionUtils';
import type { Question, MockInterviewSettings, QuestionScore, MockInterviewResults } from './types/Question';
import type { Interview } from './types/Interview';
import { Clock, X, BookOpen, Users } from 'lucide-react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { ERROR_FETCHING_QUESTIONS, ERROR_SUBMITTING_AUDIO, GPT_ADD_HINT, GPT_TOKEN, MOCK_START, PAGE_DISCRIPTION, PAGE_TITLE } from './utils/constant';

export default function App() {
  const [activeTab, setActiveTab] = useState<'questions' | 'interviews'>('questions');
  const [isLoading, setIsLoading] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
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
    const savedToken = sessionStorage.getItem(GPT_TOKEN);
    if (savedToken) {
      setGptToken(savedToken);
    }
  }, []);

  const handleTokenChange = (token: string) => {
    setGptToken(token);
    if (token) {
      sessionStorage.setItem(GPT_TOKEN, token);
    } else {
      sessionStorage.removeItem(GPT_TOKEN);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [questionsData, interviewsData] = await Promise.all([
          loadQuestions(),
          loadInterviews()
        ]);
        sortByTopAndKeyword(questionsData);
        setQuestions(questionsData);
        setInterviews(interviewsData);
        setError(null);
      } catch (err) {
        setError(ERROR_FETCHING_QUESTIONS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const keywords = extractUniqueKeywords(questions);
  const filteredQuestions = mockSettings.isActive
    ? questions.filter(q => mockSettings.selectedQuestions.includes(q.id))
    : filterQuestions(questions, selectedKeyword);

  const positions = Array.from(new Set(interviews.map(i => i.position))).sort();
  const clients = Array.from(new Set(interviews.map(i => i.client))).sort();

  const filteredInterviews = interviews.filter(interview => {
    if (selectedPosition && interview.position !== selectedPosition) return false;
    if (selectedClient && interview.client !== selectedClient) return false;
    return true;
  });

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
      alert(ERROR_SUBMITTING_AUDIO);
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
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {PAGE_TITLE}
          </h1>
          <p className="mt-2 text-gray-600">
            {PAGE_DISCRIPTION}
          </p>

          {!mockSettings.isActive && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'questions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Interview Questions
              </button>
              <button
                onClick={() => setActiveTab('interviews')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'interviews'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Users className="w-5 h-5" />
                Real Interview Data
              </button>
            </div>
          )}

          {!mockSettings.isActive && activeTab === 'questions' && (
            <button
              onClick={() => setIsMockModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Clock className="w-5 h-5 mr-2" />
              {MOCK_START}
            </button>
          )}
          {!gptToken && activeTab === 'questions' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-base text-amber-800">
                {GPT_ADD_HINT}
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
            {activeTab === 'questions' ? (
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
            ) : (
              <>
                <InterviewFilter
                  positions={positions}
                  clients={clients}
                  selectedPosition={selectedPosition}
                  selectedClient={selectedClient}
                  onPositionSelect={setSelectedPosition}
                  onClientSelect={setSelectedClient}
                />
                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredInterviews.length} of {interviews.length} interview records
                </div>
                <InterviewList interviews={filteredInterviews} />
              </>
            )}
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
