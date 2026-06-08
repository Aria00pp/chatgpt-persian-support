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
  "isUserMessageEditComposer",
  "isActiveEditableComposer",
  "isLikelyChatEditable",
  "applyDirectionToActiveEditables",
  "getEditableDirectionTargets",
  "applyDirectionToEditableTree",
  "applyInlineDirectionStyle",
  "handleComposerFocus"
]) {
  assert(contentJs.includes(`function ${helper}`), `helper missing: ${helper}`);
}

assert(contentJs.includes("chrome.storage.local"), "mode storage must continue using chrome.storage.local");
assert(contentJs.includes("createDirectionControl"), "direction control must still exist");
assert(!contentJs.includes('document.createElement("bdi")'), "rendered message text must not be wrapped in bdi");
assert(!contentJs.includes("textNode.replaceWith"), "rendered message text nodes must not be replaced");
assert(!contentJs.includes("isolateInlineBidiRuns"), "JS inline bidi mutation pass must stay disabled");
assert(contentJs.includes('document.addEventListener("focusin", handleComposerFocus, true)'), "focusin handler must apply edit composer direction immediately");
assert(contentJs.includes("EDITABLE_DIRECTION_TARGET_SELECTOR"), "editable tree direction targets must be defined");
assert(contentJs.includes("applyDirectionToActiveEditables(root)"), "full apply pass must scan active editables");
assert(contentJs.includes("applyInlineDirectionStyle(target, direction)"), "inline style forcing must be scoped through editable tree targets");

for (const selector of ["strong", "b", "em", "i", "span", "q", "a"]) {
  assert(contentCss.includes(selector), `inline formatting selector missing: ${selector}`);
}

for (const selector of ["pre", "code", "kbd", "samp", "textarea", "table", "math", ".katex", ".MathJax", "[role=\"grid\"]", "[role=\"treegrid\"]"]) {
  assert(contentCss.includes(selector) || contentJs.includes(selector), `technical exception missing: ${selector}`);
}

assert(!/^\s*(html|body|main)\b[^{]*\{[^}]*direction\s*:/m.test(contentCss), "must not globally set direction on html, body, or main");

console.log("static checks passed");
