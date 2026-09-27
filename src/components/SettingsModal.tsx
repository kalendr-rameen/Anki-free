import React, { useRef, useState } from 'react';
import { X, Moon, Sun, Smartphone, Download, Upload, RefreshCw, HelpCircle, Check, Copy } from 'lucide-react';
import { AppSettings, Deck } from '../types';
import { exportBackupJson, importBackupJson, importCardsFromText } from '../lib/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  decks: Deck[];
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  decks,
  onRefreshData,
}) => {
  const [selectedDeckForImport, setSelectedDeckForImport] = useState<string>(decks[0]?.id || '');
  const [copiedIp, setCopiedIp] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textImportRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const localIpUrl = `http://192.168.0.130:5173`;

  const handleCopyIp = () => {
    navigator.clipboard.writeText(localIpUrl);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anki-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupJson(content);
        if (success) {
          setImportStatus('Backup restored successfully!');
          onRefreshData();
        } else {
          setImportStatus('Failed to parse backup JSON.');
        }
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTextCardImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDeckForImport) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const count = importCardsFromText(selectedDeckForImport, text);
        setImportStatus(`Imported ${count} cards successfully!`);
        onRefreshData();
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/50">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
            Preferences & Sync
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {importStatus && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-medium text-ios-blue flex items-center gap-2">
              <Check className="w-4 h-4" />
              {importStatus}
            </div>
          )}

          {/* iPhone & iPad Setup Guide */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-ios-blue" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Install on iPhone & iPad
              </h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              To use Anki as a standalone full-screen iOS app on your device:
            </p>
            <ol className="text-xs text-neutral-600 dark:text-neutral-400 list-decimal list-inside space-y-1">
              <li>Connect your iPhone/iPad to the same Wi-Fi.</li>
              <li>Open Safari and navigate to:</li>
            </ol>
            <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <code className="text-xs font-mono text-ios-blue flex-1 select-all">
                {localIpUrl}
              </code>
              <button
                onClick={handleCopyIp}
                className="px-2.5 py-1 text-xs bg-ios-blue text-white rounded-lg flex items-center gap-1 hover:opacity-90"
              >
                {copiedIp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIp ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              3. In Safari, tap the <strong>Share button (square with arrow)</strong> ➔ scroll down and select <strong>"Add to Home Screen"</strong>.
            </p>
          </div>

          {/* Appearance Settings */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdateSettings({ ...settings, theme: t })}
                  className={`py-2 rounded-xl text-xs font-medium capitalize border transition-all flex items-center justify-center gap-1.5 ${
                    settings.theme === t
                      ? 'border-ios-blue bg-blue-50 dark:bg-blue-950 text-ios-blue'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {t === 'light' && <Sun className="w-3.5 h-3.5" />}
                  {t === 'dark' && <Moon className="w-3.5 h-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Study Preferences */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Study Options
            </label>
            <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-4 border border-neutral-200/60 dark:border-neutral-700/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Auto-Open Apple Pencil Scratchpad
                  </div>
                  <div className="text-xs text-neutral-400">
                    Always open drawing canvas when studying
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.scratchpadAutoShow}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, scratchpadAutoShow: e.target.checked })
                  }
                  className="w-5 h-5 text-ios-blue rounded accent-ios-blue"
                />
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200/40 dark:border-neutral-700/40 pt-3">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Show Study Timer
                  </div>
                  <div className="text-xs text-neutral-400">
                    Display seconds spent thinking on current card
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showTimer}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, showTimer: e.target.checked })
                  }
                  className="w-5 h-5 text-ios-blue rounded accent-ios-blue"
                />
              </div>
            </div>
          </div>

          {/* Backup & Import Data */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Data & Import
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportBackup}
                className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-700"
              >
                <Download className="w-4 h-4 text-ios-blue" />
                Export JSON Backup
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-700"
              >
                <Upload className="w-4 h-4 text-ios-green" />
                Restore Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileImport}
              />
            </div>

            {/* CSV / Tab Import */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-4 border border-neutral-200/60 dark:border-neutral-700/40 space-y-3">
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Import CSV / TSV Cards
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedDeckForImport}
                  onChange={(e) => setSelectedDeckForImport(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs"
                >
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => textImportRef.current?.click()}
                  className="px-3 py-1.5 bg-ios-blue text-white text-xs font-medium rounded-xl hover:opacity-90 whitespace-nowrap"
                >
                  Choose File (.csv/.txt)
                </button>
                <input
                  ref={textImportRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleTextCardImport}
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Format: <code>Front [Tab or Comma] Back</code> on each line.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-ios-blue text-white font-medium text-sm hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
