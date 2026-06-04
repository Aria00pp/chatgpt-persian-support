# ChatGPT Persian RTL Support

A small, dependency-free Manifest V3 Chrome extension that improves Persian and Arabic writing on ChatGPT. It makes the prompt composer and conversation text right-to-left and right-aligned while leaving ChatGPT's surrounding interface unchanged.

The extension applies formatting to messages already on the page and uses a batched `MutationObserver` plus SPA route hooks to handle newly streamed responses, newly added messages, and chat navigation. Code, technical snippets, tables, and math remain left-to-right where possible.

## Features

- Supports `https://chatgpt.com/*` and `https://chat.openai.com/*`.
- Makes the ChatGPT composer RTL without replacing or cloning the input, so normal typing, selection, paste, keyboard shortcuts, voice input, uploads, and sending continue to use ChatGPT's own behavior.
- Formats user and assistant messages, including existing and dynamically generated content.
- Keeps code blocks, inline code, keyboard input, terminal-like output, tables, math, and common syntax-highlighted/editor elements LTR and left-aligned.
- Keeps RTL styling scoped to the composer and messages instead of changing the entire page.
- Uses no external dependencies, remote code, permissions, network requests, telemetry, or tracking.

## Install as an unpacked Chrome extension

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder (the folder containing `manifest.json`).
5. Open or refresh [ChatGPT](https://chatgpt.com/).

After changing extension files locally, click the extension's **Reload** button on `chrome://extensions`, then refresh ChatGPT.

## Files

- `manifest.json` — Manifest V3 configuration and narrowly scoped ChatGPT content-script matches.
- `content.js` — Idempotent composer/message detection, RTL class application, mutation observation, and SPA route handling.
- `content.css` — Scoped RTL presentation and LTR exceptions for technical content.

## Manual test checklist

Load the unpacked extension, then verify the following on `https://chatgpt.com/`:

- [ ] The composer is right-to-left and right-aligned before typing.
- [ ] Persian text starts from the right while typing.
- [ ] Sending a Persian prompt works normally, including Enter and Shift+Enter behavior.
- [ ] The sent user message appears RTL and right-aligned.
- [ ] The assistant response appears RTL and right-aligned.
- [ ] A newly streamed assistant response becomes RTL without a refresh.
- [ ] Switching between chats continues to apply RTL formatting.
- [ ] Code blocks, inline code, JSON, and terminal output remain LTR and left-aligned.
- [ ] Lists render with right-side indentation.
- [ ] English and mixed Persian-English text remain readable.
- [ ] The sidebar, buttons, menus, model selector, voice input, file upload, toolbar, and send button are not visually broken.
- [ ] Repeat the relevant checks on `https://chat.openai.com/` if that host is available for the account.

## Privacy

This extension does not collect, transmit, or store chat content or any other user data. It makes no network requests and contains no telemetry, analytics, or tracking. All behavior runs locally in the ChatGPT page through the declared content script.

## Known limitations

- ChatGPT's DOM structure can change without notice. The extension favors semantic selectors and common editor selectors, but future ChatGPT updates may require selector maintenance.
- RTL is the default for message prose. Entirely English prose remains readable but is right-aligned; code and common technical content receive explicit LTR treatment.
- Unusual third-party rendered content or a newly introduced ChatGPT editor may need an additional LTR exception.
