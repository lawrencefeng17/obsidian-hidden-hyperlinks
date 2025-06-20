import { App, Plugin, MarkdownPostProcessorContext, Notice } from 'obsidian';
import { HideRevealSettings, HideRevealSettingTab, DEFAULT_SETTINGS } from './settings';
import { createHideRevealExtension } from './editor-extension';
import { createSelectionExtension } from './selection-extension';

export default class HideRevealPlugin extends Plugin {
  settings: HideRevealSettings;
  private editorExtension: any;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HideRevealSettingTab(this.app, this));

    // Register markdown post-processor for reading mode
    this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      this.postProcess(el);
    });

    // Register CodeMirror extension for editing mode
    this.editorExtension = createHideRevealExtension(() => this.settings);
    this.registerEditorExtension(this.editorExtension);
    
    // Register selection extension for expanding selections
    this.registerEditorExtension(createSelectionExtension(() => this.settings));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  postProcess(container: HTMLElement) {
    const { startDelimiter, separator, endDelimiter } = this.settings;
    const pattern = `${escapeRegex(startDelimiter)}(.*?)${escapeRegex(separator)}(.*?)${escapeRegex(endDelimiter)}`;
    const regex = new RegExp(pattern, 'g');

    this.walkTextNodes(container, (node: Text) => {
      const text = node.textContent!;
      let lastIndex = 0;
      const frag = document.createDocumentFragment();
      let match: RegExpExecArray | null;
      let hasMatches = false;

      regex.lastIndex = 0; // Reset regex state
      while ((match = regex.exec(text))) {
        hasMatches = true;
        // Append text leading up to match
        if (match.index > lastIndex) {
          frag.append(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        // Create interactive span
        const span = document.createElement('span');
        span.textContent = match[2].trim();
        span.className = 'hide-reveal-link';
        span.dataset.payload = match[1].trim();
        span.style.cursor = 'pointer';
        
        // Create custom tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'hide-reveal-tooltip';
        tooltip.textContent = match[1].trim();
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
          try {
            await navigator.clipboard.writeText(span.dataset.payload!);
            new Notice(this.settings.notificationText);
          } catch (error) {
            new Notice('Failed to copy to clipboard');
            console.error('Clipboard write failed:', error);
          }
        });

        frag.append(span);
        lastIndex = match.index + match[0].length;
      }

      // Append trailing text
      if (lastIndex < text.length) {
        frag.append(document.createTextNode(text.slice(lastIndex)));
      }

      if (hasMatches) {
        node.parentNode?.replaceChild(frag, node);
      }
    });
  }

  private walkTextNodes(element: HTMLElement, callback: (node: Text) => void) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    // Process nodes in reverse order to avoid DOM mutation issues
    textNodes.reverse().forEach(callback);
  }
}

// Utility to escape regex special chars
function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
} 