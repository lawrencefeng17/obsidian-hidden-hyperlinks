import { Plugin, MarkdownPostProcessorContext } from 'obsidian';

interface HiddenHyperlinkSettings {
	// Future settings can be added here
}

const DEFAULT_SETTINGS: HiddenHyperlinkSettings = {
	// Default values for future settings
}

export default class HiddenHyperlinksPlugin extends Plugin {
	settings: HiddenHyperlinkSettings;

	async onload() {
		await this.loadSettings();

		// Register the markdown post processor
		this.registerMarkdownPostProcessor((element, context) => {
			this.processHiddenHyperlinks(element, context);
		});

		// Add CSS for styling
		this.addStyle();
	}

	onunload() {
		// Clean up styles
		this.removeStyle();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	processHiddenHyperlinks(element: HTMLElement, context: MarkdownPostProcessorContext) {
		// Look for the pattern: {visible text|hidden:hidden_text}
		const regex = /\{([^|]+)\|hidden:([^}]+)\}/g;
		
		// Find all text nodes in the element
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

		// Process each text node
		textNodes.forEach(textNode => {
			const text = textNode.textContent || '';
			// Debug logging
			if (text.includes('{') && text.includes('hidden:')) {
				console.log('Hidden Hyperlinks: Found potential match in text:', text);
			}
			if (regex.test(text)) {
				console.log('Hidden Hyperlinks: Processing text:', text);
				this.replaceHiddenHyperlinks(textNode, text);
			}
		});
	}

	replaceHiddenHyperlinks(textNode: Text, text: string) {
		const regex = /\{([^|]+)\|hidden:([^}]+)\}/g;
		const parent = textNode.parentNode;
		if (!parent) return;

		let lastIndex = 0;
		let match;
		const fragment = document.createDocumentFragment();

		while ((match = regex.exec(text)) !== null) {
			// Add text before the match
			if (match.index > lastIndex) {
				fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
			}

			// Create the hidden hyperlink element
			const hiddenLink = this.createHiddenHyperlinkElement(match[1], match[2]);
			fragment.appendChild(hiddenLink);

			lastIndex = regex.lastIndex;
		}

		// Add remaining text after the last match
		if (lastIndex < text.length) {
			fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
		}

		// Replace the original text node with the fragment
		parent.replaceChild(fragment, textNode);
	}

	createHiddenHyperlinkElement(visibleText: string, hiddenText: string): HTMLElement {
		const span = document.createElement('span');
		span.className = 'hidden-hyperlink';
		span.textContent = visibleText;
		span.title = 'Click to copy hidden text to clipboard';
		
		// Add click handler to copy hidden text to clipboard
		span.addEventListener('click', async (e) => {
			e.preventDefault();
			e.stopPropagation();
			
			try {
				await navigator.clipboard.writeText(hiddenText);
				
				// Show temporary feedback
				this.showCopyFeedback(span, 'Copied!');
			} catch (err) {
				console.error('Failed to copy to clipboard:', err);
				this.showCopyFeedback(span, 'Copy failed');
			}
		});

		return span;
	}

	showCopyFeedback(element: HTMLElement, message: string) {
		const originalText = element.textContent;
		element.textContent = message;
		element.style.opacity = '0.7';
		
		setTimeout(() => {
			element.textContent = originalText;
			element.style.opacity = '1';
		}, 1000);
	}

	addStyle() {
		const styleEl = document.createElement('style');
		styleEl.id = 'hidden-hyperlinks-style';
		styleEl.textContent = `
			.hidden-hyperlink {
				color: var(--link-color, #7c3aed);
				text-decoration: underline;
				text-decoration-style: dashed;
				cursor: pointer;
				border-radius: 3px;
				padding: 1px 2px;
				transition: all 0.2s ease;
			}
			
			.hidden-hyperlink:hover {
				background-color: var(--link-color-hover, rgba(124, 58, 237, 0.1));
				text-decoration-style: solid;
			}
			
			.hidden-hyperlink:active {
				background-color: var(--link-color-hover, rgba(124, 58, 237, 0.2));
				transform: scale(0.98);
			}
		`;
		document.head.appendChild(styleEl);
	}

	removeStyle() {
		const styleEl = document.getElementById('hidden-hyperlinks-style');
		if (styleEl) {
			styleEl.remove();
		}
	}
} 