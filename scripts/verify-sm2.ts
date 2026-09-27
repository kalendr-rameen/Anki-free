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
