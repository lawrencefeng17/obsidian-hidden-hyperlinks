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
    containerEl.createEl('h2', { text: 'Hidden Hyperlinks Settings' });

    containerEl.createEl('p', { 
      text: 'Configure how hidden hyperlinks are formatted and behave.' 
    });

    containerEl.createEl('h3', { text: 'Delimiters' });
    
    containerEl.createEl('p', { 
      text: 'Example: ::hidden payload|display text::' 
    });

    new Setting(containerEl)
      .setName('Start Delimiter')
      .setDesc('Text that marks the beginning of a hidden block')
      .addText(text =>
        text
          .setValue(this.plugin.settings.startDelimiter)
          .onChange(async (value) => {
            this.plugin.settings.startDelimiter = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Separator')
      .setDesc('Text that separates the hidden payload from the display text')
      .addText(text =>
        text
          .setValue(this.plugin.settings.separator)
          .onChange(async (value) => {
            this.plugin.settings.separator = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('End Delimiter')
      .setDesc('Text that marks the end of a hidden block')
      .addText(text =>
        text
          .setValue(this.plugin.settings.endDelimiter)
          .onChange(async (value) => {
            this.plugin.settings.endDelimiter = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl('h3', { text: 'Behavior' });

    new Setting(containerEl)
      .setName('Notification Text')
      .setDesc('Message shown when hidden text is copied to clipboard')
      .addText(text =>
        text
          .setValue(this.plugin.settings.notificationText)
          .onChange(async (value) => {
            this.plugin.settings.notificationText = value;
            await this.plugin.saveSettings();
          })
      );
  }
} 