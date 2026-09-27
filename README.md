# Anki Mobile Free (iOS & iPadOS)

A sleek, lightweight, offline-first, and 100% free flashcard application tailored specifically for **iPhone and iPad (iOS / iPadOS)**, reproducing the beloved interface and scheduling mechanics of AnkiMobile.

---

## 📱 Features

- **True SM-2 Spaced Repetition Engine**:
  - Implements SuperMemo SM-2 algorithm: learning steps (1m, 10m), graduating interval (1d), easy interval (4d), and dynamic Ease Factor adjustment.
  - Live interval predictions on all 4 rating buttons: **Again** (`<1m`), **Hard** (`<6m`), **Good** (`<10m` or `1d`), and **Easy** (`4d`).
- **AnkiMobile iOS Native Interface**:
  - Iconic triple-count badge counters for each deck: **Blue** (New), **Orange/Red** (Learning), and **Green** (Due).
  - iOS frosted glass navigation bars, segmented controls, grouped card styling, and safe area handling for iPhone Dynamic Island and notches.
- **Standalone iOS PWA**:
  - Installable directly to your iPhone or iPad Home Screen via Safari (`Share ➔ Add to Home Screen`).
  - Launches in full-screen standalone mode with no browser URL bar or bottom buttons.
  - Works 100% offline using persistent local storage and Service Worker caching.
- **Apple Pencil / Touch Whiteboard Scratchpad**:
  - Scribble kanji, math formulas, or answers with your finger or Apple Pencil directly over the flashcard before flipping!
  - Color palette, stroke width, undo, and clear controls.
- **Cloze Deletions**:
  - Full support for Anki's `{{c1::answer}}` and `{{c1::answer::hint}}` syntax.
- **Card Browser & Instant Search**:
  - Search, filter by deck, edit, or delete any card in your collection.
- **Undo Last Review**:
  - Misclicked a button? Tap the Undo button (`Cmd+Z` / `Z`) to revert the previous card review and restore its exact previous schedule.
- **Backup & Import/Export**:
  - Export full collection backup as JSON.
  - Import CSV / TSV text files (`Front [Tab or Comma] Back`).
- **Preloaded Starter Decks**:
  - *Spanish - Everyday Essentials*
  - *World Capitals & Geography*
  - *Medical & Anatomy Fundamentals*

---

## 🚀 Quick Start

### 1. Run the Development Server
```bash
npm run dev
```

The server binds to `0.0.0.0:5173`, allowing any device on your Wi-Fi network to access it.

### 2. Open on iPhone / iPad
1. Make sure your iPhone or iPad is connected to the same Wi-Fi network as this Mac.
2. Open **Safari** on your iPhone/iPad and navigate to:
   ```
   http://192.168.0.130:5173
   ```
3. Tap the **Share icon** (square with an up arrow) at the bottom/top of Safari.
4. Scroll down and tap **"Add to Home Screen"**.
5. Tap **Add**. An "Anki" icon will appear on your Home Screen!
6. Launch it from your Home Screen to experience it as a native, full-screen iOS app.

---

## 🧪 Testing

To run the automated SM-2 and Cloze unit test suite:
```bash
npm test
```

To create a production build:
```bash
npm run build
```

---

## ⌨️ iPad Magic Keyboard & Desktop Shortcuts

- **Space** or **Enter**: Show Answer (when prompt is visible) / Rate **Good** (when answer is revealed)
- **1**: Rate **Again**
- **2**: Rate **Hard**
- **3**: Rate **Good**
- **4**: Rate **Easy**
- **Z**: **Undo** last review
