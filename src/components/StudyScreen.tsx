import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Edit3, Star, RotateCcw, PenTool, CheckCircle, Flame, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardRating, Deck, DeckCounts } from '../types';
import { calculateNextIntervals } from '../lib/sm2';
import { renderClozeFront, renderClozeBack } from '../lib/cloze';
import { Scratchpad } from './Scratchpad';

interface StudyScreenProps {
  deck: Deck;
  queue: Card[];
  counts: DeckCounts;
  isDark: boolean;
  autoShowScratchpad: boolean;
  showTimer: boolean;
  onAnswerCard: (card: Card, rating: CardRating) => void;
  onUndo: () => void;
  canUndo: boolean;
  onBack: () => void;
  onEditCurrentCard: (card: Card) => void;
  onToggleStar: (cardId: string) => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({
  deck,
  queue,
  counts,
  isDark,
  autoShowScratchpad,
  showTimer,
  onAnswerCard,
  onUndo,
  canUndo,
  onBack,
  onEditCurrentCard,
  onToggleStar,
}) => {
  const [isAnswerShown, setIsAnswerShown] = useState<boolean>(false);
  const [showScratchpad, setShowScratchpad] = useState<boolean>(autoShowScratchpad);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  const currentCard = queue[0] ?? null;

  // Study timer per card
  useEffect(() => {
    setTimerSeconds(0);
    setIsAnswerShown(false);

    if (!currentCard) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentCard?.id]);

  // Trigger celebration confetti when deck queue finishes
  useEffect(() => {
    if (!currentCard && queue.length === 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [currentCard, queue.length]);

  const sessionCounts = useMemo(() => {
    let newCount = 0;
    let learnCount = 0;
    let dueCount = 0;

    for (const card of queue) {
      if (card.state === 'new') {
        newCount++;
      } else if (card.state === 'learning' || card.state === 'relearning') {
        learnCount++;
      } else if (card.state === 'review') {
        dueCount++;
      }
    }

    return {
      newCount,
      learnCount,
      dueCount,
    };
  }, [queue]);

  const intervals = useMemo(() => {
    if (!currentCard) return null;
    return calculateNextIntervals(currentCard);
  }, [currentCard]);

  // Keyboard navigation for desktop & iPad with Magic Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isAnswerShown) {
          setIsAnswerShown(true);
        } else if (currentCard) {
          // Default answer to 'Good'
          onAnswerCard(currentCard, 3);
        }
      } else if (isAnswerShown && currentCard) {
        if (e.key === '1') onAnswerCard(currentCard, 1);
        if (e.key === '2') onAnswerCard(currentCard, 2);
        if (e.key === '3') onAnswerCard(currentCard, 3);
        if (e.key === '4') onAnswerCard(currentCard, 4);
      }

      if ((e.key === 'z' || e.key === 'Z') && canUndo) {
        e.preventDefault();
        onUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerShown, currentCard, canUndo, onAnswerCard, onUndo]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Render question text with cloze support
  const renderedFront = useMemo(() => {
    if (!currentCard) return '';
    if (currentCard.type === 'cloze') {
      return renderClozeFront(currentCard.front);
    }
    return currentCard.front;
  }, [currentCard]);

  // Render answer text with cloze support
  const renderedBack = useMemo(() => {
    if (!currentCard) return '';
    if (currentCard.type === 'cloze') {
      return renderClozeBack(currentCard.front);
    }
    return currentCard.back;
  }, [currentCard]);

  return (
    <div className="flex flex-col h-full bg-ios-bg dark:bg-ios-darkBg select-none">
      {/* iOS Study Top Navigation Bar */}
      <div className="ios-glass sticky top-0 z-20 border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 pt-safe-top pb-2">
        <div className="flex items-center justify-between h-12">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-ios-blue hover:opacity-70 text-base font-normal -ml-1 ios-touch-active"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Decks</span>
          </button>

          {/* Center Queue Counter Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-neutral-200/60 dark:bg-neutral-800/60 px-2.5 py-1 rounded-full text-xs font-semibold">
              <span className="text-blue-600 dark:text-blue-400" title="New cards remaining">{sessionCounts.newCount}</span>
              <span className="text-neutral-400">·</span>
              <span className="text-orange-600 dark:text-orange-400" title="Learning cards remaining">{sessionCounts.learnCount}</span>
              <span className="text-neutral-400">·</span>
              <span className="text-green-600 dark:text-green-400" title="Review cards remaining">{sessionCounts.dueCount}</span>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1">
            {/* Apple Pencil / Scratchpad */}
            <button
              onClick={() => setShowScratchpad(!showScratchpad)}
              className={`p-2 rounded-full ios-touch-active transition-colors ${
                showScratchpad
                  ? 'text-ios-blue bg-blue-100 dark:bg-blue-950'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title="Apple Pencil Scratchpad"
            >
              <PenTool className="w-4 h-4" />
            </button>

            {/* Star card */}
            {currentCard && (
              <button
                onClick={() => onToggleStar(currentCard.id)}
                className={`p-2 rounded-full ios-touch-active transition-colors ${
                  currentCard.starred
                    ? 'text-ios-yellow'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                }`}
                title="Star card"
              >
                <Star className={`w-4 h-4 ${currentCard.starred ? 'fill-ios-yellow' : ''}`} />
              </button>
            )}

            {/* Undo */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-full disabled:opacity-30 ios-touch-active"
              title="Undo last review"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Edit Card */}
            {currentCard && (
              <button
                onClick={() => onEditCurrentCard(currentCard)}
                className="p-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-full ios-touch-active"
                title="Edit Card"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Flashcard Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Apple Pencil Scratchpad Overlay */}
        <Scratchpad
          isOpen={showScratchpad}
          onClose={() => setShowScratchpad(false)}
          isDark={isDark}
        />

        {currentCard ? (
          <div
            onClick={() => {
              if (!isAnswerShown) setIsAnswerShown(true);
            }}
            className="w-full max-w-xl flex-1 max-h-[calc(100dvh-160px)] bg-white dark:bg-ios-darkCard rounded-3xl p-5 sm:p-7 shadow-sm border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col justify-between overflow-y-auto cursor-pointer transition-all"
          >
            {/* Card Header Info */}
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {deck.name}
              </span>
              {showTimer && (
                <span className="font-mono text-[11px] text-neutral-400">
                  {formatTimer(timerSeconds)}
                </span>
              )}
            </div>

            {/* Card Content Area */}
            <div className="flex-1 flex flex-col justify-center my-auto py-4 text-center">
              {/* Question / Front */}
              <div
                className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed selectable-text"
                dangerouslySetInnerHTML={{ __html: renderedFront }}
              />

              {/* Revealed Answer (Back) */}
              {isAnswerShown && (
                <div className="mt-8 pt-6 border-t border-neutral-200/60 dark:border-neutral-700/60 animate-fade-in text-center">
                  <div
                    className="text-lg sm:text-xl text-neutral-800 dark:text-neutral-200 font-medium leading-relaxed selectable-text"
                    dangerouslySetInnerHTML={{
                      __html:
                        currentCard.type === 'cloze'
                          ? renderedBack
                          : renderedBack || '<span class="text-neutral-400 italic">No notes</span>',
                    }}
                  />
                  {currentCard.type === 'cloze' && currentCard.back && (
                    <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 italic selectable-text">
                      {currentCard.back}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tap prompt if answer not shown */}
            {!isAnswerShown && (
              <div className="text-center text-xs text-neutral-400 pt-4 flex items-center justify-center gap-1.5 opacity-60">
                <Eye className="w-3.5 h-3.5" />
                Tap anywhere or press Space to show answer
              </div>
            )}
          </div>
        ) : (
          /* Finished Deck Celebration State */
          <div className="text-center max-w-sm p-8 bg-white dark:bg-ios-darkCard rounded-3xl shadow-sm border border-neutral-200/80 dark:border-neutral-800/80 space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/60 rounded-full flex items-center justify-center mx-auto text-ios-green">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Congratulations!
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              You have finished all due cards in <strong>{deck.name}</strong> for now!
            </p>
            <div className="pt-2">
              <button
                onClick={onBack}
                className="w-full py-3 rounded-2xl bg-ios-blue text-white font-medium text-sm hover:opacity-90 ios-touch-active"
              >
                Back to Decks
              </button>
            </div>
          </div>
        )}
      </div>

      {/* iOS Bottom Action Bar - Docked flush to bottom without chin */}
      {currentCard && (
        <div className="ios-glass flex-shrink-0 border-t border-neutral-200/80 dark:border-neutral-800/80 px-4 pt-2.5 pb-safe z-20">
          <div className="max-w-xl mx-auto">
            {!isAnswerShown ? (
              /* Show Answer Button */
              <button
                onClick={() => setIsAnswerShown(true)}
                className="w-full py-3.5 rounded-2xl bg-ios-blue text-white font-semibold text-base shadow-md shadow-blue-500/20 active:scale-[0.98] transition-transform"
              >
                Show Answer
              </button>
            ) : (
              /* 4 Anki Rating Buttons with predicted intervals */
              <div className="grid grid-cols-4 gap-2">
                {/* Again Button */}
                <button
                  onClick={() => onAnswerCard(currentCard, 1)}
                  className="flex flex-col items-center justify-center py-2 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-ios-red active:scale-95 transition-transform"
                >
                  <span className="text-[11px] font-mono font-medium opacity-80">
                    {intervals?.again}
                  </span>
                  <span className="text-xs font-bold">Again</span>
                </button>

                {/* Hard Button */}
                <button
                  onClick={() => onAnswerCard(currentCard, 2)}
                  className="flex flex-col items-center justify-center py-2 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 text-ios-orange active:scale-95 transition-transform"
                >
                  <span className="text-[11px] font-mono font-medium opacity-80">
                    {intervals?.hard}
                  </span>
                  <span className="text-xs font-bold">Hard</span>
                </button>

                {/* Good Button */}
                <button
                  onClick={() => onAnswerCard(currentCard, 3)}
                  className="flex flex-col items-center justify-center py-2 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 text-ios-green active:scale-95 transition-transform"
                >
                  <span className="text-[11px] font-mono font-medium opacity-80">
                    {intervals?.good}
                  </span>
                  <span className="text-xs font-bold">Good</span>
                </button>

                {/* Easy Button */}
                <button
                  onClick={() => onAnswerCard(currentCard, 4)}
                  className="flex flex-col items-center justify-center py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-ios-blue active:scale-95 transition-transform"
                >
                  <span className="text-[11px] font-mono font-medium opacity-80">
                    {intervals?.easy}
                  </span>
                  <span className="text-xs font-bold">Easy</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
