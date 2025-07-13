import type { Question } from '../types/Question';

export async function loadQuestions(): Promise<Question[]> {
  try {
    const response = await fetch('./InterviewQuestionList.json');
    if (!response.ok) {
      throw new Error('Failed to load questions');
    }
    return response.json();
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
}