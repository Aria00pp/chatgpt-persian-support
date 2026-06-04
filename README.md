# ChatGPT Persian Direction Support

A small, dependency-free Manifest V3 Chrome extension that adds **Auto**, **RTL**, and **LTR** writing-direction modes to ChatGPT. It formats only the prompt composer and conversation prose while leaving ChatGPT's surrounding interface unchanged.

The extension applies the selected mode to messages already on the page and uses a batched `MutationObserver` plus SPA route hooks for streamed responses, newly added messages, replaced composers, and chat navigation. Code, technical snippets, tables, and math remain left-to-right in every mode.

## Features

- Supports only `https://chatgpt.com/*` and `https://chat.openai.com/*`.
- Adds a compact **Auto / RTL / LTR** control near the composer, with the active mode visibly indicated.
- **RTL** makes the composer and message prose right-to-left and right-aligned.
- **LTR** makes the composer and message prose left-to-right and left-aligned.
- **Auto** detects the first strong Persian/Arabic/Hebrew or Latin character. Composer direction updates live, while each message independently receives its detected direction. Empty or ambiguous text defaults to RTL.
- Formats user and assistant message prose, including existing and dynamically generated content, without forcing action bars or surrounding controls into a direction.
- Keeps code blocks, inline code, keyboard input, terminal-like output, tables, math, and common syntax-highlighted/editor elements LTR and left-aligned.
- Does not replace, clone, wrap, or modify the text in ChatGPT's native composer.
- Uses no external dependencies, remote code, network requests, telemetry, analytics, or tracking.

## Using the direction modes

Use the small **Auto / RTL / LTR** control immediately above the ChatGPT composer. The selected mode is saved locally and reused on later visits. For backward compatibility, a first-time installation defaults to RTL until another mode is selected.

When focus is inside the ChatGPT composer, these shortcuts are available:

- **Ctrl + Right Shift** — switch to RTL.
- **Ctrl + Left Shift** — switch to LTR.
- **Ctrl + Shift + A** — switch to Auto.

The shortcuts only act inside the confirmed ChatGPT composer. Normal typing, selection, paste, Enter, Shift+Enter, file upload, voice input, and send behavior remain native to ChatGPT.

## Install as an unpacked Chrome extension

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder (the folder containing `manifest.json`).
5. Open or refresh [ChatGPT](https://chatgpt.com/).

After changing extension files locally, click the extension's **Reload** button on `chrome://extensions`, then refresh ChatGPT.

## Files

- `manifest.json` — Manifest V3 configuration, narrowly scoped ChatGPT content-script matches, and the `storage` permission used only for the selected mode.
- `content.js` — Safe composer/message detection, mode state and persistence, direction detection, accessible control injection, keyboard shortcuts, mutation observation, and SPA route handling.
- `content.css` — Scoped RTL/LTR presentation, compact control styling, and LTR exceptions for technical content.

## Manual test checklist

Load the unpacked extension, then verify the following on `https://chatgpt.com/`:

- [ ] The composer defaults to the saved mode, or RTL if no mode has been saved.
- [ ] The Auto / RTL / LTR control appears once near the composer.
- [ ] The control does not duplicate after refresh, chat switching, route changes, streamed updates, or composer replacement.
- [ ] RTL mode makes Persian typing start from the right.
- [ ] LTR mode makes English typing start from the left.
- [ ] Auto mode makes Persian-first composer text RTL.
- [ ] Auto mode makes English-first composer text LTR.
- [ ] Ctrl + Right Shift switches to RTL inside the composer.
- [ ] Ctrl + Left Shift switches to LTR inside the composer.
- [ ] Ctrl + Shift + A switches to Auto inside the composer.
- [ ] Sending prompts works normally, including Enter and Shift+Enter behavior.
- [ ] Existing user and assistant messages update after a mode switch.
- [ ] Newly streamed assistant messages follow the selected mode and re-detect while streaming in Auto mode.
- [ ] In Auto mode, Persian-first and English-first messages can have independent directions.
- [ ] Code blocks remain LTR and left-aligned in all modes.
- [ ] Inline code remains readable.
- [ ] Tables remain LTR and left-aligned.
- [ ] Math remains readable.
- [ ] Lists and blockquotes remain readable in RTL and LTR modes.
- [ ] Sidebar, dialogs, search boxes, menus, settings panels, and the model selector remain normal.
- [ ] Upload, voice, send, copy, retry/regenerate, feedback, and toolbar controls remain visually normal.
- [ ] Repeat the relevant checks on `https://chat.openai.com/` if that host is available for the account.

## Privacy

This extension stores only one local preference: the selected direction mode (`auto`, `rtl`, or `ltr`) in `chrome.storage.local`. It does **not** store prompt text, message text, chat content, or any other user data. It makes no network requests and contains no telemetry, analytics, or tracking.

## Known limitations

- ChatGPT's DOM structure can change without notice. The extension favors semantic selectors and common editor selectors, but future ChatGPT updates may require selector maintenance.
- Auto mode intentionally uses a simple first-strong-letter heuristic. Numbers, punctuation, Markdown markers, symbols, and emoji are ignored; empty or ambiguous text defaults to RTL.
- Unusual third-party rendered content or a newly introduced ChatGPT editor may need an additional LTR exception.
