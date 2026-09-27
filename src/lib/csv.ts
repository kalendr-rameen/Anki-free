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
 * Converts raw parsed rows into Anki-ready cards, ignoring headers
 */
export function parseCardsFromCsv(content: string): ParsedCsvCard[] {
  const rawRows = parseCsv(content);
  if (rawRows.length === 0) return [];

  // Check if first row is a header
  let startIndex = 0;
  const firstRow = rawRows[0].map(c => c.toLowerCase());
  const isHeader =
    firstRow.some(col => ['front', 'question', 'term', 'prompt', 'q'].includes(col)) &&
    firstRow.some(col => ['back', 'answer', 'definition', 'notes', 'a'].includes(col));

  if (isHeader) {
    startIndex = 1;
  }

  const cards: ParsedCsvCard[] = [];

  for (let i = startIndex; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row.length < 2) continue;

    const front = row[0].trim();
    const back = row[1].trim();

    if (!front) continue;

    const tags = row[2]
      ? row[2]
          .split(/[,;\s]+/)
          .map(t => t.trim())
          .filter(Boolean)
      : [];

    const isCloze = front.includes('{{c') || back.includes('{{c');

    cards.push({
      front,
      back,
      tags,
      type: isCloze ? 'cloze' : 'basic',
    });
  }

  return cards;
}
