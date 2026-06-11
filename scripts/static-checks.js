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
  "isCanvasDocumentBlock",
  "canvasDocumentContainerFor",
  "isInsideCanvasDocumentBlock",
  "collectElementsOutsideCanvas",
  "elementsMatchingOutsideCanvas",
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
  "tableHeaderText",
  "directionForTableLayout",
  "directionForTableCell",
  "applyDirectionToTableCells",
  "textSignatureFor",
  "cachedDirectionForTextElement",
  "cachedDirectionForTableCell",
  "cachedDirectionForTableLayout",
  "scheduleCleanup",
  "setupMessageIntersectionObserver",
  "refreshObservedMessages",
  "observeMessageForLazyDirection",
  "isMessageNearViewport",
  "enqueueMessageForDirection",
  "processDirectionQueue",
  "applyDirectionToVisibleMessages",
  "applyInteractiveDirections"
]) {
  assert(contentJs.includes(`function ${helper}`), `helper missing: ${helper}`);
}


assert(contentJs.includes("CANVAS_DOCUMENT_SIGNAL_SELECTOR"), "Canvas detection selector must exist");
assert(/function getMessageTextTargets\(messageElement\) \{[\s\S]*?isCanvasDocumentBlock\(messageElement\)[\s\S]*?collectElementsOutsideCanvas\(messageElement, MESSAGE_PROSE_SELECTOR\)[\s\S]*?!isInsideCanvasDocumentBlock\(element\)/.test(contentJs), "message text target collection must skip Canvas/document preview blocks");
assert(/function getMessageTextTargets\(messageElement\) \{[\s\S]*?collectElementsOutsideCanvas\(messageElement, MESSAGE_TEXT_BLOCK_SELECTOR\)/.test(contentJs), "rendered text block collection must avoid scanning Canvas deeply");
assert(/function getTableDirectionTargets\(messageElement\) \{[\s\S]*?isCanvasDocumentBlock\(messageElement\)[\s\S]*?collectElementsOutsideCanvas\(messageElement, "table"\)/.test(contentJs), "table target collection must skip Canvas/document preview blocks");
assert(/function shouldDirectionManageTable\(tableElement\) \{[\s\S]*?isInsideCanvasDocumentBlock\(tableElement\)[\s\S]*?return false/.test(contentJs), "table management must reject Canvas tables");
assert(/function applyDirectionToTableCells\(tableElement\) \{[\s\S]*?collectElementsOutsideCanvas\(tableElement, "th, td"\)[\s\S]*?isInsideCanvasDocumentBlock\(cellElement\)/.test(contentJs), "table cell processing must skip Canvas cells");
assert(/new MutationObserver\(\(mutations\) => \{[\s\S]*?isCanvasDocumentBlock\(target\) \|\| isInsideCanvasDocumentBlock\(target\)[\s\S]*?continue;/.test(contentJs), "MutationObserver must have a Canvas skip path");
assert(/function scheduleApply\(root = document, options = \{\}\) \{[\s\S]*?isCanvasDocumentBlock\(root\) \|\| isInsideCanvasDocumentBlock\(root\)[\s\S]*?return;/.test(contentJs), "scheduled direction passes must not run on Canvas roots");
assert(!/selectionchange|selectstart|mouseup|mousedown/.test(contentJs), "Canvas-specific selection guards must not be installed");
assert(/function applyDirection\(element, kind, forcedDirection = null\) \{[\s\S]*?isCanvasDocumentBlock\(element\) \|\| isInsideCanvasDocumentBlock\(element\)[\s\S]*?return forcedDirection \|\| selectedMode;/.test(contentJs), "direction classes must not be applied intentionally to Canvas content");
assert(/function applyInlineDirectionStyle\(element, direction\) \{[\s\S]*?isCanvasDocumentBlock\(element\) \|\| isInsideCanvasDocumentBlock\(element\)[\s\S]*?return;/.test(contentJs), "inline direction styles must not be applied inside Canvas content");

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

assert(contentJs.includes("IntersectionObserver"), "rendered messages must use IntersectionObserver for lazy direction processing");
assert(contentJs.includes("const messageDirectionQueue = new Set()"), "message direction queue must exist");
assert(contentJs.includes("const MAX_MESSAGES_PER_FRAME"), "message queue must use a per-frame processing budget");
assert(contentJs.includes("MESSAGE_OBSERVER_ROOT_MARGIN"), "message observer must use a generous root margin");
assert(!contentJs.includes("applyDirections(document, { fullReconcile: true })"), "startup/cleanup must not full-process all document messages");
assert(!contentJs.includes("scheduleApply(document, { fullScan: true })"), "large subtree mutations must not force synchronous full document message processing");
assert(new RegExp("installDebugInspector\\(\\);\\s*setupMessageIntersectionObserver\\(\\);\\s*applyInteractiveDirections\\(document\\);").test(contentJs), "startup must initialize lazy message observation and process interactive targets first");
assert(/function applyInteractiveDirections\(root = document\) \{[\s\S]*?applyDirectionToComposer\(root\)[\s\S]*?applyDirectionToActiveEditables\(root\)[\s\S]*?applyDirectionToFocusedResponseChangeMenus\(root\)[\s\S]*?ensureDirectionControl\(\)/.test(contentJs), "composer, edit, popup, and controls must remain immediate");
assert(/function setMode\(mode, persist = true\) \{[\s\S]*?applyInteractiveDirections\(document\)[\s\S]*?applyDirectionToVisibleMessages\(document\)/.test(contentJs), "mode switches must update interactive and visible messages without processing all offscreen messages");
assert(/if \(addedElementCount > 8 \|\| addedLargeSubtree\) \{[\s\S]*?applyInteractiveDirections\(document\)[\s\S]*?applyDirectionToVisibleMessages\(document\)[\s\S]*?continue;/.test(contentJs), "large subtree additions must process interactive and visible messages lazily");
assert(/function scheduleCleanup\(\) \{[\s\S]*?scheduleIdleWork[\s\S]*?applyInteractiveDirections\(document\)[\s\S]*?applyDirectionToVisibleMessages\(document\)/.test(contentJs), "cleanup must be idle/debounced and avoid full message formatting");
assert(contentJs.includes("const detectedDirectionCache = new WeakMap()"), "detected direction WeakMap cache must exist");
assert(contentJs.includes("const elementTextSignatureCache = new WeakMap()"), "text signature WeakMap cache must exist");
assert(contentJs.includes("const tableLayoutDirectionCache = new WeakMap()"), "table layout WeakMap cache must exist");
assert(contentJs.includes("const tableCellDirectionCache = new WeakMap()"), "table cell WeakMap cache must exist");
assert(/function applyDirection\(element, kind, forcedDirection = null\) \{[\s\S]*?currentDir === direction[\s\S]*?missingClass[\s\S]*?return direction/.test(contentJs), "applyDirection must skip writes when dir/classes already match");
assert(/function applyInlineDirectionStyle\(element, direction\) \{[\s\S]*?element\.style\.direction === direction[\s\S]*?return/.test(contentJs), "inline direction style writes must be skipped when unchanged");
assert(!contentJs.includes("function applyDirections(root = document, options = {}) {\n    try {\n      reconcileAppliedElements();"), "full reconciliation must not run unconditionally for every apply pass");
assert(new RegExp("if \\(options\\.fullReconcile\\) \\{\\s*reconcileAppliedElements\\(\\);\\s*\\}").test(contentJs), "full reconciliation must be gated by applyDirections options");
assert(/function directionForTableCell\(cellElement\) \{[\s\S]*?cachedDirectionForTableCell\(cellElement\)/.test(contentJs), "table cell direction must use cached detection per cell");
assert(/function cachedDirectionForTableCell\(cellElement\) \{[\s\S]*?detectDirectionFromText\(cellElement\.textContent/.test(contentJs), "cached table cell helper must detect from cell text only after signature changes");
assert(/function applyDirectionToTableCells\(tableElement\) \{[\s\S]*?collectElementsOutsideCanvas\(tableElement, "th, td"\)/.test(contentJs), "table direction must be applied independently to th and td cells");
assert(/function directionForTableLayout\(tableElement\) \{[\s\S]*?cachedDirectionForTableLayout\(tableElement\)/.test(contentJs), "table layout direction must use cached detection");
assert(/function cachedDirectionForTableLayout\(tableElement\) \{[\s\S]*?tableHeaderText\(tableElement\)[\s\S]*?detectDirectionFromText/.test(contentJs), "table layout direction must be computed from headers/table text in Auto mode after signature changes");
assert(contentJs.includes('applyStableDirectionToTable(tableElement, layoutDirection)'), "computed table layout direction must be applied to the table element");
assert(new RegExp("function applyStableDirectionToTable\\(tableElement, direction\\) \\{\\s*applyDirection\\(tableElement, TABLE_CLASS, direction\\);\\s*\\}").test(contentJs), "table dir attribute must use computed layout direction through idempotent applyDirection");
assert(!contentJs.includes('tableElement.setAttribute("dir", "ltr")'), "table layout direction must not be hardcoded to LTR");
assert(contentCss.includes(".cgpt-dir-table"), "scoped table direction class must be styled");
assert(contentCss.includes(".cgpt-dir-table.cgpt-dir-rtl"), "RTL table layout class must be styled");
assert(contentCss.includes(".cgpt-dir-table.cgpt-dir-ltr"), "LTR table layout class must be styled");
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
