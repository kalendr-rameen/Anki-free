import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Code, Sparkles } from 'lucide-react';
import { Card, Deck } from '../types';
import { INITIAL_EASE_FACTOR } from '../lib/sm2';

interface CardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Card) => void;
  cardToEdit?: Card | null;
  decks: Deck[];
  currentDeckId: string;
}

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cardToEdit,
  decks,
  currentDeckId,
}) => {
  const [deckId, setDeckId] = useState<string>(currentDeckId || decks[0]?.id || '');
  const [type, setType] = useState<'basic' | 'cloze'>('basic');
  const [front, setFront] = useState<string>('');
  const [back, setBack] = useState<string>('');
  const [tagsStr, setTagsStr] = useState<string>('');
  const frontRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (cardToEdit) {
      setDeckId(cardToEdit.deckId);
      setType(cardToEdit.type);
      setFront(cardToEdit.front);
      setBack(cardToEdit.back);
      setTagsStr(cardToEdit.tags.join(', '));
    } else {
      setDeckId(currentDeckId || decks[0]?.id || '');
      setType('basic');
      setFront('');
      setBack('');
      setTagsStr('');
    }
  }, [cardToEdit, isOpen, currentDeckId, decks]);

  if (!isOpen) return null;

  const handleInsertCloze = () => {
    const textarea = frontRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = front.substring(start, end) || 'text';

    // Count existing clozes to determine next index
    const clozeMatches = front.match(/\{\{c(\d+)::/g) || [];
    const nextIdx = clozeMatches.length + 1;

    const replacement = `{{c${nextIdx}::${selectedText}}}`;
    const newFront = front.substring(0, start) + replacement + front.substring(end);
    setFront(newFront);
    setType('cloze');

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + 6 + nextIdx.toString().length,
        start + 6 + nextIdx.toString().length + selectedText.length
      );
    }, 50);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!front.trim()) return;

    const tags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const isCloze = front.includes('{{c') || type === 'cloze';

    const card: Card = cardToEdit
      ? {
          ...cardToEdit,
          deckId,
          front: front.trim(),
          back: back.trim(),
          type: isCloze ? 'cloze' : 'basic',
          tags,
        }
      : {
          id: 'card-' + Math.random().toString(36).substring(2, 9),
          deckId,
          front: front.trim(),
          back: back.trim(),
          type: isCloze ? 'cloze' : 'basic',
          tags,
          state: 'new',
          step: 0,
          reps: 0,
          lapses: 0,
          interval: 0,
          easeFactor: INITIAL_EASE_FACTOR,
          due: Date.now(),
          createdAt: Date.now(),
        };

    onSave(card);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-neutral-200 dark:border-neutral-800">
        
        {/* iOS Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/50">
          <button
            onClick={onClose}
            type="button"
            className="text-ios-blue hover:opacity-70 text-base font-normal"
          >
            Cancel
          </button>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
            {cardToEdit ? 'Edit Card' : 'Add Card'}
          </span>
          <button
            onClick={() => handleSubmit()}
            disabled={!front.trim()}
            type="button"
            className="text-ios-blue font-semibold text-base disabled:opacity-40"
          >
            Done
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Deck Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Deck
            </label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Front / Question Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Front (Question)
              </label>
              <button
                type="button"
                onClick={handleInsertCloze}
                className="flex items-center gap-1 text-xs text-ios-blue font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md hover:opacity-80"
              >
                <Sparkles className="w-3 h-3" />
                [..] Cloze
              </button>
            </div>
            <textarea
              ref={frontRef}
              rows={4}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="e.g. The capital of Australia is {{c1::Canberra}}"
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue resize-none"
            />
          </div>

          {/* Back / Answer Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Back (Answer / Notes)
            </label>
            <textarea
              rows={4}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="e.g. Canberra was founded in 1913 as a purpose-built capital."
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="geography, capitals, exam"
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue"
            />
          </div>

        </form>
      </div>
    </div>
  );
};
