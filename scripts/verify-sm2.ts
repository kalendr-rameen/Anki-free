import { calculateNextIntervals, scheduleCard, INITIAL_EASE_FACTOR, MIN_EASE_FACTOR } from '../src/lib/sm2';
import { renderClozeFront, renderClozeBack, hasCloze } from '../src/lib/cloze';
import { Card } from '../src/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ Passed: ${msg}`);
  }
}

console.log('--- Testing SM-2 Spaced Repetition Engine ---');

const testCard: Card = {
  id: 'test-1',
  deckId: 'deck-1',
  front: 'Question',
  back: 'Answer',
  type: 'basic',
  tags: [],
  state: 'new',
  step: 0,
  reps: 0,
  lapses: 0,
  interval: 0,
  easeFactor: INITIAL_EASE_FACTOR,
  due: Date.now(),
  createdAt: Date.now(),
};

// 1. Check interval predictions for New card
const initialIntervals = calculateNextIntervals(testCard);
assert(initialIntervals.again === '<1m', `New card Again interval should be <1m, got ${initialIntervals.again}`);
assert(initialIntervals.good === '<10m', `New card Good interval should be <10m, got ${initialIntervals.good}`);
assert(initialIntervals.easy === '4d', `New card Easy interval should be 4d, got ${initialIntervals.easy}`);

// 2. Test Step Progression (Good rating on step 0)
const step1Card = scheduleCard(testCard, 3);
assert(step1Card.state === 'learning', 'State should be learning');
assert(step1Card.step === 1, 'Step should be 1');

// 3. Test Graduation (Good rating on step 1)
const graduatedCard = scheduleCard(step1Card, 3);
assert(graduatedCard.state === 'review', 'State should graduate to review');
assert(graduatedCard.interval === 1, 'Interval should be 1 day on graduation');
assert(graduatedCard.reps === 1, 'Reps should be 1');

// 4. Test Review Success (Good rating on Review card)
const reviewedCard = scheduleCard(graduatedCard, 3);
assert(reviewedCard.state === 'review', 'State should remain review');
assert(reviewedCard.interval >= 2, `Interval should increase to at least 2 days, got ${reviewedCard.interval}`);
assert(reviewedCard.reps === 2, 'Reps should increment to 2');

// 5. Test Lapse (Again rating on Review card)
const lapsedCard = scheduleCard(reviewedCard, 1);
assert(lapsedCard.state === 'relearning', 'State should be relearning');
assert(lapsedCard.lapses === 1, 'Lapses count should increment to 1');
assert(lapsedCard.easeFactor < reviewedCard.easeFactor, 'Ease factor should decrease on lapse');

// 6. Test Ease Factor minimum boundary
let lowEaseCard: Card = { ...reviewedCard, easeFactor: 1.35 };
lowEaseCard = scheduleCard(lowEaseCard, 1);
assert(lowEaseCard.easeFactor === MIN_EASE_FACTOR, `Ease factor should not drop below ${MIN_EASE_FACTOR}, got ${lowEaseCard.easeFactor}`);

// 7. Test Adaptive Interval Reduction (User struggles with "Again" 3 times)
console.log('\n--- Testing Adaptive Again/Hard Penalties ---');
let strugglingCard: Card = {
  ...testCard,
  id: 'struggle-1',
  easeFactor: INITIAL_EASE_FACTOR,
  step: 0,
  againCount: 0,
};

// Press Again 3 times
strugglingCard = scheduleCard(strugglingCard, 1);
strugglingCard = scheduleCard(strugglingCard, 1);
strugglingCard = scheduleCard(strugglingCard, 1);

assert(strugglingCard.againCount === 3, `Again count should be 3, got ${strugglingCard.againCount}`);
assert(strugglingCard.lapses === 3, `Lapses should be 3, got ${strugglingCard.lapses}`);
assert(strugglingCard.easeFactor === 2.05, `Ease factor should drop from 2.50 to 2.05, got ${strugglingCard.easeFactor}`);

// Advance step 0 -> step 1 with Good
strugglingCard = scheduleCard(strugglingCard, 3);
assert(strugglingCard.step === 1, 'Should advance to step 1');

// Check preview on step 1: Good should preview <6h instead of 1d because of struggle
const previewAfterStruggle = calculateNextIntervals(strugglingCard);
assert(previewAfterStruggle.good === '<6h', `Preview for Good after 3 Agains should be <6h, got ${previewAfterStruggle.good}`);

// Now graduate with Good
const graduatedStrugglingCard = scheduleCard(strugglingCard, 3);
assert(graduatedStrugglingCard.state === 'review', 'Should graduate to review');
assert(graduatedStrugglingCard.interval === 0.25, `Graduated interval should be 0.25 days (6h), got ${graduatedStrugglingCard.interval}`);
assert(graduatedStrugglingCard.interval < graduatedCard.interval, 'Interval after 3 Agains should be significantly less than clean graduation (0.25d < 1d)');
assert(graduatedStrugglingCard.againCount === 0, 'Struggle counters reset on graduation');

console.log('\n--- Testing Cloze Deletion Engine ---');
const clozeText = 'The capital of Australia is {{c1::Canberra::capital}} and largest city is {{c2::Sydney}}.';
assert(hasCloze(clozeText), 'hasCloze should return true');

const front = renderClozeFront(clozeText, 1);
assert(front.includes('[capital]'), 'Front should show [capital] hint');
assert(front.includes('Sydney'), 'Other cloze (c2) should remain revealed');

const back = renderClozeBack(clozeText, 1);
assert(back.includes('[Canberra]'), 'Back should reveal [Canberra]');

console.log('\n--- Testing CSV Parser Engine ---');
import { parseCardsFromCsv } from '../src/lib/csv';

const sampleCsv = `Front,Back,Tags
"What is the capital of France?","Paris","geography, europe"
"Question with, comma","Answer with, comma","test"
"Escaped ""quotes"" inside","Double quote answer","quotes"
`;

const parsed = parseCardsFromCsv(sampleCsv);
assert(parsed.length === 3, `Should parse 3 cards, got ${parsed.length}`);
assert(parsed[0].front === 'What is the capital of France?', 'Header skipped and first row correct');
assert(parsed[0].back === 'Paris', 'Answer parsed correctly');
assert(parsed[1].front === 'Question with, comma', 'Quoted commas handled');
assert(parsed[2].front === 'Escaped "quotes" inside', 'Escaped quotes handled');

// Test semicolon delimited CSV
const semiCsv = `Question;Answer\nGerman "Guten Tag";Good day\n"Auf Wiedersehen";Goodbye`;
const parsedSemi = parseCardsFromCsv(semiCsv);
assert(parsedSemi.length === 2, `Semicolon CSV should parse 2 cards, got ${parsedSemi.length}`);
assert(parsedSemi[0].front.includes('German'), 'Semicolon front parsed correctly');
assert(parsedSemi[1].front === 'Auf Wiedersehen', 'Quoted semicolon front unquoted correctly');

console.log('\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!');
