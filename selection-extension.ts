import { EditorState, Extension, StateEffect, StateField } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HideRevealSettings } from './settings';

// Effect to trigger selection expansion
const expandSelectionEffect = StateEffect.define<{from: number, to: number}>();

// State field to track pending selection expansions
const selectionExpansionField = StateField.define<{from: number, to: number} | null>({
  create() {
    return null;
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(expandSelectionEffect)) {
        return effect.value;
      }
    }
    if (tr.selection) {
      return null;
    }
    return value;
  }
});

export function createSelectionExtension(settings: () => HideRevealSettings): Extension {
  return [
    selectionExpansionField,
    EditorView.updateListener.of((update) => {
      if (update.selectionSet && update.transactions.length > 0) {
        const tr = update.transactions[0];
        const selection = update.state.selection.main;
        
        // Only expand on user-initiated selections (not programmatic ones)
        if (tr.isUserEvent('select') && !selection.empty) {
          const hiddenLinkRanges = findOverlappingHiddenLinks(update.view, selection.from, selection.to, settings());
          
          if (hiddenLinkRanges.length > 0) {
            let expandedFrom = selection.from;
            let expandedTo = selection.to;
            
            // Expand to include all overlapping hidden links
            for (const range of hiddenLinkRanges) {
              if (range.from < expandedFrom) expandedFrom = range.from;
              if (range.to > expandedTo) expandedTo = range.to;
            }
            
            // Only expand if the selection would actually change
            if (expandedFrom !== selection.from || expandedTo !== selection.to) {
              update.view.dispatch({
                selection: { anchor: expandedFrom, head: expandedTo },
                effects: expandSelectionEffect.of({ from: expandedFrom, to: expandedTo })
              });
            }
          }
        }
      }
    })
  ];
}

function findOverlappingHiddenLinks(
  view: EditorView, 
  from: number, 
  to: number, 
  currentSettings: HideRevealSettings
): Array<{from: number, to: number}> {
  const doc = view.state.doc;
  const ranges: Array<{from: number, to: number}> = [];
  
  const { startDelimiter, separator, endDelimiter } = currentSettings;
  const pattern = `${escapeRegex(startDelimiter)}(.*?)${escapeRegex(separator)}(.*?)${escapeRegex(endDelimiter)}`;
  const regex = new RegExp(pattern, 'g');
  
  // Check each line that the selection spans
  const fromLine = doc.lineAt(from);
  const toLine = doc.lineAt(to);
  
  for (let lineNum = fromLine.number; lineNum <= toLine.number; lineNum++) {
    const line = doc.line(lineNum);
    let match;
    
    regex.lastIndex = 0;
    while ((match = regex.exec(line.text)) !== null) {
      const matchStart = line.from + match.index;
      const matchEnd = matchStart + match[0].length;
      
      // Check if this hidden link overlaps with the selection
      if (matchStart < to && matchEnd > from) {
        ranges.push({ from: matchStart, to: matchEnd });
      }
    }
  }
  
  return ranges;
}

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
} 