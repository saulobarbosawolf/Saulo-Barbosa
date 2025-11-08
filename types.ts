
export interface Topic {
  id: number;
  title: string;
  content: string | null;
  quiz: QuizQuestion[] | null;
  isCompleted: boolean;
  score: number | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export type AppState = 'topic_selection' | 'content_view' | 'quiz_view' | 'results_view';

export type MedalType = 'bronze' | 'silver' | 'gold';
