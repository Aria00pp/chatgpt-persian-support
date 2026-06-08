const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const hooks = {};
const context = vm.createContext({
  console,
  globalThis: { __CGPT_DIRECTION_TEST_HOOKS__: hooks }
});
context.globalThis.globalThis = context.globalThis;

vm.runInContext(fs.readFileSync("content.js", "utf8"), context, { filename: "content.js" });

assert.strictEqual(typeof hooks.textSignatureFor, "function", "text signature helper should be exported to smoke hooks");
assert.strictEqual(typeof hooks.cachedDirectionForTextElement, "function", "cached direction helper should be exported to smoke hooks");

let textReads = 0;
const element = {
  get textContent() {
    textReads += 1;
    return "PR 12: table direction برای cellها باید درست شود.";
  }
};

const first = hooks.cachedDirectionForTextElement(element, {});
const readsAfterFirst = textReads;
const second = hooks.cachedDirectionForTextElement(element, {});

assert.strictEqual(first, "rtl", "mixed English-prefix Persian text should resolve RTL");
assert.strictEqual(second, first, "cached direction should be stable for unchanged text");
assert.strictEqual(textReads, readsAfterFirst + 1, "second lookup should only read text for a cheap signature, not rescan via detection");

let cellText = "This cell is English.";
const cell = {
  get textContent() {
    return cellText;
  }
};
assert.strictEqual(hooks.cachedDirectionForTableCell(cell), "ltr", "English table cell should be LTR");
assert.strictEqual(hooks.cachedDirectionForTableCell(cell), "ltr", "unchanged table cell should reuse cached LTR");
cellText = "این سلول فارسی است.";
assert.strictEqual(hooks.cachedDirectionForTableCell(cell), "rtl", "changed table cell signature should recompute RTL");

console.log("cache smoke test passed");
