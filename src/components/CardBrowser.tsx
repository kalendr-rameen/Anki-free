import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit3, ArrowLeft, Tag, Layers } from 'lucide-react';
import { Card, Deck } from '../types';

interface CardBrowserProps {
  cards: Card[];
  decks: Deck[];
  onBack: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onAddNewCard: () => void;
}

export const CardBrowser: React.FC<CardBrowserProps> = ({
  cards,
  decks,
  onBack,
  onEditCard,
  onDeleteCard,
  onAddNewCard,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'new' | 'learning' | 'review'>('all');

  const deckMap = useMemo(() => {
    return new Map(decks.map(d => [d.id, d.name]));
  }, [decks]);

  const categoryCounts = useMemo(() => {
    const relevantCards = selectedDeckId === 'all'
      ? cards
      : cards.filter(c => c.deckId === selectedDeckId);

    let newCount = 0;
    let learningCount = 0;
    let reviewCount = 0;

    for (const card of relevantCards) {
      if (card.state === 'new') newCount++;
      else if (card.state === 'learning' || card.state === 'relearning') learningCount++;
      else if (card.state === 'review') reviewCount++;
    }

    return {
      all: relevantCards.length,
      new: newCount,
      learning: learningCount,
      review: reviewCount,
    };
  }, [cards, selectedDeckId]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (selectedDeckId !== 'all' && card.deckId !== selectedDeckId) {
        return false;
      }
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'new' && card.state !== 'new') return false;
        if (selectedCategory === 'learning' && card.state !== 'learning' && card.state !== 'relearning') return false;
        if (selectedCategory === 'review' && card.state !== 'review') return false;
      }
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const inFront = card.front.toLowerCase().includes(query);
      const inBack = card.back.toLowerCase().includes(query);
      const inTags = card.tags.some(t => t.toLowerCase().includes(query));

      return inFront || inBack || inTags;
    });
  }, [cards, selectedDeckId, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-ios-bg dark:bg-ios-darkBg">
      {/* iOS Top Navigation Bar */}
      <div className="ios-glass sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-800 px-4 pt-safe-top pb-3">
        <div className="flex items-center justify-between h-12">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-ios-blue hover:opacity-70 text-base font-normal -ml-1 ios-touch-active"
          >
            <ArrowLeft className="w-5 h-5" />
            Decks
          </button>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
            Card Browser ({filteredCards.length})
          </span>
          <button
            onClick={onAddNewCard}
            className="p-2 text-ios-blue hover:opacity-70 rounded-full ios-touch-active"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Deck Filter Controls */}
        <div className="mt-2 space-y-2">
          {/* iOS Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards, tags, or answers..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-200/70 dark:bg-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-ios-blue"
            />
          </div>

          {/* Deck Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedDeckId('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDeckId === 'all'
                  ? 'bg-ios-blue text-white'
                  : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              All Decks ({cards.length})
            </button>
            {decks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => setSelectedDeckId(deck.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDeckId === deck.id
                    ? 'bg-ios-blue text-white'
                    : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {deck.name}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                  : 'bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              All ({categoryCounts.all})
            </button>
            <button
              onClick={() => setSelectedCategory('new')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === 'new'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              New ({categoryCounts.new})
            </button>
            <button
              onClick={() => setSelectedCategory('learning')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === 'learning'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              Learning ({categoryCounts.learning})
            </button>
            <button
              onClick={() => setSelectedCategory('review')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === 'review'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Review ({categoryCounts.review})
            </button>
          </div>
        </div>
      </div>

      {/* Card List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe-bottom">
        {filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
            <Layers className="w-12 h-12 mb-3 stroke-[1.2]" />
            <p className="font-medium text-base">No cards found</p>
            <p className="text-xs text-neutral-500 mt-1">
              Try adjusting your search query or add a new card
            </p>
          </div>
        ) : (
          filteredCards.map((card) => {
            const deckName = deckMap.get(card.deckId) || 'Unknown Deck';
            return (
              <div
                key={card.id}
                className="bg-white dark:bg-ios-darkCard rounded-2xl p-4 shadow-sm border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-2 hover:border-ios-blue transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                        {deckName}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          card.state === 'new'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                            : card.state === 'learning' || card.state === 'relearning'
                            ? 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400'
                            : 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {card.state}
                      </span>
                      {card.interval > 0 && (
                        <span className="text-[10px] text-neutral-400">
                          Int: {card.interval}d (EF: {card.easeFactor})
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2">
                      {card.front}
                    </div>
                    {card.back && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {card.back}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCard(card)}
                      className="p-2 text-neutral-500 hover:text-ios-blue rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 ios-touch-active"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this card?')) {
                          onDeleteCard(card.id);
                        }
                      }}
                      className="p-2 text-neutral-500 hover:text-ios-red rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 ios-touch-active"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {card.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-neutral-100 dark:border-neutral-800/50">
                    <Tag className="w-3 h-3 text-neutral-400" />
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
