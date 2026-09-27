/**
 * Anki Cloze Deletion parser
 * Supports: {{c1::hidden text}} and {{c1::hidden text::hint}}
 */

const CLOZE_REGEX = /\{\{c(\d+)::([^}:]+)(?:::([^}]+))?\}\}/g;

export function hasCloze(text: string): boolean {
  return /\{\{c\d+::.+?\}\}/.test(text);
}

/**
 * Renders the question side (Front) with cloze replacements ([...] or [hint])
 */
export function renderClozeFront(text: string, targetIndex: number = 1): string {
  return text.replace(CLOZE_REGEX, (_match, indexStr, _content, hint) => {
    const idx = parseInt(indexStr, 10);
    if (idx === targetIndex) {
      return hint ? `[${hint}]` : `[...]`;
    }
    // Other cloze numbers remain visible
    return _content;
  });
}

/**
 * Renders the answer side (Back) revealing the cloze in bold colored brackets
 */
export function renderClozeBack(text: string, targetIndex: number = 1): string {
  return text.replace(CLOZE_REGEX, (_match, indexStr, content, _hint) => {
    const idx = parseInt(indexStr, 10);
    if (idx === targetIndex) {
      return `<strong class="text-ios-blue bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20">[${content}]</strong>`;
    }
    return content;
  });
}
