export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export type CardRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  type: 'basic' | 'cloze';
  tags: string[];
  starred?: boolean;
  state: CardState;
  step: number;          // Learning step index (e.g. 0 for 1 min, 1 for 10 min)
  reps: number;          // Number of successful reviews in current streak
  lapses: number;        // Number of times card was rated "Again"
  interval: number;      // Days (e.g., 1, 4, 12, or fractional for learning)
  easeFactor: number;    // Starting at 2.50, min 1.30
  due: number;           // Millisecond timestamp when card is due
  createdAt: number;
  lastReviewedAt?: number;
  againCount?: number;   // Number of times "Again" was pressed in current cycle
  hardCount?: number;    // Number of times "Hard" was pressed in current cycle
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  newLimit: number;      // Default new cards per day (e.g. 20)
  reviewLimit: number;   // Default max reviews per day (e.g. 100)
  createdAt: number;
}

export interface DeckCounts {
  newCount: number;      // Blue
  learnCount: number;    // Red / Orange
  dueCount: number;      // Green
  totalCount: number;
}

export interface IntervalPreview {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: CardRating;
  timestamp: number;
  previousCardSnapshot: Card;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  scratchpadAutoShow: boolean;
  showTimer: boolean;
  swipeGestures: boolean;
  soundEnabled: boolean;
}
