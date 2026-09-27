import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, Plus, AlertCircle, Eye } from 'lucide-react';
import { Deck } from '../types';
import { parseCardsFromCsv, ParsedCsvCard } from '../lib/csv';
import { importCardsFromText } from '../lib/storage';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  currentDeckId?: string;
  onCreateDeck: (name: string) => void;
  onImportSuccess: (count: number) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  decks,
  currentDeckId,
  onCreateDeck,
  onImportSuccess,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    currentDeckId || decks[0]?.id || ''
  );
  const [createNewDeckMode, setCreateNewDeckMode] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [fileRawText, setFileRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedCards, setParsedCards] = useState<ParsedCsvCard[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setFileName(file.name);

    // Default new deck name from filename (without extension)
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setNewDeckName(baseName.charAt(0).toUpperCase() + baseName.slice(1));

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setErrorMsg('The selected file is empty.');
        return;
      }
      setFileRawText(text);
      const cards = parseCardsFromCsv(text);
      if (cards.length === 0) {
        setErrorMsg('No valid card rows detected. Please check CSV formatting.');
      } else {
        setParsedCards(cards);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!fileRawText || parsedCards.length === 0) return;

    let targetDeckId = selectedDeckId;

    if (createNewDeckMode) {
      if (!newDeckName.trim()) {
        setErrorMsg('Please enter a name for the new deck.');
        return;
      }
      // Create deck and select it
      const newDeckId = 'deck-' + Math.random().toString(36).substring(2, 9);
      onCreateDeck(newDeckName.trim());
      targetDeckId = newDeckId;
    }

    const count = importCardsFromText(targetDeckId, fileRawText);
    onImportSuccess(count);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFileRawText('');
    setFileName('');
    setParsedCards([]);
    setErrorMsg(null);
    setCreateNewDeckMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-ios-blue" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
              Import CSV / TSV Cards
            </span>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl text-xs font-medium text-ios-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* File Picker Area */}
          {!fileRawText ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-ios-blue dark:hover:border-ios-blue rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-800/30 text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-ios-blue flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                  Select a CSV or TXT file
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Supports comma, tab, or semicolon separated columns
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-ios-blue text-white text-xs font-medium">
                Choose File
              </span>
            </div>
          ) : (
            /* File Loaded summary */
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-ios-blue" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">
                    {fileName}
                  </p>
                  <p className="text-xs text-ios-green font-medium">
                    {parsedCards.length} cards found
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-ios-red hover:underline"
              >
                Change
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Destination Deck Selection */}
          {parsedCards.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                Destination Deck
              </label>

              <div className="flex items-center gap-3 text-xs mb-2">
                <button
                  type="button"
                  onClick={() => setCreateNewDeckMode(false)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    !createNewDeckMode
                      ? 'bg-ios-blue text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  Existing Deck
                </button>
                <button
                  type="button"
                  onClick={() => setCreateNewDeckMode(true)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1 ${
                    createNewDeckMode
                      ? 'bg-ios-blue text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Deck
                </button>
              </div>

              {!createNewDeckMode ? (
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100"
                >
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="New Deck Name"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100"
                />
              )}
            </div>
          )}

          {/* Preview of first 3 cards */}
          {parsedCards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5" />
                Cards Preview (First 3)
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {parsedCards.slice(0, 3).map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/40 text-xs space-y-1"
                  >
                    <div>
                      <strong className="text-neutral-700 dark:text-neutral-300">Q:</strong>{' '}
                      <span className="text-neutral-900 dark:text-neutral-100">{c.front}</span>
                    </div>
                    <div>
                      <strong className="text-neutral-700 dark:text-neutral-300">A:</strong>{' '}
                      <span className="text-neutral-600 dark:text-neutral-400">{c.back}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Guide */}
          <div className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-50/60 dark:bg-neutral-800/30 p-3 rounded-xl border border-neutral-200/40 dark:border-neutral-800">
            <strong>Format supported:</strong> <code>Front, Back</code> or <code>Question, Answer, Tags</code>.
            Automatic detection skips header rows. Cloze tags like <code>{'{{c1::word}}'}</code> are preserved.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedCards.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-ios-blue text-white font-medium text-sm hover:opacity-90 disabled:opacity-40"
          >
            Import {parsedCards.length > 0 ? `${parsedCards.length} Cards` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
