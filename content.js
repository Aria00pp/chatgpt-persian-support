(() => {
  "use strict";

  const STORAGE_KEY = "directionMode";
  const DEFAULT_MODE = "rtl";
  const MODES = ["auto", "rtl", "ltr"];
  const APPLIED_CLASS = "cgpt-dir-applied";
  const COMPOSER_CLASS = "cgpt-dir-composer";
  const MESSAGE_CLASS = "cgpt-dir-message";
  const CONTROL_CLASS = "cgpt-dir-control";
  const ACTIVE_CONTROL_CLASS = "cgpt-dir-control-active";
  const LEGACY_CLASSES = ["cgpt-rtl-applied", "cgpt-rtl-composer", "cgpt-rtl-message"];
  const DIRECTION_CLASSES = ["cgpt-dir-auto", "cgpt-dir-rtl", "cgpt-dir-ltr"];

  const COMPOSER_SELECTOR = [
    "#prompt-textarea",
    ".ProseMirror[contenteditable='true']",
    "div[contenteditable='true']",
    "textarea",
    "[role='textbox']"
  ].join(",");

  const MESSAGE_SELECTOR = [
    "[data-message-author-role='user']",
    "[data-message-author-role='assistant']",
    "main article"
  ].join(",");

  const EXCLUDED_UI_SELECTOR = [
    "[role='dialog']",
    "[aria-modal='true']",
    "nav",
    "aside",
    "header",
    "footer",
    "[role='menu']",
    "[role='listbox']",
    "[role='search']",
    "[role='searchbox']",
    "[role='combobox']",
    "[data-testid*='modal' i]",
    "[data-testid*='settings' i]",
    "[data-testid*='search' i]",
    "[data-testid*='filter' i]"
  ].join(",");

  const COMPOSER_CONTAINER_SELECTOR = [
    "form",
    "[data-testid*='composer' i]",
    "[data-testid*='prompt' i]"
  ].join(",");

  const COMPOSER_CONTROL_SELECTOR = [
    "button[type='submit']",
    "button[data-testid*='send' i]",
    "button[aria-label*='send' i]",
    "button[data-testid*='voice' i]",
    "button[aria-label*='voice' i]",
    "button[data-testid*='upload' i]",
    "button[aria-label*='upload' i]",
    "input[type='file']"
  ].join(",");

  const MESSAGE_PROSE_SELECTOR = ".markdown, .prose";
  const MESSAGE_TEXT_BLOCK_SELECTOR = [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "blockquote",
    "dl"
  ].join(",");

  const CONTROL_AREA_SELECTOR = [
    "button",
    "[role='button']",
    "[role='toolbar']",
    "[role='menu']",
    "[role='listbox']",
    "[data-testid*='copy' i]",
    "[data-testid*='feedback' i]"
  ].join(",");

  const TECHNICAL_SELECTOR = [
    "pre",
    "code",
    "kbd",
    "samp",
    "textarea",
    "table",
    "math",
    ".katex",
    ".MathJax",
    "[class*='code']",
    "[class*='Code']",
    "[class*='syntax']",
    "[class*='highlight']",
    "[class*='editor']",
    "[class*='Editor']",
    "[class*='terminal' i]",
    "[role='grid']",
    "[role='treegrid']"
  ].join(",");

  const pendingRoots = new Set();
  const originalDirections = new WeakMap();
  let selectedMode = DEFAULT_MODE;
  let fullScanScheduled = false;
  let scheduled = false;

  function elementsMatching(root, selector, includeClosest = false) {
    const matches = new Set();

    if (root instanceof Element) {
      if (root.matches(selector)) {
        matches.add(root);
      }

      if (includeClosest) {
        const closest = root.closest(selector);
        if (closest) {
          matches.add(closest);
        }
      }
    }

    if (root && typeof root.querySelectorAll === "function") {
      for (const element of root.querySelectorAll(selector)) {
        matches.add(element);
      }
    }

    return matches;
  }

  function normalizedInputHint(element) {
    return [
      element.getAttribute("aria-label"),
      element.getAttribute("placeholder"),
      element.getAttribute("data-placeholder"),
      element.getAttribute("name")
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function isExcludedUiArea(element) {
    if (element.closest(EXCLUDED_UI_SELECTOR)) {
      return true;
    }

    if (element.matches("input[type='search'], [role='searchbox'], [role='combobox']")) {
      return true;
    }

    return /\b(search|settings?|filter|find)\b|جستجو|تنظیمات|بحث|إعدادات/.test(
      normalizedInputHint(element)
    );
  }

  function getComposerContainer(element) {
    if (isExcludedUiArea(element)) {
      return null;
    }

    const container = element.closest(COMPOSER_CONTAINER_SELECTOR);
    if (!container || isExcludedUiArea(container) || !container.closest("main")) {
      return null;
    }

    return container;
  }

  function isLikelyComposerContainer(element) {
    if (element.id === "prompt-textarea" && element.closest("main") && !isExcludedUiArea(element)) {
      return true;
    }

    const container = getComposerContainer(element);
    if (!container) {
      return false;
    }

    const hasComposerControl = Boolean(container.querySelector(COMPOSER_CONTROL_SELECTOR));
    const hasMessageHint = /message|prompt|ask|chatgpt|پیام|پرسش|سؤال|سوال|بنویس|اكتب|رسالة/.test(
      normalizedInputHint(element)
    );
    const hasSemanticContainer = container.matches(
      "[data-testid*='composer' i], [data-testid*='prompt' i]"
    );

    return hasComposerControl || hasMessageHint || hasSemanticContainer;
  }

  function isMessageElement(element) {
    return element.matches(MESSAGE_SELECTOR);
  }

  function isComposerElement(element) {
    if (element.closest(`.${MESSAGE_CLASS}, [data-message-author-role], main article`)) {
      return false;
    }

    return isLikelyComposerContainer(element);
  }

  function topLevelTargets(elements) {
    return elements.filter((element, index) => (
      !elements.some((other, otherIndex) => otherIndex !== index && other.contains(element))
    ));
  }

  function getMessageTextTargets(messageElement) {
    const proseTargets = [...messageElement.querySelectorAll(MESSAGE_PROSE_SELECTOR)]
      .filter((element) => !element.closest(CONTROL_AREA_SELECTOR));

    if (proseTargets.length > 0) {
      return topLevelTargets(proseTargets);
    }

    const messageIdTargets = [...messageElement.querySelectorAll("[data-message-id]")]
      .filter((element) => (
        element.querySelector(MESSAGE_TEXT_BLOCK_SELECTOR) &&
        !element.querySelector(CONTROL_AREA_SELECTOR)
      ));

    if (messageIdTargets.length > 0) {
      return topLevelTargets(messageIdTargets);
    }

    const textBlockTargets = [...messageElement.querySelectorAll(MESSAGE_TEXT_BLOCK_SELECTOR)]
      .filter((element) => !element.closest(`${TECHNICAL_SELECTOR}, [role='toolbar'], [role='menu']`));

    if (textBlockTargets.length > 0) {
      return topLevelTargets(textBlockTargets);
    }

    const authorRoleTarget = messageElement.matches("[data-message-author-role]")
      ? messageElement
      : messageElement.querySelector("[data-message-author-role='user'], [data-message-author-role='assistant']");

    return [authorRoleTarget || messageElement];
  }

  function detectDirectionFromText(text) {
    for (const character of text || "") {
      if (/[\u0590-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(character)) {
        return "rtl";
      }

      if (/[A-Za-z]/.test(character)) {
        return "ltr";
      }
    }

    return "rtl";
  }

  function composerText(element) {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      return element.value;
    }

    return element.textContent || "";
  }

  function directionFor(element, kind) {
    if (selectedMode !== "auto") {
      return selectedMode;
    }

    return detectDirectionFromText(kind === COMPOSER_CLASS ? composerText(element) : element.textContent);
  }

  function clearDirectionClasses(element) {
    element.classList.remove(...DIRECTION_CLASSES, ...LEGACY_CLASSES);
  }

  function applyDirection(element, kind) {
    const direction = directionFor(element, kind);
    if (!originalDirections.has(element)) {
      originalDirections.set(element, element.getAttribute("dir"));
    }
    clearDirectionClasses(element);
    element.classList.add(APPLIED_CLASS, kind, `cgpt-dir-${selectedMode}`, `cgpt-dir-${direction}`);
    element.setAttribute("dir", direction);
  }

  function removeDirection(element) {
    const hadDirectionClass = element.classList.contains(APPLIED_CLASS) ||
      LEGACY_CLASSES.some((className) => element.classList.contains(className));

    element.classList.remove(APPLIED_CLASS, COMPOSER_CLASS, MESSAGE_CLASS, ...DIRECTION_CLASSES, ...LEGACY_CLASSES);
    if (hadDirectionClass && originalDirections.has(element)) {
      const originalDirection = originalDirections.get(element);
      if (originalDirection === null) {
        element.removeAttribute("dir");
      } else {
        element.setAttribute("dir", originalDirection);
      }
      originalDirections.delete(element);
    } else if (hadDirectionClass) {
      element.removeAttribute("dir");
    }
  }

  function applyDirectionToComposer(root = document) {
    for (const element of elementsMatching(root, COMPOSER_SELECTOR, true)) {
      if (isComposerElement(element)) {
        applyDirection(element, COMPOSER_CLASS);
      }
    }
  }

  function applyDirectionToMessages(root = document) {
    for (const messageElement of elementsMatching(root, MESSAGE_SELECTOR, true)) {
      if (!isMessageElement(messageElement)) {
        continue;
      }

      for (const target of getMessageTextTargets(messageElement)) {
        applyDirection(target, MESSAGE_CLASS);
      }
    }
  }

  function createDirectionControl() {
    const control = document.createElement("div");
    control.className = CONTROL_CLASS;
    control.setAttribute("role", "group");
    control.setAttribute("aria-label", "Writing direction");

    for (const mode of MODES) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.directionMode = mode;
      button.textContent = mode === "auto" ? "Auto" : mode.toUpperCase();
      button.title = `Use ${button.textContent} writing direction`;
      button.setAttribute("aria-label", button.title);
      button.addEventListener("click", () => setMode(mode));
      control.append(button);
    }

    return control;
  }

  function updateControlState() {
    for (const button of document.querySelectorAll(`.${CONTROL_CLASS} button[data-direction-mode]`)) {
      const active = button.dataset.directionMode === selectedMode;
      button.classList.toggle(ACTIVE_CONTROL_CLASS, active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function ensureDirectionControl() {
    const composers = [...document.querySelectorAll(COMPOSER_SELECTOR)].filter(isComposerElement);
    const composer = composers[0];
    if (!composer) {
      return;
    }

    const container = getComposerContainer(composer) || composer;
    const anchor = container.closest("form") || container;
    const parent = anchor.parentElement;
    if (!parent || anchor.closest("[data-message-author-role], main article") || isExcludedUiArea(anchor)) {
      return;
    }

    const controls = [...document.querySelectorAll(`.${CONTROL_CLASS}`)];
    const control = controls.shift() || createDirectionControl();
    for (const duplicate of controls) {
      duplicate.remove();
    }

    if (control.parentElement !== parent || control.nextElementSibling !== anchor) {
      parent.insertBefore(control, anchor);
    }
    updateControlState();
  }

  function reconcileAppliedElements() {
    const currentTargets = new Set();

    for (const composer of document.querySelectorAll(COMPOSER_SELECTOR)) {
      if (isComposerElement(composer)) {
        currentTargets.add(composer);
      }
    }

    for (const message of document.querySelectorAll(MESSAGE_SELECTOR)) {
      if (isMessageElement(message)) {
        for (const target of getMessageTextTargets(message)) {
          currentTargets.add(target);
        }
      }
    }

    const appliedSelector = [`.${APPLIED_CLASS}`, ...LEGACY_CLASSES.map((name) => `.${name}`)].join(",");
    for (const element of document.querySelectorAll(appliedSelector)) {
      if (!currentTargets.has(element)) {
        removeDirection(element);
      }
    }
  }

  function applyDirections(root = document) {
    try {
      reconcileAppliedElements();
      applyDirectionToComposer(root);
      applyDirectionToMessages(root);
      ensureDirectionControl();
    } catch (_error) {
      // ChatGPT can replace DOM subtrees while they are being inspected. A future
      // mutation or route event will retry without interrupting the page.
    }
  }

  function scheduleApply(root = document) {
    if (root === document || root === document.documentElement) {
      fullScanScheduled = true;
      pendingRoots.clear();
    } else if (!fullScanScheduled && root instanceof Element) {
      pendingRoots.add(root);
    }

    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;

      if (fullScanScheduled) {
        fullScanScheduled = false;
        pendingRoots.clear();
        applyDirections(document);
        return;
      }

      const roots = [...pendingRoots];
      pendingRoots.clear();
      for (const pendingRoot of roots) {
        applyDirections(pendingRoot.isConnected ? pendingRoot : document);
      }
    });
  }

  function saveMode() {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: selectedMode });
    }
  }

  function setMode(mode, persist = true) {
    if (!MODES.includes(mode)) {
      return;
    }

    selectedMode = mode;
    if (persist) {
      saveMode();
    }

    updateControlState();
    scheduleApply(document);
  }

  function loadMode() {
    if (!chrome.storage || !chrome.storage.local) {
      scheduleApply(document);
      return;
    }

    chrome.storage.local.get(STORAGE_KEY, (stored) => {
      const storedMode = stored && stored[STORAGE_KEY];
      setMode(MODES.includes(storedMode) ? storedMode : DEFAULT_MODE, false);
    });
  }

  function handleComposerInput(event) {
    const composer = event.target instanceof Element ? event.target.closest(COMPOSER_SELECTOR) : null;
    if (composer && isComposerElement(composer) && selectedMode === "auto") {
      applyDirection(composer, COMPOSER_CLASS);
    }
  }

  function handleKeyboardShortcut(event) {
    const composer = event.target instanceof Element ? event.target.closest(COMPOSER_SELECTOR) : null;
    if (!composer || !isComposerElement(composer) || !event.ctrlKey) {
      return;
    }

    let mode = null;
    if (event.code === "ShiftRight") {
      mode = "rtl";
    } else if (event.code === "ShiftLeft") {
      mode = "ltr";
    } else if (event.shiftKey && event.code === "KeyA") {
      mode = "auto";
    }

    if (mode) {
      event.preventDefault();
      setMode(mode);
    }
  }

  function startObserver() {
    const target = document.documentElement;
    if (!target) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" || mutation.addedNodes.length > 0) {
          scheduleApply(mutation.target instanceof Element ? mutation.target : mutation.target.parentElement);
        }
      }
    });

    observer.observe(target, { childList: true, characterData: true, subtree: true });
  }

  function watchRouteChanges() {
    window.addEventListener("popstate", () => scheduleApply(document));
    window.addEventListener("pageshow", () => scheduleApply(document));

    for (const method of ["pushState", "replaceState"]) {
      const original = history[method];
      if (typeof original !== "function" || original.__cgptDirectionWrapped) {
        continue;
      }

      const wrapped = function (...args) {
        const result = original.apply(this, args);
        scheduleApply(document);
        return result;
      };

      Object.defineProperty(wrapped, "__cgptDirectionWrapped", { value: true });
      history[method] = wrapped;
    }
  }

  applyDirections(document);
  loadMode();
  document.addEventListener("input", handleComposerInput, true);
  document.addEventListener("keydown", handleKeyboardShortcut, true);
  startObserver();
  watchRouteChanges();
})();
