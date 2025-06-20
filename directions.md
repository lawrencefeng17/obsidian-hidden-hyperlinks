# Hide & Reveal Plugin for Obsidian

A guide to implementing an Obsidian plugin that hides arbitrary text behind display text and copies the hidden payload to the clipboard when clicked.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Plugin Structure](#plugin-structure)
5. [Markdown Post-Processor](#markdown-post-processor)
6. [Configurable Options](#configurable-options)
7. [Styling](#styling)
8. [Packaging & Publishing](#packaging--publishing)
9. [Future Enhancements](#future-enhancements)
10. [References](#references)

---

## Overview

This plugin enables authors to hide a secret payload behind arbitrary display text in Obsidian notes. When the user clicks the display text, the hidden payload is copied to the clipboard, and an unobtrusive notification is shown.

Example syntax (default):

```markdown
::secret payload|Show this text::
```

* **Payload**: `secret payload` (copied on click)
* **Display**: `Show this text`

---

## Prerequisites

* **Obsidian** v1.0+ with Community Plugins enabled
* **Node.js** v16+ and npm
* **TypeScript** knowledge
* Familiarity with Obsidian Plugin API (see Obsidian sample plugin)

---

## Project Setup

1. **Scaffold**

   ```bash
   npx create-obsidian-plugin my-hide-reveal-plugin
   cd my-hide-reveal-plugin
   npm install
   ```

2. **Plugin Manifest** (`manifest.json`)

   ```json
   {
     "id": "hide-reveal-plugin",
     "name": "Hide & Reveal",
     "version": "0.1.0",
     "minAppVersion": "1.0.0",
     "description": "Hide text behind display text and copy on click.",
     "author": "Your Name",
     "authorUrl": "https://your.site",
     "isDesktopOnly": false
   }
   ```

3. **Directory Structure**

   ```text
   my-hide-reveal-plugin/
   ├── manifest.json
   ├── main.ts
   ├── styles.css
   ├── settings.ts
   └── README.md
   ```

---

## Plugin Structure

* **main.ts**: Plugin entry point; registers the Markdown post-processor and settings tab.
* **settings.ts**: Defines a SettingsTab for configurable delimiters and notification options.
* **styles.css**: Contains CSS classes for styling the clickable text.
* **README.md**: User documentation for installation and usage.

---

## Markdown Post-Processor

Implement the core logic in `main.ts`:

```ts
import { App, Plugin, MarkdownPostProcessorContext, Notice } from 'obsidian';
import { HideRevealSettings, HideRevealSettingTab, DEFAULT_SETTINGS } from './settings';

export default class HideRevealPlugin extends Plugin {
  settings: HideRevealSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HideRevealSettingTab(this.app, this));

    this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      this.postProcess(el);
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  postProcess(container: HTMLElement) {
    const { startDelimiter, separator, endDelimiter } = this.settings;
    const pattern = `${escapeRegex(startDelimiter)}([^${escapeRegex(separator)}]+)${escapeRegex(separator)}([^${escapeRegex(endDelimiter)}]+)${escapeRegex(endDelimiter)}`;
    const regex = new RegExp(pattern, 'g');

    container.querySelectorAll('*').forEach((el) => {
      el.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent!;
          let lastIndex = 0;
          const frag = document.createDocumentFragment();
          let match: RegExpExecArray | null;

          while ((match = regex.exec(text))) {
            // Append text leading up to match
            frag.append(document.createTextNode(text.slice(lastIndex, match.index)));

            // Create interactive span
            const span = document.createElement('span');
            span.textContent = match[2].trim();
            span.addClass('hide-reveal--link');
            span.dataset.payload = match[1].trim();
            span.style.cursor = 'pointer';

            span.addEventListener('click', async () => {
              await navigator.clipboard.writeText(span.dataset.payload!);
              new Notice(this.settings.notificationText);
            });

            frag.append(span);
            lastIndex = match.index + match[0].length;
          }

          // Append trailing text
          frag.append(document.createTextNode(text.slice(lastIndex)));

          if (frag.childNodes.length > 0) {
            el.replaceChild(frag, node);
          }
        }
      });
    });
  }
}

// Utility to escape regex special chars
function escapeRegex(s: string) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
```

### Explanation

1. **Settings**: `startDelimiter`, `separator`, `endDelimiter`, and `notificationText` are user-configurable.
2. **Regex**: Dynamically built from delimiters to match `payload|display`.
3. **DOM Walk**: Iterates over all text nodes to find and replace matched patterns with clickable spans.
4. **Clipboard & Notice**: Uses the Web Clipboard API and Obsidian’s `Notice` for feedback.

---

## Configurable Options

Implement a Settings tab in `settings.ts`:

```ts
import { App, PluginSettingTab, Setting } from 'obsidian';
import HideRevealPlugin from './main';

export interface HideRevealSettings {
  startDelimiter: string;
  separator: string;
  endDelimiter: string;
  notificationText: string;
}

export const DEFAULT_SETTINGS: HideRevealSettings = {
  startDelimiter: '::',
  separator: '|',
  endDelimiter: '::',
  notificationText: 'Copied to clipboard!',
};

export class HideRevealSettingTab extends PluginSettingTab {
  plugin: HideRevealPlugin;

  constructor(app: App, plugin: HideRevealPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Hide & Reveal Settings' });

    new Setting(containerEl)
      .setName('Start Delimiter')
      .setDesc('Text that marks the beginning of a hidden block')
      .addText(text =>
        text
          .setValue(this.plugin.settings.startDelimiter)
          .onChange(async (v) => {
            this.plugin.settings.startDelimiter = v;
            await this.plugin.saveData(this.plugin.settings);
          })
      );

    // Repeat for separator, endDelimiter, notificationText...
  }
}
```

Users can customize delimiters and notification copy text.

---

## Styling

Add `styles.css`:

```css
.hide-reveal--link {
  text-decoration: underline;
  color: var(--interactive-normal);
}
.hide-reveal--link:hover {
  color: var(--interactive-hover);
}
```

Include in `main.ts` onload:

```ts
this.registerDomEvent(document, 'click', () => {}); // ensure styles loaded
this.registerCss('styles.css');
```

---

## Packaging & Publishing

1. **Build**

   ```bash
   npm run build
   ```

2. **Zip** content of `dist/` (manifest.json, main.js, styles.css, settings.js)

3. **Submit** to the Obsidian Community Plugins portal

   * Fork the [community-plugins](https://github.com/obsidianmd/obsidian-releases) repo
   * Add your plugin manifest under `community-plugins.json`

---

## Future Enhancements

* **Multi-line payloads**: support `///` or fenced blocks
* **Custom click effects**: animations or toast styles
* **Access control**: password-protect hidden payloads
* **Analytics**: record how often specific payloads are revealed

---

## References

* Obsidian Sample Plugin Template: [https://github.com/obsidianmd/obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
* Obsidian Plugin API Documentation: [https://github.com/obsidianmd/obsidian-api](https://github.com/obsidianmd/obsidian-api)
* Clipboard API: [https://developer.mozilla.org/en-US/docs/Web/API/Clipboard\_API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
