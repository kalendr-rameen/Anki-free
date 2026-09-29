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
    if (mins < 60) {
      return `<${mins}m`;
    }
    const hours = Math.max(1, Math.round(mins / 60));
    return `<${hours}h`;
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
 * Calculates difficulty / struggle penalty points:
 * Each "Again" adds 1.0, each "Hard" adds 0.5.
 */
export function getStrugglePoints(card: Card): number {
  return (card.againCount ?? 0) * 1.0 + (card.hardCount ?? 0) * 0.5;
}

/**
 * Calculates human-readable interval preview strings for Again, Hard, Good, and Easy buttons
 */
export function calculateNextIntervals(card: Card): IntervalPreview {
  const isLearning = card.state === 'new' || card.state === 'learning' || card.state === 'relearning';
  const struggle = getStrugglePoints(card);

  if (isLearning) {
    const step = card.step;
    // Again: repeats step 0 (1m)
    const againMs = LEARNING_STEPS_MINUTES[0] * MINUTE_MS;
    // Hard: in learning, step 0 -> 6m or mid-step
    const hardMs = step === 0 ? 6 * MINUTE_MS : LEARNING_STEPS_MINUTES[0] * MINUTE_MS;

    // Good: advances step or graduates (scaled down if struggled with Again/Hard)
    let goodMs: number;
    if (step + 1 < LEARNING_STEPS_MINUTES.length) {
      const stepMins = struggle >= 2 ? 5 : LEARNING_STEPS_MINUTES[step + 1];
      goodMs = stepMins * MINUTE_MS;
    } else {
      // Graduation: scale 1d down based on struggle
      if (struggle === 0) {
        goodMs = GRADUATING_INTERVAL_DAYS * DAY_MS; // 1d
      } else if (struggle <= 1) {
        goodMs = 18 * 60 * MINUTE_MS; // 18h
      } else if (struggle <= 2) {
        goodMs = 12 * 60 * MINUTE_MS; // 12h
      } else {
        goodMs = 6 * 60 * MINUTE_MS;  // 6h (<6h)
      }
    }

    // Easy: directly graduates (also scaled if struggled earlier)
    const easyDays = struggle === 0 ? EASY_INTERVAL_DAYS : Math.max(1, Math.round(EASY_INTERVAL_DAYS / (1 + struggle * 0.5)));
    const easyMs = easyDays * DAY_MS;

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
  // Good: interval * easeFactor (scaled by current struggle)
  const factor = struggle > 0 ? ef / (1 + struggle * 0.2) : ef;
  const goodDays = Math.max(hardDays + 1, Math.round(curIntervalDays * factor));
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
  let nextAgainCount = card.againCount ?? 0;
  let nextHardCount = card.hardCount ?? 0;

  const struggle = getStrugglePoints(card);
  const isLearning = card.state === 'new' || card.state === 'learning' || card.state === 'relearning';

  if (isLearning) {
    if (rating === 1) {
      // Again
      nextState = 'learning';
      nextStep = 0;
      nextDue = now + LEARNING_STEPS_MINUTES[0] * MINUTE_MS;
      nextLapses += 1;
      nextAgainCount += 1;
      nextEaseFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor - 0.15);
    } else if (rating === 2) {
      // Hard
      nextState = 'learning';
      const hardMins = card.step === 0 ? 6 : LEARNING_STEPS_MINUTES[0];
      nextDue = now + hardMins * MINUTE_MS;
      nextHardCount += 1;
      nextEaseFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor - 0.08);
    } else if (rating === 3) {
      // Good
      if (card.step + 1 < LEARNING_STEPS_MINUTES.length) {
        nextState = 'learning';
        nextStep = card.step + 1;
        const stepMins = struggle >= 2 ? 5 : LEARNING_STEPS_MINUTES[nextStep];
        nextDue = now + stepMins * MINUTE_MS;
      } else {
        // Graduate to review
        nextState = 'review';
        nextStep = 0;
        nextReps = 1;
        // Adaptive graduation interval based on Again/Hard presses
        if (struggle === 0) {
          nextInterval = GRADUATING_INTERVAL_DAYS; // 1 day
          nextDue = now + GRADUATING_INTERVAL_DAYS * DAY_MS;
        } else if (struggle <= 1) {
          nextInterval = 0.75; // 18 hours
          nextDue = now + 18 * 60 * MINUTE_MS;
        } else if (struggle <= 2) {
          nextInterval = 0.50; // 12 hours
          nextDue = now + 12 * 60 * MINUTE_MS;
        } else {
          nextInterval = 0.25; // 6 hours
          nextDue = now + 6 * 60 * MINUTE_MS;
        }
        // Reset struggle counter on successful graduation
        nextAgainCount = 0;
        nextHardCount = 0;
      }
    } else if (rating === 4) {
      // Easy: Instant graduation with bonus
      nextState = 'review';
      nextStep = 0;
      nextReps = 1;
      const easyDays = struggle === 0 ? EASY_INTERVAL_DAYS : Math.max(1, Math.round(EASY_INTERVAL_DAYS / (1 + struggle * 0.5)));
      nextInterval = easyDays;
      nextEaseFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor + 0.15);
      nextDue = now + easyDays * DAY_MS;
      nextAgainCount = 0;
      nextHardCount = 0;
    }
  } else {
    // Review state
    if (rating === 1) {
      // Again (lapse)
      nextState = 'relearning';
      nextStep = 0;
      nextReps = 0;
      nextLapses = card.lapses + 1;
      nextAgainCount += 1;
      nextInterval = 1;
      nextEaseFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor - 0.20);
      nextDue = now + 10 * MINUTE_MS;
    } else if (rating === 2) {
      // Hard
      nextState = 'review';
      nextReps = card.reps + 1;
      nextHardCount += 1;
      nextInterval = Math.max(1, Math.round(card.interval * 1.2));
      nextEaseFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor - 0.15);
      nextDue = now + nextInterval * DAY_MS;
    } else if (rating === 3) {
      // Good
      nextState = 'review';
      nextReps = card.reps + 1;
      const minNext = Math.max(1, Math.round(card.interval * 1.2)) + 1;
      const factor = struggle > 0 ? card.easeFactor / (1 + struggle * 0.2) : card.easeFactor;
      nextInterval = Math.max(minNext, Math.round(card.interval * factor));
      nextDue = now + nextInterval * DAY_MS;
      nextAgainCount = 0;
      nextHardCount = 0;
    } else if (rating === 4) {
      // Easy
      nextState = 'review';
      nextReps = card.reps + 1;
      const goodInterval = Math.max(1, Math.round(card.interval * card.easeFactor));
      nextInterval = Math.max(goodInterval + 1, Math.round(card.interval * card.easeFactor * 1.3));
      nextEaseFactor = card.easeFactor + 0.15;
      nextDue = now + nextInterval * DAY_MS;
      nextAgainCount = 0;
      nextHardCount = 0;
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
    againCount: nextAgainCount,
    hardCount: nextHardCount,
  };
}

export function isCardDue(card: Card, now: number = Date.now()): boolean {
  if (card.state === 'new') return true;
  return card.due <= now;
}
