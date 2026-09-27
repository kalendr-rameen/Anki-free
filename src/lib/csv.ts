export interface ParsedCsvCard {
  front: string;
  back: string;
  tags: string[];
  type: 'basic' | 'cloze';
}

/**
 * Robust CSV/TSV parser supporting quotes, commas within quotes, multi-line values,
 * tabs, semicolons, and header row auto-detection.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  // Determine likely delimiter from first line
  const firstLine = text.split(/\r?\n/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Ignore carriage return
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push last field & row if remaining
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Converts raw parsed rows into Anki-ready cards, intelligently handling
 * 2-column (Front, Back), 3-column (Front, Back, Tags), and
 * 4-column (Word, Meaning, Example Sentence, Mnemonic Rule) formats.
 */
export function parseCardsFromCsv(content: string): ParsedCsvCard[] {
  const rawRows = parseCsv(content);
  if (rawRows.length === 0) return [];

  // Check if first row is a header
  let startIndex = 0;
  const firstRow = rawRows[0].map(c => c.toLowerCase().trim().replace(/^[\uFEFF]/, ''));
  const isHeader =
    firstRow.some(col => ['front', 'word', 'question', 'term', 'prompt', 'q'].includes(col)) &&
    firstRow.some(col => ['back', 'meaning', 'general meaning', 'answer', 'definition', 'notes', 'a'].includes(col));

  if (isHeader) {
    startIndex = 1;
  }

  const cards: ParsedCsvCard[] = [];

  for (let i = startIndex; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row.length < 2) continue;

    const front = row[0].trim();
    if (!front) continue;

    let back = '';
    let tags: string[] = [];

    if (row.length === 2) {
      back = row[1].trim();
    } else if (row.length === 3) {
      // Check if 3rd col is short tags or long content
      const col3 = row[2].trim();
      if (col3.length < 35 && !col3.includes('.')) {
        back = row[1].trim();
        tags = col3.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean);
      } else {
        back = `${row[1].trim()}\n\n<div class="italic text-neutral-500 mt-2">"${col3}"</div>`;
      }
    } else if (row.length >= 4) {
      // 4-column format: Word, General Meaning, Example Sentence, Mnemonic Rule
      const meaning = row[1].trim();
      const example = row[2].trim();
      const mnemonic = row[3].trim();

      const parts: string[] = [];
      if (meaning) {
        parts.push(`<div class="font-semibold text-ios-blue text-base mb-2">${meaning}</div>`);
      }
      if (example) {
        parts.push(`<div class="italic text-sm text-neutral-600 dark:text-neutral-300 bg-neutral-100/70 dark:bg-neutral-800/70 p-3 rounded-xl mb-2">"${example}"</div>`);
      }
      if (mnemonic) {
        parts.push(`<div class="text-xs text-neutral-600 dark:text-neutral-400 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200/60 dark:border-yellow-900/40 p-2.5 rounded-xl">💡 <strong>Mnemonic:</strong> ${mnemonic}</div>`);
      }

      back = parts.join('');
      tags = ['english', 'vocabulary'];
    }

    const isCloze = front.includes('{{c');

    cards.push({
      front,
      back,
      tags,
      type: isCloze ? 'cloze' : 'basic',
    });
  }

  return cards;
}
