import type { Question } from '../types/Question';

export async function loadQuestions(): Promise<Question[]> {
  try {
    const response = await fetch('./interview-question-list');
    if (!response.ok) {
      throw new Error('Failed to load questions');
    }
    const encryptedQuestions: Question[] = await response.json();
    return encryptedQuestions.map(question => {
      return {
        ...question,
        question: atob(question.question),
        answer: question.answer? atob(question.answer): ''
      }
    })
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
}
