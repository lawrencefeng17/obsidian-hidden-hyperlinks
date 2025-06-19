# Hidden Hyperlinks Demo

This note demonstrates how to use the Hidden Hyperlinks plugin.

**Note**: We use `{text|hidden:content}` syntax instead of `[text](hidden:content)` to avoid conflicts with Obsidian's built-in markdown link parser.

## Basic Usage

Here's your original example:

* {Inf2-3.1.2-70B-RC|hidden:/mnt/vast/share/inf2-training/experiments/3.1.2/job_id_11781/checkpoints/epoch_0/} was trained using {this data|hidden:/mnt/vast/share/inf2-training/data/prod_fudge_justpi_1_1/combined_formatted/sft/ad_jpi_9_21_f353_sftdpo_sft_d4h2_lm.jsonl}.

## More Examples

You can use it for various purposes:

* The {secret code|hidden:ABC123XYZ} is hidden in this text.
* My {API key|hidden:sk-1234567890abcdef} is safely concealed.
* The {database connection|hidden:postgresql://user:pass@localhost:5432/db} string is not visible.
* Here's a {command|hidden:docker run -it --rm -v $(pwd):/workspace ubuntu:latest bash} you can copy.

## Instructions

1. Click on any underlined text (like "Inf2-3.1.2-70B-RC" above)
2. The hidden text will be copied to your clipboard
3. You'll see a brief "Copied!" confirmation
4. Paste anywhere to use the hidden content

## Syntax

The syntax is: `{visible text|hidden:hidden_text}`

- `{visible text|` - What users see
- `hidden:` - The special prefix that triggers the plugin
- `hidden_text}` - What gets copied to clipboard when clicked 