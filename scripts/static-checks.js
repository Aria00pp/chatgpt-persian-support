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
assert(!manifest.host_permissions, "host permissions must not be added");
assert(!manifest.background, "background scripts must not be added for this content-only feature");

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
  "isFocusedResponseChangeMenu",
  "getResponseChangePseudoInputTargets",
  "applyDirectionToResponseChangeMenu",
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
  "getStrongDirectionStats",
  "isShortLatinPrefixBeforeRtl",
  "detectDirectionFromText",
  "applyInlineDirectionStyle",
  "getEditingHost",
  "getActiveEditableBlock",
  "applyParagraphDirection",
  "applyDirectionLikeKeyboardShortcut",
  "isEditableDirectionExcluded",
  "debugEditableContext",
  "installDebugInspector",
  "handleComposerFocus",
  "isTableElement",
  "getTableDirectionTargets",
  "shouldDirectionManageTable",
  "directionForTableCell",
  "applyDirectionToTableCells"
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
assert(contentJs.includes('element.style.unicodeBidi = "isolate"'), "confirmed editable targets should isolate bidi behavior inline without re-resolving paragraph direction");
assert(!contentJs.includes('element.style.unicodeBidi = "plaintext"'), "editable targets must not force plaintext bidi broadly");
assert(!contentCss.includes("unicode-bidi: plaintext"), "forced direction CSS must not use plaintext bidi broadly");
assert(contentJs.includes("stats.rtlCount >= stats.latinCount"), "direction detection must count RTL and Latin strong characters");
assert(contentJs.includes("stats.firstRtlIndex > 50"), "direction detection must allow a short Latin prefix before early RTL text");
assert(!/function detectDirectionFromText[\s\S]*?if \(\/\[A-Za-z\]\/[\s\S]*?return "ltr";[\s\S]*?if \(\/\[\\u0590-\\u08FF/.test(contentJs), "direction detection must not be immediate first-strong Latin/RTL returns only");
assert(contentJs.includes("applyDirectionLikeKeyboardShortcut(element, direction)"), "keyboard-like paragraph direction helper must be used for editable targets");
assert(contentJs.includes("window.getSelection"), "active selection/block helper must inspect the current editable block");
assert(contentJs.includes("getKeyboardShortcutDirectionTargets(element)"), "inline style forcing must remain scoped to editable/composer targets");
assert(contentJs.includes("let debugEnabled = false"), "diagnostic mode must be disabled by default");
assert(contentJs.includes('document.addEventListener("cgpt-rtl-debug-enable", handleDebugEvent)'), "debug enable event listener must be installed");
assert(contentJs.includes('document.addEventListener("cgpt-rtl-debug-disable", handleDebugEvent)'), "debug disable event listener must be installed");
assert(contentJs.includes('document.addEventListener("cgpt-rtl-inspect-active", handleDebugEvent)'), "manual inspect event listener must be installed");
assert(contentJs.includes('document.documentElement.dataset.cgptRtlDebug === "1"'), "diagnostics should also support documentElement dataset opt-in");
assert(contentJs.includes('debugEditableContext(composer, "focusin")'), "focusin diagnostics must inspect prompt-like editables when enabled");
assert(contentJs.includes('debugEditableContext(composer, "input")'), "input diagnostics must inspect prompt-like editables when enabled");
assert(contentJs.includes("debugDirectionApplied(element, direction, targets)"), "response-change direction application must log targets when diagnostics are enabled");
assert(contentJs.includes("debugResponseChangeMenuApplied(menu, direction, directionTargets, menuItemRows)"), "focused menu direction application must log targets when diagnostics are enabled");
assert(contentJs.includes("pseudoInputTargets"), "diagnostics must report response-change pseudo-input targets");
assert(contentJs.includes("excludedMenuItemRows"), "diagnostics must report excluded/restored response-change menu rows");
assert(contentJs.includes("applyDirectionToFocusedResponseChangeMenus(root)"), "apply pass must handle focused response-change menu pseudo-inputs");
assert(contentJs.includes("console.info"), "diagnostics should log locally to the console only");
assert(contentJs.includes("previewText(container && container.textContent, 500)"), "diagnostic container text must be limited");
assert(contentJs.includes('for (const tableElement of getTableDirectionTargets(messageElement))'), "message apply pass must process tables separately from prose targets");
assert(/function directionForTableCell\(cellElement\) \{[\s\S]*?detectDirectionFromText\(cellElement\.textContent/.test(contentJs), "table cell direction must use text detection per cell");
assert(/function applyDirectionToTableCells\(tableElement\) \{[\s\S]*?querySelectorAll\("th, td"\)/.test(contentJs), "table direction must be applied independently to th and td cells");
assert(contentJs.includes('tableElement.setAttribute("dir", "ltr")'), "table element must keep stable LTR column layout");
assert(contentCss.includes(".cgpt-dir-table"), "scoped table direction class must be styled");
assert(contentCss.includes(".cgpt-dir-table-cell.cgpt-dir-rtl"), "RTL table cell class must be styled");
assert(contentCss.includes(".cgpt-dir-table-cell.cgpt-dir-ltr"), "LTR table cell class must be styled");
assert(!/table\s*\{[^}]*direction\s*:\s*rtl/im.test(contentCss), "must not use broad table { direction: rtl }");
assert(!/\.cgpt-dir-message\s+:is\([^)]*table[^)]*\)\s*\{[^}]*direction\s*:\s*rtl/im.test(contentCss), "message CSS must not force all tables RTL");

for (const selector of ["strong", "b", "em", "i", "span", "q", "a"]) {
  assert(contentCss.includes(selector), `inline formatting selector missing: ${selector}`);
}

for (const selector of ["pre", "code", "kbd", "samp", "textarea", "table", "math", ".katex", ".MathJax", "[role=\"grid\"]", "[role=\"treegrid\"]"]) {
  assert(contentCss.includes(selector) || contentJs.includes(selector), `technical exception missing: ${selector}`);
}

assert(!/^\s*(html|body|main)\b[^{]*\{[^}]*direction\s*:/m.test(contentCss), "must not globally set direction on html, body, or main");

console.log("static checks passed");
