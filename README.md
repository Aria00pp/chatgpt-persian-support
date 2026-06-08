# ChatGPT Persian Direction Support

A small, dependency-free Manifest V3 Chrome extension that adds **Auto**, **RTL**, and **LTR** writing-direction modes to ChatGPT. It formats only the prompt composer and conversation prose while leaving ChatGPT's surrounding interface unchanged.

The extension applies the selected mode to messages already on the page and uses a batched `MutationObserver` plus SPA route hooks for streamed responses, newly added messages, replaced composers, and chat navigation. Code, technical snippets, and math remain left-to-right in every mode, while prose tables keep stable column order and manage direction per cell.

## Features

- Supports only `https://chatgpt.com/*` and `https://chat.openai.com/*`.
- Adds a compact **Auto / RTL / LTR** control near the composer, with the active mode visibly indicated.
- **RTL** makes the composer and message prose right-to-left and right-aligned.
- **LTR** makes the composer and message prose left-to-right and left-aligned.
- **Auto** detects the first strong Persian/Arabic/Hebrew or Latin character. Composer direction updates live, while each message independently receives its detected direction. Empty or ambiguous text defaults to RTL.
- Formats user and assistant message prose, including existing and dynamically generated content, without forcing action bars or surrounding controls into a direction.
- Applies the selected direction to the main composer plus prompt-like edit and retry/regenerate input areas, including a full-document active-edit scan for ChatGPT edit boxes that appear outside the normal composer structure.
- Uses CSS inline isolation for bold, italic, quote, link, and span content so mixed Persian-English prose is easier to read without mutating rendered message text or composer text.
- Keeps code blocks, inline code, keyboard input, terminal-like output, math, and common syntax-highlighted/editor elements LTR and left-aligned; prose table cells are detected independently so Persian, English, and mixed cells remain readable without flipping table columns.
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
- `content.js` — Safe main, edit, and retry composer/message detection; mode state and persistence; direction detection; accessible control injection; keyboard shortcuts; mutation observation; and SPA route handling.
- `content.css` — Scoped RTL/LTR presentation, CSS inline bidi isolation for mixed prose, strengthened composer/edit direction styling, compact control styling, and LTR exceptions for technical content.

## Manual test checklist

Load the unpacked extension, then verify the following on `https://chatgpt.com/`:

- [ ] The composer defaults to the saved mode, or RTL if no mode has been saved.
- [ ] The Auto / RTL / LTR control appears once near the composer.
- [ ] The control does not duplicate after refresh, chat switching, route changes, streamed updates, or composer replacement.
- [ ] RTL mode makes Persian typing start from the right.
- [ ] LTR mode makes English typing start from the left.
- [ ] Auto mode makes Persian-first composer text RTL.
- [ ] Auto mode: `PR 5: edit mode شد و مشکل پیام‌ها رفع شد.` is RTL/readable.
- [ ] Auto mode: `PR 5 fixes edit mode and improves message handling.` is LTR/readable.
- [ ] RTL mode: `PR 7: popup مربوط به Ask to change response merge شد.` remains RTL/readable.
- [ ] Composer typing with an English prefix followed by Persian remains readable in RTL mode.
- [ ] Auto mode makes English-first composer text LTR.
- [ ] Edit a previous user message in RTL mode; the edit box is RTL and right-aligned.
- [ ] Click the edit pencil in RTL mode; the edit text starts from the right immediately.
- [ ] Type Persian in edit mode; text extends naturally from right to left.
- [ ] Move the caret to the beginning/end in RTL edit mode; caret behavior feels RTL.
- [ ] Edit a previous user message in LTR mode; the edit box is LTR and left-aligned for English text.
- [ ] Edit a previous user message in Auto mode; direction updates live inside the edit box based on the edited text.
- [ ] Retry/regenerate input flow receives the selected direction behavior.
- [ ] Open the retry/try-again popup.
- [ ] Click "Ask to change response".
- [ ] In RTL mode, the response-change popup behaves the same as manually pressing Ctrl + ShiftRight.
- [ ] In RTL mode, type Persian into the top input after the placeholder disappears; the caret starts on the right and Persian text extends naturally RTL.
- [ ] In LTR mode, the response-change popup behaves the same as manually pressing Ctrl + ShiftLeft, and English text starts from the left.
- [ ] In Auto mode, direction updates live in the Ask to change response box.
- [ ] Type this in the Ask to change response box: `این پاسخ را با Auto mode و shortcut و input handler بهتر توضیح بده`.
- [ ] "Try again" and "Search the web" menu items remain normal while only the response-change input changes direction.
- [ ] Ctrl + Right Shift switches to RTL inside the composer.
- [ ] Ctrl + Left Shift switches to LTR inside the composer.
- [ ] Ctrl + Shift + A switches to Auto inside the composer.
- [ ] Sending prompts works normally, including Enter and Shift+Enter behavior.
- [ ] Existing user and assistant messages update after a mode switch.
- [ ] Newly streamed assistant messages follow the selected mode and re-detect while streaming in Auto mode.
- [ ] In Auto mode, Persian-first and English-first messages can have independent directions.
- [ ] Mixed Persian-English text with bold, italic, quotes, and punctuation remains readable.
- [ ] Ask ChatGPT: `به فارسی توضیح بده: Auto mode و shortcut و input handler و composer و target و live یعنی چه. از bold و italic هم استفاده کن.` Confirm English fragments remain visually stable inside the Persian paragraph.
- [ ] English words such as `bug`, `polish`, `Auto mode`, and `direction` remain visually stable inside Persian-first prose when covered by CSS inline isolation.
- [ ] Long normal messages are not truncated.
- [ ] Streaming messages are not truncated.
- [ ] No JS text-node wrapping is used on rendered ChatGPT messages.
- [ ] Response-change popup still works after typing mixed Persian-English text.
- [ ] Edit mode still works after typing mixed Persian-English text.
- [ ] Code blocks remain LTR and left-aligned in all modes.
- [ ] Inline code remains LTR and readable.
- [ ] Tables keep stable column order and do not flip unpredictably.
- [ ] In Auto, RTL, and LTR modes, paste or ask for this table and confirm each `th` and `td` is direction-managed independently while inline code stays LTR inside cells:

  | نوع متن | نمونه |
  |---|---|
  | فارسی کامل | این متن کاملاً فارسی است و باید راست‌به‌چپ خوانده شود. |
  | English only | This text is fully English and should stay left-to-right. |
  | فارسی با English وسط | این متن شامل Auto mode و edit mode در وسط جمله است. |
  | English prefix + فارسی | PR 5: edit mode شد و مشکل پیام‌ها رفع شد. |
  | فارسی prefix + English | حالت Auto باید PR 7 و popup را درست نمایش بدهد. |
  | عبارت فنی مخلوط | Ask to change response مربوط به popup حالا درست کار می‌کند. |
