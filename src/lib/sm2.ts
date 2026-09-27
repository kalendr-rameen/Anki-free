import { Card, CardRating, IntervalPreview } from '../types';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const INITIAL_EASE_FACTOR = 2.50;
export const MIN_EASE_FACTOR = 1.30;

// Standard Anki learning steps: 1 minute, 10 minutes
const LEARNING_STEPS_MINUTES = [1, 10];
const GRADUATING_INTERVAL_DAYS = 1;
const EASY_INTERVAL_DAYS = 4;

export function formatInterval(ms: number): string {
  if (ms < DAY_MS) {
    const mins = Math.max(1, Math.round(ms / MINUTE_MS));
    return `<${mins}m`;
  }
  const days = Math.round(ms / DAY_MS);
  if (days < 30) {
    return `${days}d`;
  }
  if (days < 365) {
    const months = (days / 30).toFixed(1).replace(/\.0$/, '');
    return `${months}mo`;
  }
  const years = (days / 365).toFixed(1).replace(/\.0$/, '');
  return `${years}y`;
}

/**
 * Calculates human-readable interval preview strings for Again, Hard, Good, and Easy buttons
 */
export function calculateNextIntervals(card: Card): IntervalPreview {
  const isLearning = card.state === 'new' || card.state === 'learning' || card.state === 'relearning';

  if (isLearning) {
    const step = card.step;
    // Again: repeats step 0 (1m)
    const againMs = LEARNING_STEPS_MINUTES[0] * MINUTE_MS;
    // Hard: in learning, step 0 -> 6m or mid-step
    const hardMs = step === 0 ? 6 * MINUTE_MS : LEARNING_STEPS_MINUTES[0] * MINUTE_MS;
    // Good: advances step or graduates (1d)
    const goodMs = step + 1 < LEARNING_STEPS_MINUTES.length
      ? LEARNING_STEPS_MINUTES[step + 1] * MINUTE_MS
      : GRADUATING_INTERVAL_DAYS * DAY_MS;
    // Easy: directly graduates to 4 days
    const easyMs = EASY_INTERVAL_DAYS * DAY_MS;

    return {
      again: formatInterval(againMs),
      hard: formatInterval(hardMs),
      good: formatInterval(goodMs),
      easy: formatInterval(easyMs),
    };
  }

  // Card in 'review' state
  const curIntervalDays = Math.max(1, card.interval);
  const ef = card.easeFactor;

  // Again: Lapses back to step 0
  const againMs = 10 * MINUTE_MS;
  // Hard: interval * 1.2
  const hardDays = Math.max(1, Math.round(curIntervalDays * 1.2));
  // Good: interval * easeFactor
  const goodDays = Math.max(hardDays + 1, Math.round(curIntervalDays * ef));
  // Easy: interval * easeFactor * 1.3
  const easyDays = Math.max(goodDays + 1, Math.round(curIntervalDays * ef * 1.3));

  return {
    again: formatInterval(againMs),
    hard: formatInterval(hardDays * DAY_MS),
    good: formatInterval(goodDays * DAY_MS),
    easy: formatInterval(easyDays * DAY_MS),
  };
}

/**
 * Returns a new Card instance updated with Anki SM-2 spaced repetition logic
 */
export function scheduleCard(card: Card, rating: CardRating): Card {
  const now = Date.now();
  let nextState = card.state;
  let nextStep = card.step;
  let nextReps = card.reps;
  let nextLapses = card.lapses;
  let nextInterval = card.interval;
  let nextEaseFactor = card.easeFactor;
  let nextDue = now;

  const isLearning = card.state === 'new' || card.state === 'learning' || card.state === 'relearning';

  if (isLearning) {
    if (rating === 1) {
      // Again
      nextState = 'learning';
      nextStep = 0;
      nextDue = now + LEARNING_STEPS_MINUTES[0] * MINUTE_MS;
      nextLapses += card.state === 'relearning' ? 1 : 0;
    } else if (rating === 2) {
      // Hard
      nextState = 'learning';
      const hardMins = card.step === 0 ? 6 : LEARNING_STEPS_MINUTES[0];
      nextDue = now + hardMins * MINUTE_MS;
    } else if (rating === 3) {
      // Good
      if (card.step + 1 < LEARNING_STEPS_MINUTES.length) {
        nextState = 'learning';
        nextStep = card.step + 1;
        nextDue = now + LEARNING_STEPS_MINUTES[nextStep] * MINUTE_MS;
      } else {
        // Graduate to review
        nextState = 'review';
        nextStep = 0;
        nextReps = 1;
        nextInterval = GRADUATING_INTERVAL_DAYS;
        nextDue = now + GRADUATING_INTERVAL_DAYS * DAY_MS;
      }
    } else if (rating === 4) {
      // Easy: Instant graduation with bonus
      nextState = 'review';
      nextStep = 0;
      nextReps = 1;
      nextInterval = EASY_INTERVAL_DAYS;
      nextEaseFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor + 0.15);
      nextDue = now + EASY_INTERVAL_DAYS * DAY_MS;
    }
  } else {
    // Review state
    if (rating === 1) {
      // Again (lapse)
      nextState = 'relearning';
      nextStep = 0;
      nextReps = 0;
      nextLapses = card.lapses + 1;
      nextInterval = 1;
      nextEaseFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor - 0.20);
      nextDue = now + 10 * MINUTE_MS;
    } else if (rating === 2) {
      // Hard
      nextState = 'review';
      nextReps = card.reps + 1;
      nextInterval = Math.max(1, Math.round(card.interval * 1.2));
      nextEaseFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor - 0.15);
      nextDue = now + nextInterval * DAY_MS;
    } else if (rating === 3) {
      // Good
      nextState = 'review';
      nextReps = card.reps + 1;
      const minNext = Math.max(1, Math.round(card.interval * 1.2)) + 1;
      nextInterval = Math.max(minNext, Math.round(card.interval * card.easeFactor));
      nextDue = now + nextInterval * DAY_MS;
    } else if (rating === 4) {
      // Easy
      nextState = 'review';
      nextReps = card.reps + 1;
      const goodInterval = Math.max(1, Math.round(card.interval * card.easeFactor));
      nextInterval = Math.max(goodInterval + 1, Math.round(card.interval * card.easeFactor * 1.3));
      nextEaseFactor = card.easeFactor + 0.15;
      nextDue = now + nextInterval * DAY_MS;
    }
  }

  return {
    ...card,
    state: nextState,
    step: nextStep,
    reps: nextReps,
    lapses: nextLapses,
    interval: nextInterval,
    easeFactor: Number(nextEaseFactor.toFixed(2)),
    due: nextDue,
    lastReviewedAt: now,
  };
}

export function isCardDue(card: Card, now: number = Date.now()): boolean {
  if (card.state === 'new') return true;
  return card.due <= now;
}
