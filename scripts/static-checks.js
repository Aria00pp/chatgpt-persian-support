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
  "shouldSkipInlineBidiContainer",
  "isolateInlineBidiRuns",
  "wrapLatinRunsInTextNode",
  "wrapRtlRunsInTextNode"
]) {
  assert(contentJs.includes(`function ${helper}`), `helper missing: ${helper}`);
}

assert(contentJs.includes("chrome.storage.local"), "mode storage must continue using chrome.storage.local");
assert(contentJs.includes("createDirectionControl"), "direction control must still exist");
assert(contentJs.includes('document.createElement("bdi")'), "inline bidi wrapper must use bdi");
assert(contentCss.includes("cgpt-dir-inline-ltr"), "cgpt-dir-inline-ltr CSS class must exist");
assert(contentCss.includes("cgpt-dir-inline-rtl"), "cgpt-dir-inline-rtl CSS class must exist");
assert(contentJs.includes("!root.classList.contains(MESSAGE_CLASS)"), "inline wrapper must only process message targets");
assert(contentJs.includes("root.classList.contains(COMPOSER_CLASS)"), "inline wrapper must guard against composer text");
assert(contentJs.includes("COMPOSER_SELECTOR"), "inline skip selectors must include composer selector");

for (const selector of ["strong", "b", "em", "i", "span", "q", "a"]) {
  assert(contentCss.includes(selector), `inline formatting selector missing: ${selector}`);
}

for (const selector of ["pre", "code", "kbd", "samp", "textarea", "table", "math", ".katex", ".MathJax", "[role=\"grid\"]", "[role=\"treegrid\"]"]) {
  assert(contentCss.includes(selector) || contentJs.includes(selector), `technical exception missing: ${selector}`);
}

assert(!/^\s*(html|body|main)\b[^{]*\{[^}]*direction\s*:/m.test(contentCss), "must not globally set direction on html, body, or main");

console.log("static checks passed");