- [ ] Math remains readable.
- [ ] Lists and blockquotes remain readable in RTL and LTR modes.
- [ ] Sidebar, dialogs, search boxes, menus, settings panels, and the model selector remain normal.
- [ ] Upload, voice, send, copy, retry/regenerate, feedback, edit, and toolbar controls remain visually normal.
- [ ] ChatGPT controls remain visually normal after switching modes.
- [ ] Repeat the relevant checks on `https://chat.openai.com/` if that host is available for the account.

## Debugging response-change popup detection

Diagnostics are disabled by default and only print local console output when explicitly enabled. The content script listens for DOM events so commands from the normal page DevTools Console can trigger diagnostics despite Chrome's isolated content-script world.

To inspect the response-change popup:

1. Open DevTools Console.
2. Run:
   ```js
   document.dispatchEvent(new CustomEvent("cgpt-rtl-debug-enable"));
   ```
3. Open the retry/try-again popup.
4. Focus the top "Ask to change response" input.
5. Run:
   ```js
   document.dispatchEvent(new CustomEvent("cgpt-rtl-inspect-active"));
   ```
6. Copy the printed diagnostic object, excluding any private text if needed.
7. Disable diagnostics when done:
   ```js
   document.dispatchEvent(new CustomEvent("cgpt-rtl-debug-disable"));
   ```

Alternatively, set `document.documentElement.dataset.cgptRtlDebug = "1"` before focusing the input. The diagnostic limits nearby text previews and does not send, store, or transmit any chat content.

If the diagnostic shows `activeElement` as `role="menu"` with `editingHost: null`, that is expected for ChatGPT's response-change pseudo-input. The extension handles that path by detecting the focused response-change menu and applying direction to the menu's top pseudo-input/display targets while restoring the `Try again` and `Search the web` rows to normal menu direction.

## Privacy

This extension stores only one local preference: the selected direction mode (`auto`, `rtl`, or `ltr`) in `chrome.storage.local`. It does **not** store prompt text, message text, chat content, or any other user data. It makes no network requests and contains no telemetry, analytics, or tracking.

## Known limitations

- ChatGPT's DOM structure can change without notice. The extension favors semantic selectors and common editor selectors, but future ChatGPT updates may require selector maintenance.
- Auto mode intentionally uses a simple first-strong-letter heuristic. Numbers, punctuation, Markdown markers, symbols, and emoji are ignored; empty or ambiguous text defaults to RTL.
- Unusual third-party rendered content or a newly introduced ChatGPT editor may need an additional LTR exception.
