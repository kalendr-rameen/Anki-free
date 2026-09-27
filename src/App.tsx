import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardRating, Deck, DeckCounts, ReviewLog, AppSettings } from './types';
import {
  getDecks,
  saveDecks,
  getCards,
  saveCards,
  getDeckCounts,
  getStudyQueue,
  logReview,
  getReviewLogs,
  undoLastReview,
  getSettings,
  saveSettings,
} from './lib/storage';
import { scheduleCard } from './lib/sm2';
import { DeckList } from './components/DeckList';
import { StudyScreen } from './components/StudyScreen';
import { CardBrowser } from './components/CardBrowser';
import { CardEditorModal } from './components/CardEditorModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { CsvImportModal } from './components/CsvImportModal';

type ActiveView = 'decks' | 'study' | 'browser';

export const App: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  
  const [activeView, setActiveView] = useState<ActiveView>('decks');
  const [currentDeckId, setCurrentDeckId] = useState<string>('');
  const [studyQueue, setStudyQueue] = useState<Card[]>([]);
  
  // Modals state
  const [isCardEditorOpen, setIsCardEditorOpen] = useState<boolean>(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState<boolean>(false);
  const [csvTargetDeckId, setCsvTargetDeckId] = useState<string>('');

  // Load initial data
  const refreshAllData = useCallback(() => {
    const loadedDecks = getDecks();
    const loadedCards = getCards();
    const loadedLogs = getReviewLogs();
    setDecks(loadedDecks);
    setCards(loadedCards);
    setReviewLogs(loadedLogs);
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // System Dark Mode sync
  const [systemDark, setSystemDark] = useState<boolean>(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const isDark = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return systemDark;
  }, [settings.theme, systemDark]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Deck counts helper
  const getCounts = useCallback(
    (deckId: string): DeckCounts => {
      return getDeckCounts(deckId);
    },
    [cards]
  );

  // Start study session for a deck
  const handleSelectDeck = (deckId: string) => {
    setCurrentDeckId(deckId);
    const queue = getStudyQueue(deckId);
    setStudyQueue(queue);
    setActiveView('study');
  };

  // Card rating in study session
  const handleAnswerCard = (card: Card, rating: CardRating) => {
    const previousSnapshot = { ...card };
    const updatedCard = scheduleCard(card, rating);

    // Persist card update
    const allCards = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    setCards(allCards);
    saveCards(allCards);

    // Log review for Undo & Stats
    const log: ReviewLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      cardId: card.id,
      deckId: card.deckId,
      rating,
      timestamp: Date.now(),
      previousCardSnapshot: previousSnapshot,
    };
    logReview(log);
    setReviewLogs((prev) => [...prev, log]);

    // Update study queue
    if (updatedCard.state === 'learning' || updatedCard.state === 'relearning') {
      // Re-queue card at end of learning queue if not graduated
      setStudyQueue((prev) => [...prev.slice(1), updatedCard]);
    } else {
      // Graduated or next interval scheduled for tomorrow/future
      setStudyQueue((prev) => prev.slice(1));
    }
  };

  // Undo last review
  const handleUndo = () => {
    const revertedCard = undoLastReview();
    if (revertedCard) {
      refreshAllData();
      if (currentDeckId) {
        // Put reverted card back to front of study queue
        setStudyQueue((prev) => [revertedCard, ...prev.filter(c => c.id !== revertedCard.id)]);
      }
    }
  };

  const handleToggleStar = (cardId: string) => {
    const updated = cards.map((c) =>
      c.id === cardId ? { ...c, starred: !c.starred } : c
    );
    setCards(updated);
    saveCards(updated);
    if (studyQueue.length > 0 && studyQueue[0].id === cardId) {
      setStudyQueue((prev) => [{ ...prev[0], starred: !prev[0].starred }, ...prev.slice(1)]);
    }
  };

  // Deck CRUD
  const handleCreateDeck = (name: string, description?: string) => {
    const newDeck: Deck = {
      id: 'deck-' + Math.random().toString(36).substring(2, 9),
      name,
      description,
      newLimit: 20,
      reviewLimit: 100,
      createdAt: Date.now(),
    };
    const updated = [...decks, newDeck];
    setDecks(updated);
    saveDecks(updated);
  };

  const handleDeleteDeck = (deckId: string) => {
    const updatedDecks = decks.filter((d) => d.id !== deckId);
    const updatedCards = cards.filter((c) => c.deckId !== deckId);
    setDecks(updatedDecks);
    setCards(updatedCards);
    saveDecks(updatedDecks);
    saveCards(updatedCards);
    if (currentDeckId === deckId) {
      setActiveView('decks');
      setCurrentDeckId('');
    }
  };

  // Card CRUD
  const handleSaveCard = (card: Card) => {
    const existingIndex = cards.findIndex((c) => c.id === card.id);
    let updated: Card[];
    if (existingIndex !== -1) {
      updated = [...cards];
      updated[existingIndex] = card;
    } else {
      updated = [...cards, card];
    }
    setCards(updated);
    saveCards(updated);

    // Refresh queue if studying current deck
    if (activeView === 'study' && currentDeckId === card.deckId) {
      setStudyQueue(getStudyQueue(currentDeckId));
    }
  };

  const handleDeleteCard = (cardId: string) => {
    const updated = cards.filter((c) => c.id !== cardId);
    setCards(updated);
    saveCards(updated);
    setStudyQueue((prev) => prev.filter((c) => c.id !== cardId));
  };

  const currentDeck = decks.find((d) => d.id === currentDeckId) ?? decks[0];

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-ios-bg dark:bg-ios-darkBg">
      {/* Active Screen Router */}
      {activeView === 'decks' && (
        <DeckList
          decks={decks}
          getCounts={getCounts}
          onSelectDeck={handleSelectDeck}
          onCreateDeck={handleCreateDeck}
          onDeleteDeck={handleDeleteDeck}
          onOpenBrowser={() => setActiveView('browser')}
          onOpenAddCard={() => {
            setEditingCard(null);
            setIsCardEditorOpen(true);
          }}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenImportCsv={(targetDeckId) => {
            setCsvTargetDeckId(targetDeckId || '');
            setIsCsvImportOpen(true);
          }}
        />
      )}

      {activeView === 'study' && currentDeck && (
        <StudyScreen
          deck={currentDeck}
          queue={studyQueue}
          counts={getCounts(currentDeck.id)}
          isDark={isDark}
          autoShowScratchpad={settings.scratchpadAutoShow}
          showTimer={settings.showTimer}
          onAnswerCard={handleAnswerCard}
          onUndo={handleUndo}
          canUndo={reviewLogs.length > 0}
          onBack={() => {
            setActiveView('decks');
            refreshAllData();
          }}
          onEditCurrentCard={(card) => {
            setEditingCard(card);
            setIsCardEditorOpen(true);
          }}
          onToggleStar={handleToggleStar}
        />
      )}

      {activeView === 'browser' && (
        <CardBrowser
          cards={cards}
          decks={decks}
          onBack={() => setActiveView('decks')}
          onEditCard={(card) => {
            setEditingCard(card);
            setIsCardEditorOpen(true);
          }}
          onDeleteCard={handleDeleteCard}
          onAddNewCard={() => {
            setEditingCard(null);
            setIsCardEditorOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <CardEditorModal
        isOpen={isCardEditorOpen}
        onClose={() => {
          setIsCardEditorOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveCard}
        cardToEdit={editingCard}
        decks={decks}
        currentDeckId={currentDeckId || decks[0]?.id || ''}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        cards={cards}
        decks={decks}
        reviewLogs={reviewLogs}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        decks={decks}
        onRefreshData={refreshAllData}
      />

      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        decks={decks}
        currentDeckId={csvTargetDeckId || currentDeckId}
        onCreateDeck={handleCreateDeck}
        onImportSuccess={(_count) => {
          refreshAllData();
        }}
      />
    </div>
  );
};
