import React, { useState } from 'react';
import { Plus, BarChart3, Settings, Search, ChevronRight, Layers, MoreVertical, Trash2, Edit2, FolderPlus, Upload } from 'lucide-react';
import { Deck, DeckCounts } from '../types';

interface DeckListProps {
  decks: Deck[];
  getCounts: (deckId: string) => DeckCounts;
  onSelectDeck: (deckId: string) => void;
  onCreateDeck: (name: string, description?: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onOpenBrowser: () => void;
  onOpenAddCard: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenImportCsv: (targetDeckId?: string) => void;
}

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  getCounts,
  onSelectDeck,
  onCreateDeck,
  onDeleteDeck,
  onOpenBrowser,
  onOpenAddCard,
  onOpenStats,
  onOpenSettings,
  onOpenImportCsv,
}) => {
  const [showAddDeckModal, setShowAddDeckModal] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [newDeckDesc, setNewDeckDesc] = useState<string>('');
  const [activeDeckMenu, setActiveDeckMenu] = useState<string | null>(null);

  const handleCreateDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    onCreateDeck(newDeckName.trim(), newDeckDesc.trim());
    setNewDeckName('');
    setNewDeckDesc('');
    setShowAddDeckModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-ios-bg dark:bg-ios-darkBg">
      {/* iOS Top Navigation Bar with Frosted Glass */}
      <div className="ios-glass sticky top-0 z-20 border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 pt-safe-top pb-2">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 -ml-2 text-ios-blue hover:opacity-70 rounded-full ios-touch-active"
              title="Settings & Sync"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenStats}
              className="p-2 text-ios-blue hover:opacity-70 rounded-full ios-touch-active"
              title="Statistics"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>

          <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Decks
          </h1>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenImportCsv()}
              className="p-2 text-ios-blue hover:opacity-70 rounded-full ios-touch-active"
              title="Import CSV Cards"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddDeckModal(true)}
              className="p-2 -mr-2 text-ios-blue hover:opacity-70 rounded-full ios-touch-active"
              title="Create Deck"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        
        {/* Anki Header Column Labels - Perfectly aligned over numbers */}
        <div className="flex items-center justify-between px-4 text-[11px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
          <span>Deck Name</span>
          <div className="flex items-center gap-2 justify-end pr-9">
            <span className="text-blue-500 w-8 text-center font-bold">New</span>
            <span className="text-orange-500 w-8 text-center font-bold">Learn</span>
            <span className="text-green-500 w-8 text-center font-bold">Due</span>
          </div>
        </div>

        {/* Grouped Decks Card List */}
        <div className="bg-white dark:bg-ios-darkCard rounded-2xl shadow-sm border border-neutral-200/80 dark:border-neutral-800/80 divide-y divide-neutral-100 dark:divide-neutral-800/80 overflow-hidden">
          {decks.map((deck) => {
            const counts = getCounts(deck.id);

            return (
              <div
                key={deck.id}
                className="relative group transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
              >
                <div
                  onClick={() => onSelectDeck(deck.id)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {deck.name}
                      </span>
                    </div>
                    {deck.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {deck.description}
                      </p>
                    )}
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      {counts.totalCount} cards total
                    </span>
                  </div>

                  {/* Anki Triple Counter Badges - w-8 matching header columns */}
                  <div className="flex items-center gap-2 justify-end flex-shrink-0">
                    <span
                      className={`text-sm font-bold w-8 text-center ${
                        counts.newCount > 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-neutral-300 dark:text-neutral-700'
                      }`}
                    >
                      {counts.newCount}
                    </span>
                    <span
                      className={`text-sm font-bold w-8 text-center ${
                        counts.learnCount > 0
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-neutral-300 dark:text-neutral-700'
                      }`}
                    >
                      {counts.learnCount}
                    </span>
                    <span
                      className={`text-sm font-bold w-8 text-center ${
                        counts.dueCount > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-neutral-300 dark:text-neutral-700'
                      }`}
                    >
                      {counts.dueCount}
                    </span>
                  </div>

                  {/* More button - fixed w-7 ml-2 to guarantee exact header pr-9 alignment */}
                  <div className="w-7 flex items-center justify-end ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDeckMenu(activeDeckMenu === deck.id ? null : deck.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Deck Action Popover */}
                {activeDeckMenu === deck.id && (
                  <div className="absolute right-4 top-12 z-30 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 w-44 animate-fade-in">
                    <button
                      onClick={() => {
                        setActiveDeckMenu(null);
                        onSelectDeck(deck.id);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-ios-blue" />
                      Study Deck
                    </button>
                    <button
                      onClick={() => {
                        setActiveDeckMenu(null);
                        onOpenImportCsv(deck.id);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5 text-ios-green" />
                      Import CSV to Deck
                    </button>
                    <button
                      onClick={() => {
                        setActiveDeckMenu(null);
                        if (confirm(`Delete deck "${deck.name}" and all its cards?`)) {
                          onDeleteDeck(deck.id);
                        }
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-ios-red hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-ios-red" />
                      Delete Deck
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {decks.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-base">No decks found</p>
            <p className="text-xs text-neutral-500 mt-1">Tap the + icon above to create your first deck</p>
          </div>
        )}
      </div>

      {/* iOS Bottom Tab Bar - Flush to bottom without chin */}
      <div className="ios-glass flex-shrink-0 border-t border-neutral-200/80 dark:border-neutral-800/80 px-6 pt-1.5 pb-safe z-20">
        <div className="flex items-center justify-around h-12 max-w-lg mx-auto">
          <button
            onClick={() => {}}
            className="flex flex-col items-center gap-1 text-ios-blue"
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-medium">Decks</span>
          </button>

          <button
            onClick={onOpenBrowser}
            className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 ios-touch-active"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Browse</span>
          </button>

          <button
            onClick={onOpenAddCard}
            className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 ios-touch-active"
          >
            <div className="w-7 h-7 rounded-full bg-ios-blue text-white flex items-center justify-center -mt-1 shadow-md shadow-blue-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Add</span>
          </button>

          <button
            onClick={onOpenStats}
            className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 ios-touch-active"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Stats</span>
          </button>
        </div>
      </div>

      {/* Create Deck Modal */}
      {showAddDeckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-5 border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 text-center">
              New Deck
            </h3>
            <form onSubmit={handleCreateDeckSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Deck Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="e.g. Japanese Kanji N5"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-ios-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="e.g. Daily vocabulary drill"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-ios-blue"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeckModal(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newDeckName.trim()}
                  className="flex-1 py-2 rounded-xl bg-ios-blue text-white font-medium text-xs hover:opacity-90 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
