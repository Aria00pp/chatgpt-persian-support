const fs = require("fs");
const assert = require("assert");

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const contentJs = fs.readFileSync("content.js", "utf8");
const contentCss = fs.readFileSync("content.css", "utf8");

assert.strictEqual(manifest.manifest_version, 3, "manifest_version must remain 3");
assert.deepStrictEqual(
  manifest.content_scripts[0].matches,
  ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  "content script matches must stay limited to ChatGPT hosts"
);
assert.deepStrictEqual(manifest.permissions, ["storage"], "only the storage permission should be requested");

for (const api of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket"]) {
  assert(!contentJs.includes(api), `network API must not be used: ${api}`);
}

for (const mode of ["auto", "rtl", "ltr"]) {
  assert(contentJs.includes(`"${mode}"`), `mode string missing: ${mode}`);
}

for (const helper of [
  "isPromptLikeEditable",
  "isMainComposer",
  "isInlineEditComposer",
  "isRetryComposer",
  "isResponseChangeComposer",
  "isAskToChangeResponseInput",
  "hasResponseChangeMenuSignals",
  "isFocusedResponseChangeInput",
  "hasResponseChangeContext",
  "isUserMessageEditComposer",
  "isActiveEditableComposer",
  "isLikelyChatEditable",
  "applyDirectionToActiveEditables",
  "getEditableDirectionTargets",
  "applyDirectionToEditableTree",
  "applyInlineDirectionStyle",
  "getEditingHost",
  "getActiveEditableBlock",
  "applyParagraphDirection",
  "applyDirectionLikeKeyboardShortcut",
  "isEditableDirectionExcluded",
  "handleComposerFocus"
]) {
  assert(contentJs.includes(`function ${helper}`), `helper missing: ${helper}`);
}

assert(contentJs.includes("chrome.storage.local"), "mode storage must continue using chrome.storage.local");
assert(contentJs.includes("createDirectionControl"), "direction control must still exist");
assert(!contentJs.includes('document.createElement("bdi")'), "rendered message text must not be wrapped in bdi");
assert(!contentJs.includes("document.createElement('bdi')"), "rendered message text must not be wrapped in bdi");
assert(!contentJs.includes("textNode.replaceWith"), "rendered message text nodes must not be replaced");
assert(!/\.replaceWith\s*\(/.test(contentJs), "text nodes or elements must not be replaced via replaceWith");
assert(!contentJs.includes("isolateInlineBidiRuns"), "JS inline bidi mutation pass must stay disabled");
assert(!contentJs.includes("execCommand"), "must not use deprecated editing commands for direction changes");
assert(contentJs.includes('document.addEventListener("focusin", handleComposerFocus, true)'), "focusin handler must apply edit composer direction immediately");
assert(contentJs.includes("EDITABLE_DIRECTION_TARGET_SELECTOR"), "editable tree direction targets must be defined");
assert(contentJs.includes("applyDirectionToActiveEditables(root)"), "full apply pass must scan active editables");
assert(contentJs.includes("applyParagraphDirection(target, direction)"), "inline style forcing must be scoped through editable tree targets");
assert(contentJs.includes("isResponseChangeComposer(element)"), "response-change composer must be part of narrow composer detection");
assert(contentJs.includes("hasResponseChangeMenuSignals(container)"), "response-change detection must use retry/search-web menu state");
assert(contentJs.includes("isFocusedResponseChangeInput(element)"), "focused response-change input must be detected after placeholder text disappears");
assert(/return isAskToChangeResponseInput\(element\) \|\| isFocusedResponseChangeInput\(element\) \|\| hasResponseChangeContext\(element\)/.test(contentJs), "response-change detection must not rely only on Ask to change response placeholder text");
assert(contentJs.includes('document.addEventListener("input", handleComposerInput, true)'), "input handler must keep Auto mode live for composers");
assert(contentJs.includes('element.style.unicodeBidi = "plaintext"'), "confirmed editable targets should force plaintext bidi behavior inline");
assert(contentJs.includes("applyDirectionLikeKeyboardShortcut(element, direction)"), "keyboard-like paragraph direction helper must be used for editable targets");
assert(contentJs.includes("window.getSelection"), "active selection/block helper must inspect the current editable block");
assert(contentJs.includes("getKeyboardShortcutDirectionTargets(element)"), "inline style forcing must remain scoped to editable/composer targets");

for (const selector of ["strong", "b", "em", "i", "span", "q", "a"]) {
  assert(contentCss.includes(selector), `inline formatting selector missing: ${selector}`);
}

for (const selector of ["pre", "code", "kbd", "samp", "textarea", "table", "math", ".katex", ".MathJax", "[role=\"grid\"]", "[role=\"treegrid\"]"]) {
  assert(contentCss.includes(selector) || contentJs.includes(selector), `technical exception missing: ${selector}`);
}

assert(!/^\s*(html|body|main)\b[^{]*\{[^}]*direction\s*:/m.test(contentCss), "must not globally set direction on html, body, or main");

console.log("static checks passed");
