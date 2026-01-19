import type { Question } from '../types/Question';

export function filterQuestions(
  questions: Question[],
  keyword: string | null
): Question[] {
  if (!keyword) return questions;
  return questions.filter((question) => question.keyword === keyword);
}

export function extractUniqueKeywords(questions: Question[]): string[] {
  const keywords = new Set(questions.map((question) => question.keyword));
  return Array.from(keywords).sort();
}

export function shuffleArray<T>(array: T[]): T[] {
  // Create a new array to avoid mutating the original
  const shuffled = [...array];
  // Fisher-Yates shuffle algorithm with stronger randomization
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use crypto.getRandomValues for better randomization
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % (i + 1);
    // Swap elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sortByTopAndKeyword(data: Question[]) {
  data.sort((a, b) => {
    if (a.top !== b.top) {
      return b.top ? 1 : -1;
    }
    if (a.keyword.localeCompare(b.keyword) !== 0) {
      return a.keyword.localeCompare(b.keyword);
    }
    return a.id - b.id;
  });
}
