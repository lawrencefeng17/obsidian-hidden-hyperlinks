# Hidden Hyperlinks Plugin for Obsidian

Hide text within other text and copy hidden content to clipboard on click.

## Features

- Hide text within visible text using a simple syntax
- Visual indication that text contains hidden content (dashed underline)
- Click to copy hidden text to clipboard
- Temporary visual feedback when copying

## Usage

Use the following syntax to create hidden hyperlinks:

```
{visible text|hidden:hidden_text}
```

### Examples

**Input:**
```
* {Inf2-3.1.2-70B-RC|hidden:/mnt/vast/share/inf2-training/experiments/3.1.2/job_id_11781/checkpoints/epoch_0/} was trained using {this data|hidden:/mnt/vast/share/inf2-training/data/prod_fudge_justpi_1_1/combined_formatted/sft/ad_jpi_9_21_f353_sftdpo_sft_d4h2_lm.jsonl}.
```

**Output:**
* Inf2-3.1.2-70B-RC was trained using this data.

Where:
- Clicking "Inf2-3.1.2-70B-RC" copies `/mnt/vast/share/inf2-training/experiments/3.1.2/job_id_11781/checkpoints/epoch_0/` to clipboard
- Clicking "this data" copies `/mnt/vast/share/inf2-training/data/prod_fudge_justpi_1_1/combined_formatted/sft/ad_jpi_9_21_f353_sftdpo_sft_d4h2_lm.jsonl` to clipboard

## Visual Indicators

- Hidden hyperlinks appear with a dashed underline
- Hover effect shows background highlight
- Tooltip shows "Click to copy hidden text to clipboard"
- Temporary feedback shows "Copied!" when text is successfully copied

## Installation

1. Copy the plugin files to your Obsidian plugins folder: `.obsidian/plugins/hidden-hyperlinks/`
2. Enable the plugin in Obsidian settings
3. Start using the `{visible text|hidden:hidden_text}` syntax in your notes

## Development

To build the plugin:

```bash
npm install
npm run build
```

For development with auto-rebuild:

```bash
npm run dev
``` 