import { keymap } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Notice } from 'obsidian';
import { HideRevealSettings } from './settings';

export function createKeyboardExtension(settings: () => HideRevealSettings): Extension {
  return keymap.of([
    {
      key: "Alt-Enter", // Option+Enter on Mac, Alt+Enter on Windows/Linux
      run: (view: EditorView): boolean => {
        const currentSettings = settings();
        const cursor = view.state.selection.main.head;
        const hiddenLink = getHiddenLinkAtCursor(view, cursor, currentSettings);
        
        if (hiddenLink) {
          // Copy payload to clipboard
          navigator.clipboard.writeText(hiddenLink.payload).then(() => {
            new Notice(currentSettings.notificationText);
          }).catch(error => {
            new Notice('Failed to copy to clipboard');
            console.error('Clipboard write failed:', error);
          });
          
          return true; // Event handled
        }
        
        return false; // Let Obsidian handle the keypress
      }
    }
  ]);
}

interface HiddenLink {
  payload: string;
  from: number;
  to: number;
}

function getHiddenLinkAtCursor(
  view: EditorView, 
  cursorPos: number, 
  currentSettings: HideRevealSettings
): HiddenLink | null {
  const doc = view.state.doc;
  const line = doc.lineAt(cursorPos);
  
  const { startDelimiter, separator, endDelimiter } = currentSettings;
  const pattern = `${escapeRegex(startDelimiter)}(.*?)${escapeRegex(separator)}(.*?)${escapeRegex(endDelimiter)}`;
  const regex = new RegExp(pattern, 'g');
  
  let match;
  while ((match = regex.exec(line.text)) !== null) {
    const matchStart = line.from + match.index;
    const matchEnd = matchStart + match[0].length;
    
    // Check if cursor is anywhere within the hidden hyperlink syntax
    if (cursorPos >= matchStart && cursorPos <= matchEnd) {
      return {
        payload: match[2].trim(),
        from: matchStart,
        to: matchEnd
      };
    }
  }
  
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
} 