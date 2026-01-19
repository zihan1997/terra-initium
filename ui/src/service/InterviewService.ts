import type { Interview } from '../types/Interview';

export async function loadInterviews(): Promise<Interview[]> {
  try {
    const response = await fetch('./mian-jing.json');
    if (!response.ok) {
      throw new Error('Failed to load interviews');
    }
    return response.json();
  } catch (error) {
    console.error('Error loading interviews:', error);
    return [];
  }
}
