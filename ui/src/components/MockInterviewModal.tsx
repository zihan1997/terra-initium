import React, { useState } from 'react';
import { Timer, X, Tags, Hash, Star, CheckSquare } from 'lucide-react';
import type { Question } from '../types/Question';
import { shuffleArray } from '../utils/QuestionUtils';

interface MockInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onStart: (duration: number, selectedQuestions: number[]) => void;
}

export function MockInterviewModal({ isOpen, onClose, questions, onStart }: MockInterviewModalProps) {
  const [duration, setDuration] = useState(30);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [customDuration, setCustomDuration] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'tags' | 'numbers'>('tags');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showTopQuestionsOnly, setShowTopQuestionsOnly] = useState(false);

  if (!isOpen) return null;

  const uniqueTags = Array.from(new Set(questions.map(q => q.keyword))).sort();
  const topQuestions = questions.filter(q => q.top);
  const regularQuestions = questions.filter(q => !q.top);
  const displayQuestions = showTopQuestionsOnly ? topQuestions : questions;

  const handleQuestionToggle = (id: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQuestions(newSelected);
  };

  const handleTagToggle = (tag: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tag)) {
      newSelectedTags.delete(tag);
      // Remove all questions with this tag
      const newSelectedQuestions = new Set(
        Array.from(selectedQuestions).filter(id =>
          !questions.find(q => q.id === id && q.keyword === tag)
        )
      );
      setSelectedQuestions(newSelectedQuestions);
    } else {
      newSelectedTags.add(tag);
      // Add all questions with this tag in random order
      const questionsToAdd = showTopQuestionsOnly
        ? questions.filter(q => q.keyword === tag && q.top)
        : questions.filter(q => q.keyword === tag);

      // Shuffle the questions before adding them
      const shuffledQuestions = shuffleArray(questionsToAdd);

      // Convert existing selected questions to array, add new ones, and shuffle again
      const currentSelected = Array.from(selectedQuestions);
      const allQuestions = shuffleArray([...currentSelected, ...shuffledQuestions.map(q => q.id)]);

      setSelectedQuestions(new Set(allQuestions));
    }
    setSelectedTags(newSelectedTags);
  };

  const handleSelectAllTags = () => {
    const availableTags = uniqueTags.filter(tag => {
      const questionsWithTag = displayQuestions.filter(q => q.keyword === tag);
      return questionsWithTag.length > 0;
    });

    if (selectedTags.size === availableTags.length) {
      // If all tags are selected, deselect all
      setSelectedTags(new Set());
      setSelectedQuestions(new Set());
    } else {
      // Select all available tags and their questions in random order
      const newSelectedTags = new Set(availableTags);

      // Get all questions for available tags and shuffle them
      const allQuestions = displayQuestions.filter(question =>
        availableTags.includes(question.keyword)
      );

      // Perform a thorough shuffle of the questions
      const shuffledQuestions = shuffleArray(allQuestions);

      setSelectedTags(newSelectedTags);
      setSelectedQuestions(new Set(shuffledQuestions.map(q => q.id)));
    }
  };

  const handleTopQuestionsToggle = () => {
    const newShowTopQuestionsOnly = !showTopQuestionsOnly;
    setShowTopQuestionsOnly(newShowTopQuestionsOnly);

    if (newShowTopQuestionsOnly) {
      // When enabling top questions only, clear current selections and auto-select all top questions
      const shuffledTopQuestions = shuffleArray(topQuestions.map(q => q.id));
      setSelectedQuestions(new Set(shuffledTopQuestions));
      setSelectedTags(new Set(topQuestions.map(q => q.keyword)));
    } else {
      // When disabling, clear selections
      setSelectedQuestions(new Set());
      setSelectedTags(new Set());
    }
  };

  const handleStart = () => {
    // Perform one final shuffle before starting
    const finalQuestions = shuffleArray(Array.from(selectedQuestions));
    onStart(duration, finalQuestions);
    onClose();
    // Reset selections for next time
    setSelectedQuestions(new Set());
    setSelectedTags(new Set());
    setShowTopQuestionsOnly(false);
  };

  const availableTags = uniqueTags.filter(tag => {
    const questionsWithTag = displayQuestions.filter(q => q.keyword === tag);
    return questionsWithTag.length > 0;
  });

  const allTagsSelected = availableTags.length > 0 && selectedTags.size === availableTags.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Timer className="w-6 h-6" />
            Mock Interview Setup
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Duration</h3>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => {
                setCustomDuration(false);
                setDuration(30);
              }}
              className={`px-4 py-2 rounded ${
                !customDuration && duration === 30
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 minutes
            </button>
            <button
              onClick={() => {
                setCustomDuration(false);
                setDuration(45);
              }}
              className={`px-4 py-2 rounded ${
                !customDuration && duration === 45
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              45 minutes
            </button>
            <button
              onClick={() => {
                setCustomDuration(false);
                setDuration(60);
              }}
              className={`px-4 py-2 rounded ${
                !customDuration && duration === 60
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              60 minutes
            </button>
            <button
              onClick={() => setCustomDuration(true)}
              className={`px-4 py-2 rounded ${
                customDuration
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
          {customDuration && (
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter duration in minutes"
            />
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Selection Mode</h3>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSelectionMode('tags')}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                selectionMode === 'tags'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tags className="w-5 h-5" />
              Select by Tags
            </button>
            <button
              onClick={() => setSelectionMode('numbers')}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                selectionMode === 'numbers'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Hash className="w-5 h-5" />
              Select by Numbers
            </button>
          </div>

          <div className="mb-6">
            <button
              onClick={handleTopQuestionsToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                showTopQuestionsOnly
                  ? 'bg-amber-100 text-amber-800 border-2 border-amber-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star className={`w-5 h-5 ${showTopQuestionsOnly ? 'fill-amber-500' : ''}`} />
              {showTopQuestionsOnly ? 'Showing Top Questions Only' : 'Show Top Questions Only'}
              <span className="ml-2 text-sm">
                ({topQuestions.length} questions)
              </span>
            </button>
          </div>

          {selectionMode === 'tags' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Select Tags</h4>
                <button
                  onClick={handleSelectAllTags}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    allTagsSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {allTagsSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueTags.map((tag) => {
                  const questionsWithTag = displayQuestions.filter(q => q.keyword === tag);
                  if (questionsWithTag.length === 0) return null;

                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.has(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                      <span className="ml-1 opacity-75">
                        ({questionsWithTag.length})
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Selected Questions</h4>
                <div className="text-sm text-gray-600">
                  {selectedQuestions.size} questions selected
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {showTopQuestionsOnly && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Top Questions</h4>
                  <div className="space-y-2">
                    {topQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded"
                      >
                        <input
                          type="checkbox"
                          id={`question-${question.id}`}
                          checked={selectedQuestions.has(question.id)}
                          onChange={() => handleQuestionToggle(question.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`question-${question.id}`}
                          className="ml-2 block text-sm text-gray-900"
                        >
                          <span className="font-medium">#{question.id}</span> - {question.question}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!showTopQuestionsOnly && (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      className={`flex items-center p-2 hover:bg-gray-50 rounded ${
                        question.top ? 'bg-amber-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`question-${question.id}`}
                        checked={selectedQuestions.has(question.id)}
                        onChange={() => handleQuestionToggle(question.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`question-${question.id}`}
                        className="ml-2 block text-sm text-gray-900"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{question.id}</span>
                          {question.top && (
                            <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
                          )}
                          <span>{question.question}</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={selectedQuestions.size === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Mock Interview ({selectedQuestions.size} questions)
          </button>
        </div>
      </div>
    </div>
  );
}
