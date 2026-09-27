import React, { useMemo } from 'react';
import { X, BarChart3, Clock, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import { Card, Deck, ReviewLog } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  decks: Deck[];
  reviewLogs: ReviewLog[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  cards,
  decks,
  reviewLogs,
}) => {
  const stats = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayLogs = reviewLogs.filter(l => l.timestamp >= todayStart);

    const goodOrEasy = todayLogs.filter(l => l.rating === 3 || l.rating === 4).length;
    const retentionRate = todayLogs.length > 0 ? Math.round((goodOrEasy / todayLogs.length) * 100) : 100;

    let newCount = 0;
    let learningCount = 0;
    let youngCount = 0;
    let matureCount = 0;

    for (const card of cards) {
      if (card.state === 'new') {
        newCount++;
      } else if (card.state === 'learning' || card.state === 'relearning') {
        learningCount++;
      } else if (card.state === 'review') {
        if (card.interval >= 21) {
          matureCount++;
        } else {
          youngCount++;
        }
      }
    }

    return {
      todayCount: todayLogs.length,
      retentionRate,
      newCount,
      learningCount,
      youngCount,
      matureCount,
      totalCards: cards.length,
      totalDecks: decks.length,
    };
  }, [cards, decks, reviewLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-ios-blue" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
              Study Statistics
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Today Overview Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/40">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4 text-ios-green" />
                Studied Today
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.todayCount}
              </div>
              <div className="text-xs text-neutral-400 mt-1">reviews logged</div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/40">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                <TrendingUp className="w-4 h-4 text-ios-blue" />
                Retention
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.retentionRate}%
              </div>
              <div className="text-xs text-neutral-400 mt-1">success rate today</div>
            </div>
          </div>

          {/* Card Maturity Breakdown */}
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              <span>Card Maturity Distribution</span>
              <span>{stats.totalCards} cards</span>
            </div>

            {/* Visual Bar */}
            <div className="h-3 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex">
              <div
                style={{ width: `${(stats.newCount / (stats.totalCards || 1)) * 100}%` }}
                className="bg-ios-blue"
                title={`New: ${stats.newCount}`}
              />
              <div
                style={{ width: `${(stats.learningCount / (stats.totalCards || 1)) * 100}%` }}
                className="bg-ios-orange"
                title={`Learning: ${stats.learningCount}`}
              />
              <div
                style={{ width: `${(stats.youngCount / (stats.totalCards || 1)) * 100}%` }}
                className="bg-green-400"
                title={`Young: ${stats.youngCount}`}
              />
              <div
                style={{ width: `${(stats.matureCount / (stats.totalCards || 1)) * 100}%` }}
                className="bg-ios-green"
                title={`Mature: ${stats.matureCount}`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ios-blue" />
                <span className="text-neutral-600 dark:text-neutral-400">New ({stats.newCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ios-orange" />
                <span className="text-neutral-600 dark:text-neutral-400">Learning ({stats.learningCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-neutral-600 dark:text-neutral-400">Young &lt;21d ({stats.youngCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ios-green" />
                <span className="text-neutral-600 dark:text-neutral-400">Mature &ge;21d ({stats.matureCount})</span>
              </div>
            </div>
          </div>

          {/* Collection Overview */}
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span>Total Decks: <strong className="text-neutral-800 dark:text-neutral-200">{stats.totalDecks}</strong></span>
            <span>Total Flashcards: <strong className="text-neutral-800 dark:text-neutral-200">{stats.totalCards}</strong></span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-ios-blue text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
