import { AppSettings, Card, Deck, DeckCounts, ReviewLog } from '../types';
import { INITIAL_EASE_FACTOR, isCardDue } from './sm2';

const DECKS_KEY = 'anki_free_decks_v1';
const CARDS_KEY = 'anki_free_cards_v1';
const LOGS_KEY = 'anki_free_logs_v1';
const SETTINGS_KEY = 'anki_free_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  scratchpadAutoShow: false,
  showTimer: true,
  swipeGestures: true,
  soundEnabled: true,
};

const SAMPLE_DECKS: Deck[] = [
  {
    id: 'deck-spanish',
    name: 'Spanish - Everyday Essentials',
    description: 'High-frequency Spanish vocabulary and daily conversational phrases.',
    newLimit: 20,
    reviewLimit: 100,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'deck-geography',
    name: 'World Capitals & Geography',
    description: 'Capitals, continents, and geography trivia with Cloze deletions.',
    newLimit: 20,
    reviewLimit: 100,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'deck-medical',
    name: 'Medical & Anatomy Fundamentals',
    description: 'Core anatomical structures and physiological mechanisms.',
    newLimit: 20,
    reviewLimit: 100,
    createdAt: Date.now(),
  },
];

const SAMPLE_CARDS: Card[] = [
  // Spanish
  {
    id: 'sp-1',
    deckId: 'deck-spanish',
    front: '¿Cómo te llamas?',
    back: 'What is your name? (informal)',
    type: 'basic',
    tags: ['phrases', 'basics'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'sp-2',
    deckId: 'deck-spanish',
    front: 'Mucho gusto',
    back: 'Nice to meet you / A pleasure',
    type: 'basic',
    tags: ['phrases', 'basics'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'sp-3',
    deckId: 'deck-spanish',
    front: 'Por favor y gracias',
    back: 'Please and thank you',
    type: 'basic',
    tags: ['politeness'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'sp-4',
    deckId: 'deck-spanish',
    front: '¿Dónde está la biblioteca?',
    back: 'Where is the library?',
    type: 'basic',
    tags: ['questions', 'places'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'sp-5',
    deckId: 'deck-spanish',
    front: 'Buenas noches',
    back: 'Good evening / Good night',
    type: 'basic',
    tags: ['greetings'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },

  // Geography (Cloze & Basic)
  {
    id: 'geo-1',
    deckId: 'deck-geography',
    front: 'The capital city of Australia is {{c1::Canberra::capital city}}, not Sydney.',
    back: 'Canberra was chosen as the capital in 1908 as a compromise between Sydney and Melbourne.',
    type: 'cloze',
    tags: ['capitals', 'oceania'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'geo-2',
    deckId: 'deck-geography',
    front: 'The longest river in South America is the {{c1::Amazon River}}.',
    back: 'The Amazon River has the largest drainage basin and water flow in the world.',
    type: 'cloze',
    tags: ['rivers', 'south-america'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'geo-3',
    deckId: 'deck-geography',
    front: 'What is the capital of Japan?',
    back: 'Tokyo (東京)',
    type: 'basic',
    tags: ['capitals', 'asia'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'geo-4',
    deckId: 'deck-geography',
    front: 'The highest peak in Africa is {{c1::Mount Kilimanjaro::volcanic mountain}} located in Tanzania.',
    back: 'Kilimanjaro stands at 5,895 meters (19,341 feet) above sea level.',
    type: 'cloze',
    tags: ['mountains', 'africa'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },

  // Medical
  {
    id: 'med-1',
    deckId: 'deck-medical',
    front: 'What is the largest organ of the human body?',
    back: 'The skin (integumentary system), accounting for approximately 15% of body weight.',
    type: 'basic',
    tags: ['anatomy', 'dermatology'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'med-2',
    deckId: 'deck-medical',
    front: 'The {{c1::Left Ventricle::heart chamber}} pumps oxygenated blood into the aorta.',
    back: 'It has the thickest muscular myocardium to overcome systemic arterial resistance.',
    type: 'cloze',
    tags: ['cardiology', 'circulatory'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'med-3',
    deckId: 'deck-medical',
    front: 'What neurotransmitter is primarily depleted in Parkinson’s disease?',
    back: 'Dopamine (produced in the substantia nigra pars compacta).',
    type: 'basic',
    tags: ['neuroscience', 'pharmacology'],
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  },
];

export function getDecks(): Deck[] {
  const data = localStorage.getItem(DECKS_KEY);
  if (!data) {
    localStorage.setItem(DECKS_KEY, JSON.stringify(SAMPLE_DECKS));
    return SAMPLE_DECKS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SAMPLE_DECKS;
  }
}

export function saveDecks(decks: Deck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function getCards(): Card[] {
  const data = localStorage.getItem(CARDS_KEY);
  if (!data) {
    localStorage.setItem(CARDS_KEY, JSON.stringify(SAMPLE_CARDS));
    return SAMPLE_CARDS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SAMPLE_CARDS;
  }
}

export function saveCards(cards: Card[]): void {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function getDeckCounts(deckId: string): DeckCounts {
  const cards = getCards().filter(c => c.deckId === deckId);
  const now = Date.now();

  let newCount = 0;
  let learnCount = 0;
  let dueCount = 0;

  for (const card of cards) {
    if (card.state === 'new') {
      newCount++;
    } else if (card.state === 'learning' || card.state === 'relearning') {
      if (card.due <= now) {
        learnCount++;
      }
    } else if (card.state === 'review') {
      if (card.due <= now) {
        dueCount++;
      }
    }
  }

  return {
    newCount,
    learnCount,
    dueCount,
    totalCount: cards.length,
  };
}

export function getStudyQueue(deckId: string): Card[] {
  const cards = getCards().filter(c => c.deckId === deckId);
  const deck = getDecks().find(d => d.id === deckId);
  const now = Date.now();

  // Separate queues
  const learningDue: Card[] = [];
  const reviewDue: Card[] = [];
  const newCards: Card[] = [];

  for (const card of cards) {
    if (card.state === 'learning' || card.state === 'relearning') {
      if (card.due <= now) learningDue.push(card);
    } else if (card.state === 'review') {
      if (card.due <= now) reviewDue.push(card);
    } else if (card.state === 'new') {
      newCards.push(card);
    }
  }

  // Sort learning by due timestamp
  learningDue.sort((a, b) => a.due - b.due);
  // Sort review by due timestamp
  reviewDue.sort((a, b) => a.due - b.due);

  // Apply daily limits
  const maxNew = deck?.newLimit ?? 20;
  const maxReview = deck?.reviewLimit ?? 100;

  const limitedNew = newCards.slice(0, maxNew);
  const limitedReview = reviewDue.slice(0, maxReview);

  // Anki order: Learning cards first, then reviews, then new cards
  return [...learningDue, ...limitedReview, ...limitedNew];
}

export function logReview(log: ReviewLog): void {
  const logs = getReviewLogs();
  logs.push(log);
  // Keep last 500 logs
  if (logs.length > 500) logs.shift();
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function getReviewLogs(): ReviewLog[] {
  const data = localStorage.getItem(LOGS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function undoLastReview(): Card | null {
  const logs = getReviewLogs();
  if (logs.length === 0) return null;

  const lastLog = logs.pop();
  if (!lastLog) return null;

  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));

  // Revert card state in cards array
  const cards = getCards();
  const index = cards.findIndex(c => c.id === lastLog.cardId);
  if (index !== -1) {
    cards[index] = lastLog.previousCardSnapshot;
    saveCards(cards);
    return cards[index];
  }

  return null;
}

export function getSettings(): AppSettings {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportBackupJson(): string {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    decks: getDecks(),
    cards: getCards(),
    settings: getSettings(),
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackupJson(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.decks && Array.isArray(data.decks) && data.cards && Array.isArray(data.cards)) {
      saveDecks(data.decks);
      saveCards(data.cards);
      if (data.settings) saveSettings(data.settings);
      return true;
    }
  } catch (err) {
    console.error('Import error:', err);
  }
  return false;
}

import { parseCardsFromCsv } from './csv';

/**
 * Imports cards from CSV or tab-separated text (Front, Back, [Tags])
 */
export function importCardsFromText(deckId: string, text: string): number {
  const parsed = parseCardsFromCsv(text);
  if (parsed.length === 0) return 0;

  const newCards: Card[] = parsed.map((item) => ({
    id: 'card-' + Math.random().toString(36).substring(2, 9),
    deckId,
    front: item.front,
    back: item.back,
    type: item.type,
    tags: item.tags,
    state: 'new',
    step: 0,
    reps: 0,
    lapses: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    due: Date.now(),
    createdAt: Date.now(),
  }));

  const all = getCards();
  saveCards([...all, ...newCards]);
  return newCards.length;
}
