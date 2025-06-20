import { Notice } from 'obsidian';
import { 
  ViewPlugin, 
  PluginValue, 
  EditorView, 
  Decoration, 
  DecorationSet, 
  ViewUpdate,
  WidgetType
} from '@codemirror/view';
import { RangeSetBuilder, Extension } from '@codemirror/state';
import { HideRevealSettings } from './settings';

export function createHideRevealExtension(settings: () => HideRevealSettings): Extension {
  return [
    ViewPlugin.fromClass(
      class implements PluginValue {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
          if (update.docChanged || update.selectionSet) {
            this.decorations = this.buildDecorations(update.view);
          }
        }

        buildDecorations(view: EditorView): DecorationSet {
          const builder = new RangeSetBuilder<Decoration>();
          const doc = view.state.doc;
          const selection = view.state.selection.main;
          
          // Get current settings
          const currentSettings = settings();
          const { startDelimiter, separator, endDelimiter } = currentSettings;
          const pattern = `${this.escapeRegex(startDelimiter)}(.*?)${this.escapeRegex(separator)}(.*?)${this.escapeRegex(endDelimiter)}`;
          const regex = new RegExp(pattern, 'g');

          // Iterate through each line
          for (let i = 1; i <= doc.lines; i++) {
            const line = doc.line(i);
            const text = line.text;
            let match;

            regex.lastIndex = 0;
            while ((match = regex.exec(text)) !== null) {
              const matchStart = line.from + match.index;
              const matchEnd = matchStart + match[0].length;
              
              // Check if cursor or selection overlaps with this match
              const cursorInMatch = selection.from >= matchStart && selection.from <= matchEnd;
              const selectionOverlaps = (selection.from <= matchEnd && selection.to >= matchStart);
              
              if (!cursorInMatch && !selectionOverlaps) {
                // Hide the full syntax and show only display text
                const displayText = match[2].trim();
                const payload = match[1].trim();
                
                const decoration = Decoration.replace({
                  widget: new HideRevealWidget(displayText, payload, currentSettings),
                });
                
                builder.add(matchStart, matchEnd, decoration);
              } else {
                // Show raw syntax but style it like a hyperlink
                const payload = match[1].trim();
                const markDecoration = Decoration.mark({
                  class: 'hide-reveal-link-expanded',
                  attributes: {
                    'data-payload': payload
                  }
                });
                
                builder.add(matchStart, matchEnd, markDecoration);
              }
            }
          }

          return builder.finish();
        }

        escapeRegex(s: string): string {
          return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    ),
    EditorView.domEventHandlers({
      click(event, view) {
        const target = event.target as HTMLElement;
        // Handle clicks on expanded syntax
        if (target.classList.contains('hide-reveal-link-expanded') || 
            target.closest('.hide-reveal-link-expanded')) {
          const element = target.classList.contains('hide-reveal-link-expanded') ? 
                         target : target.closest('.hide-reveal-link-expanded') as HTMLElement;
          const payload = element.getAttribute('data-payload');
          
          if (payload) {
            navigator.clipboard.writeText(payload).then(() => {
              new Notice(settings().notificationText);
            }).catch(error => {
              new Notice('Failed to copy to clipboard');
              console.error('Clipboard write failed:', error);
            });
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      mouseenter(event, view) {
        const target = event.target as HTMLElement;
        // Add tooltip for expanded syntax
        if (target.classList.contains('hide-reveal-link-expanded')) {
          const payload = target.getAttribute('data-payload');
          if (payload && !target.querySelector('.hide-reveal-tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.className = 'hide-reveal-tooltip show';
            tooltip.textContent = payload;
            target.appendChild(tooltip);
          }
        }
        return false;
      },
      mouseleave(event, view) {
        const target = event.target as HTMLElement;
        // Remove tooltip for expanded syntax
        if (target.classList.contains('hide-reveal-link-expanded')) {
          const tooltip = target.querySelector('.hide-reveal-tooltip');
          if (tooltip) {
            tooltip.remove();
          }
        }
        return false;
      },
      mousedown(event, view) {
        // Handle selection expansion for hidden hyperlinks
        if (event.detail === 2) { // Double-click
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (pos !== null) {
            const hiddenLinkRange = findHiddenLinkAt(view, pos, settings());
            if (hiddenLinkRange) {
              view.dispatch({
                selection: { anchor: hiddenLinkRange.from, head: hiddenLinkRange.to }
              });
              event.preventDefault();
              return true;
            }
          }
        }
        return false;
      }
    })
  ];
}

function findHiddenLinkAt(view: EditorView, pos: number, currentSettings: HideRevealSettings): { from: number, to: number } | null {
  const doc = view.state.doc;
  const line = doc.lineAt(pos);
  const { startDelimiter, separator, endDelimiter } = currentSettings;
  const pattern = `${escapeRegex(startDelimiter)}(.*?)${escapeRegex(separator)}(.*?)${escapeRegex(endDelimiter)}`;
  const regex = new RegExp(pattern, 'g');
  
  let match;
  while ((match = regex.exec(line.text)) !== null) {
    const matchStart = line.from + match.index;
    const matchEnd = matchStart + match[0].length;
    
    if (pos >= matchStart && pos <= matchEnd) {
      return { from: matchStart, to: matchEnd };
    }
  }
  
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

class HideRevealWidget extends WidgetType {
  constructor(
    readonly displayText: string,
    readonly payload: string,
    readonly settings: HideRevealSettings
  ) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const span = document.createElement('span');
    span.textContent = this.displayText;
    span.className = 'hide-reveal-link hide-reveal-link-editor';
    span.style.cursor = 'pointer';
    
    // Create custom tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'hide-reveal-tooltip';
    tooltip.textContent = this.payload;
    span.appendChild(tooltip);

    // Hover events for custom tooltip
    span.addEventListener('mouseenter', () => {
      tooltip.classList.add('show');
    });

    span.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });
    
    span.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Copy to clipboard first
      try {
        await navigator.clipboard.writeText(this.payload);
        new Notice(this.settings.notificationText);
      } catch (error) {
        new Notice('Failed to copy to clipboard');
        console.error('Clipboard write failed:', error);
      }
      
      // Focus the editor but don't change cursor position
      view.focus();
    });

    return span;
  }
}

 