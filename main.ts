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

    // Register markdown post-processor for reading mode with high priority
    this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      this.postProcess(el);
    }, -100); // Negative number = higher priority (runs earlier)

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

    // First, try to process the entire text content as a whole
    // This helps catch patterns that might be split across elements
    const fullText = container.textContent || '';
    if (regex.test(fullText)) {
      // If we find matches in the full text, we need to process more carefully
      this.processWithFullText(container, regex);
    } else {
      // Fallback to the original method for simple cases
      this.walkTextNodes(container, (node: Text) => {
        this.processTextNode(node, regex);
      });
    }
  }

  private processWithFullText(container: HTMLElement, regex: RegExp) {
    // Get all text content while preserving structure
    const innerHTML = container.innerHTML;
    const fullText = container.textContent || '';
    
    regex.lastIndex = 0;
    const matches = [...fullText.matchAll(regex)];
    
    if (matches.length === 0) return;
    
    // Process from the end to avoid position shifting
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const matchStart = match.index!;
      const matchEnd = matchStart + match[0].length;
      
      // Find the actual DOM nodes that contain this text range
      const range = this.findTextRangeInContainer(container, matchStart, matchEnd);
      if (range) {
        this.replaceRangeWithHiddenLink(range, match[1].trim(), match[2].trim());
      }
    }
  }

  private findTextRangeInContainer(container: HTMLElement, start: number, end: number): Range | null {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentPos = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startOffset = 0;
    let endOffset = 0;
    
    let node;
    while (node = walker.nextNode() as Text) {
      const nodeLength = node.textContent?.length || 0;
      const nodeStart = currentPos;
      const nodeEnd = currentPos + nodeLength;
      
      // Check if this node contains the start position
      if (!startNode && start >= nodeStart && start <= nodeEnd) {
        startNode = node;
        startOffset = start - nodeStart;
      }
      
      // Check if this node contains the end position
      if (end >= nodeStart && end <= nodeEnd) {
        endNode = node;
        endOffset = end - nodeStart;
        break;
      }
      
      currentPos = nodeEnd;
    }
    
    if (startNode && endNode) {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      return range;
    }
    
    return null;
  }

  private replaceRangeWithHiddenLink(range: Range, payload: string, displayText: string) {
    // Create the replacement span
    const span = document.createElement('span');
    span.textContent = displayText;
    span.className = 'hide-reveal-link';
    span.dataset.payload = payload;
    span.style.cursor = 'pointer';
    
    // Create custom tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'hide-reveal-tooltip';
    tooltip.textContent = payload;
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
        await navigator.clipboard.writeText(payload);
        new Notice(this.settings.notificationText);
      } catch (error) {
        new Notice('Failed to copy to clipboard');
        console.error('Clipboard write failed:', error);
      }
    });

    // Replace the range with our span
    try {
      range.deleteContents();
      range.insertNode(span);
    } catch (error) {
      console.error('Failed to replace range:', error);
    }
  }

  private processTextNode(node: Text, regex: RegExp) {
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