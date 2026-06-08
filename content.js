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

  const EDIT_RETRY_CONTAINER_SELECTOR = [
    "form",
    "[data-testid*='edit' i]",
    "[data-testid*='composer' i]",
    "[data-testid*='prompt' i]",
    "[data-testid*='retry' i]",
    "[data-testid*='regenerate' i]"
  ].join(",");

  const COMPOSER_CONTROL_SELECTOR = [
    "button[type='submit']",
    "button[data-testid*='send' i]",
    "button[aria-label*='send' i]",
    "button[data-testid*='submit' i]",
    "button[aria-label*='submit' i]",
    "button[data-testid*='save' i]",
    "button[aria-label*='save' i]",
    "button[data-testid*='update' i]",
    "button[aria-label*='update' i]",
    "button[data-testid*='confirm' i]",
    "button[aria-label*='confirm' i]",
    "button[data-testid*='done' i]",
    "button[aria-label*='done' i]",
    "button[data-testid*='retry' i]",
    "button[aria-label*='retry' i]",
    "button[data-testid*='regenerate' i]",
    "button[aria-label*='regenerate' i]",
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

  const EDIT_COMPOSER_EXCLUDED_SELECTOR = [
    "pre",
    "code",
    "kbd",
    "samp",
    "table",
    "math",
    ".katex",
    ".MathJax",
    "[class*='code']",
    "[class*='Code']",
    "[class*='syntax']",
    "[class*='highlight']",
    "[class*='terminal' i]",
    "[role='grid']",
    "[role='treegrid']"
  ].join(",");

  const EDITABLE_DIRECTION_TARGET_SELECTOR = [
    ".ProseMirror",
    ".ProseMirror[contenteditable='true']",
    "[contenteditable='true']",
    "[role='textbox']",
    "textarea",
    "p",
    "[data-placeholder]"
  ].join(",");

  const RESPONSE_CHANGE_CONTEXT_SELECTOR = [
    "form",
    "[role='menu']",
    "[role='dialog']",
    "[role='alertdialog']",
    "[popover]",
    "[data-testid*='menu' i]",
    "[data-testid*='popover' i]",
    "[data-testid*='retry' i]",
    "[data-testid*='regenerate' i]",
    "[data-radix-menu-content]",
    "[data-radix-popper-content-wrapper]"
  ].join(",");

  const ASK_TO_CHANGE_RESPONSE_RE = /ask\s+to\s+change\s+(?:the\s+)?response|change\s+(?:the\s+)?response|تغییر[^\n]{0,40}پاسخ|پاسخ[^\n]{0,40}(?:تغییر|اصلاح|ویرایش|عوض)|غيّر[^\n]{0,40}الرد|تغيير[^\n]{0,40}الرد|الرد[^\n]{0,40}(?:تغيير|تعديل)/i;
  const RESPONSE_CHANGE_CONTEXT_RE = /try\s+again|search\s+(?:the\s+)?web|change\s+(?:the\s+)?response|تلاش[^\n]{0,20}دوباره|دوباره[^\n]{0,20}تلاش|جست(?:جو|وجو)[^\n]{0,20}وب|وب[^\n]{0,20}جست(?:جو|وجو)|تغییر[^\n]{0,40}پاسخ|پاسخ[^\n]{0,40}(?:تغییر|اصلاح|ویرایش|عوض)|حاول[^\n]{0,20}مرة|البحث[^\n]{0,20}الويب|الرد[^\n]{0,40}(?:تغيير|تعديل)/i;

  const pendingRoots = new Set();
  const originalDirections = new WeakMap();
  const originalInlineStyles = new WeakMap();
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
      element.id,
      element.getAttribute("aria-label"),
      element.getAttribute("placeholder"),
      element.getAttribute("data-placeholder"),
      element.getAttribute("data-testid"),
      element.getAttribute("name"),
      element.getAttribute("type")
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function normalizedContextHint(element, container) {
    const hints = [normalizedInputHint(element)];
    let current = element.parentElement;

    while (current && current !== container.parentElement) {
      hints.push(normalizedInputHint(current));
      if (current === container) {
        break;
      }
      current = current.parentElement;
    }

    for (const control of container.querySelectorAll("button, [role='button'], input[type='submit']")) {
      hints.push(normalizedInputHint(control), control.textContent || "");
    }

    return hints.filter(Boolean).join(" ").toLowerCase();
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

  function isPromptLikeEditable(element, allowExcludedUiArea = false) {
    if (!element.matches(COMPOSER_SELECTOR) || (!allowExcludedUiArea && isExcludedUiArea(element))) {
      return false;
    }

    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      return !element.disabled && !element.readOnly && element.type !== "search";
    }

    return element.isContentEditable || element.getAttribute("role") === "textbox";
  }

  function elementOwnText(element, includeTextContent = true) {
    return [
      element.getAttribute("aria-label"),
      element.getAttribute("placeholder"),
      element.getAttribute("data-placeholder"),
      element.getAttribute("title"),
      element.getAttribute("data-testid"),
      includeTextContent ? element.textContent : ""
    ].filter(Boolean).join(" ");
  }

  function responseChangeContainerFor(element) {
    const semanticContainer = element.closest(RESPONSE_CHANGE_CONTEXT_SELECTOR);
    if (semanticContainer) {
      return semanticContainer;
    }

    let current = element.parentElement;
    for (let depth = 0; current && depth < 4; depth += 1) {
      if (current.querySelector(COMPOSER_CONTROL_SELECTOR)) {
        return current;
      }
      current = current.parentElement;
    }

    return element.parentElement;
  }

  function isAskToChangeResponseInput(element) {
    return isPromptLikeEditable(element, true) &&
      isVisibleConnected(element) &&
      ASK_TO_CHANGE_RESPONSE_RE.test(elementOwnText(element, false));
  }

  function hasResponseChangeContext(element) {
    if (!isPromptLikeEditable(element, true) || !isVisibleConnected(element)) {
      return false;
    }

    const container = responseChangeContainerFor(element);
    if (!container || container.closest("nav, aside, header, footer, [role='search'], [role='searchbox'], [role='combobox'], [role='listbox'], [data-testid*='settings' i], [data-testid*='search' i], [data-testid*='filter' i]")) {
      return false;
    }

    const nearbyText = [elementOwnText(element), container.textContent || ""].join(" ").slice(0, 4000);
    const hasContextSignal = RESPONSE_CHANGE_CONTEXT_RE.test(nearbyText);
    const hasSendControl = Boolean(container.querySelector(COMPOSER_CONTROL_SELECTOR));

    return hasContextSignal && (hasSendControl || ASK_TO_CHANGE_RESPONSE_RE.test(nearbyText));
  }

  function isResponseChangeComposer(element) {
    if (!isPromptLikeEditable(element, true) || !isVisibleConnected(element)) {
      return false;
    }

    if (element.matches("input[type='search'], [role='searchbox'], [role='combobox']") ||
        element.closest("nav, aside, header, footer, [role='listbox'], [role='combobox'], [data-testid*='settings' i], [data-testid*='search' i], [data-testid*='filter' i]")) {
      return false;
    }

    return isAskToChangeResponseInput(element) || hasResponseChangeContext(element);
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

  function hasPromptContext(element, container) {
    const contextHint = normalizedContextHint(element, container);
    const hasComposerControl = Boolean(container.querySelector(COMPOSER_CONTROL_SELECTOR));
    const hasMessageHint = /message|prompt|ask|chatgpt|reply|write|پیام|پرسش|سؤال|سوال|بنویس|اكتب|رسالة/.test(
      contextHint
    );
    const hasSemanticContainer = container.matches(
      "[data-testid*='composer' i], [data-testid*='prompt' i]"
    );

    return hasComposerControl || hasMessageHint || hasSemanticContainer;
  }

  function isMainComposer(element) {
    if (!isPromptLikeEditable(element)) {
      return false;
    }

    if (element.closest("[data-message-author-role], main article")) {
      return false;
    }

    if (element.id === "prompt-textarea" && element.closest("main")) {
      return true;
    }

    const container = getComposerContainer(element);
    return Boolean(container && hasPromptContext(element, container));
  }

  function isVisibleConnected(element) {
    return Boolean(element.isConnected && (element.getClientRects().length > 0 || element.offsetParent));
  }

  function isInUserMessageArea(element) {
    if (element.closest("[data-message-author-role='user']")) {
      return true;
    }

    const article = element.closest("main article");
    return Boolean(
      article &&
      article.querySelector("[data-message-author-role='user']") &&
      !article.querySelector("[data-message-author-role='assistant']")
    );
  }

  function isUserMessageEditComposer(element) {
    if (!isPromptLikeEditable(element) || !isVisibleConnected(element) || !isInUserMessageArea(element)) {
      return false;
    }

    if (element.closest(`${EXCLUDED_UI_SELECTOR}, ${CONTROL_AREA_SELECTOR}, .${CONTROL_CLASS}`)) {
      return false;
    }

    if (element.closest(EDIT_COMPOSER_EXCLUDED_SELECTOR)) {
      return false;
    }

    return true;
  }

  function hasActiveEditControls(element) {
    const container = element.closest(EDIT_RETRY_CONTAINER_SELECTOR) || element.parentElement;
    if (!container || isExcludedUiArea(container)) {
      return false;
    }

    return Boolean(container.querySelector(COMPOSER_CONTROL_SELECTOR));
  }

  function isFocusedWithin(element) {
    const active = document.activeElement;
    return Boolean(active && (element === active || element.contains(active)));
  }

  function isLikelyChatEditable(element) {
    if (!isPromptLikeEditable(element) || !isVisibleConnected(element) || isMainComposer(element)) {
      return false;
    }

    if (!element.closest("main") || isExcludedUiArea(element)) {
      return false;
    }

    if (element.closest(`${EXCLUDED_UI_SELECTOR}, ${CONTROL_AREA_SELECTOR}, .${CONTROL_CLASS}`)) {
      return false;
    }

    if (element.closest(EDIT_COMPOSER_EXCLUDED_SELECTOR)) {
      return false;
    }

    if (isFocusedWithin(element) || hasActiveEditControls(element)) {
      return true;
    }

    return Boolean(
      element.matches("textarea, [contenteditable='true'], [role='textbox']") &&
      !element.closest("[data-message-author-role='assistant'] .markdown, [data-message-author-role='assistant'] .prose")
    );
  }

  function isActiveEditableComposer(element) {
    return isUserMessageEditComposer(element) || isLikelyChatEditable(element) || isResponseChangeComposer(element);
  }

  function isInlineEditComposer(element) {
    if (isUserMessageEditComposer(element)) {
      return true;
    }

    if (!isPromptLikeEditable(element)) {
      return false;
    }

    const article = element.closest("main article, [data-message-author-role]");
    if (!article || isExcludedUiArea(article) || !isInUserMessageArea(element)) {
      return false;
    }

    const container = element.closest(EDIT_RETRY_CONTAINER_SELECTOR) || article;
    const contextHint = normalizedContextHint(element, container);
    const hasEditSignal = /\b(edit|editing|update|save|submit|send|confirm|done|cancel|message|prompt)\b|ویرایش|ذخیره|ارسال|لغو|پیام/.test(
      contextHint
    );
    const hasEditControls = Boolean(container.querySelector(COMPOSER_CONTROL_SELECTOR));
    const closeToEditForm = Boolean(element.closest("form")) && hasEditControls;

    return hasEditSignal && (hasEditControls || closeToEditForm || container !== article);
  }

  function isRetryComposer(element) {
    if (!isPromptLikeEditable(element)) {
      return false;
    }

    const container = element.closest(EDIT_RETRY_CONTAINER_SELECTOR) || getComposerContainer(element);
    if (!container || !container.closest("main") || isExcludedUiArea(container)) {
      return false;
    }

    const contextHint = normalizedContextHint(element, container);
    const hasRetrySignal = /\b(retry|regenerate|again|resubmit|submit|send|prompt|message)\b|تلاش|دوباره|بازسازی|ارسال|پیام/.test(
      contextHint
    );

    return hasRetrySignal && Boolean(container.querySelector(COMPOSER_CONTROL_SELECTOR));
  }

  function isLikelyComposerContainer(element) {
    return isMainComposer(element) || isInlineEditComposer(element) || isRetryComposer(element) || isResponseChangeComposer(element);
  }

  function isMessageElement(element) {
    return element.matches(MESSAGE_SELECTOR);
  }

  function isComposerElement(element) {
    return isMainComposer(element) || isInlineEditComposer(element) || isRetryComposer(element) || isResponseChangeComposer(element) || isActiveEditableComposer(element);
  }

  function topLevelTargets(elements) {
    return elements.filter((element, index) => (
      !elements.some((other, otherIndex) => otherIndex !== index && other.contains(element))
    ));
  }

  function getMessageTextTargets(messageElement) {
    const proseTargets = [...messageElement.querySelectorAll(MESSAGE_PROSE_SELECTOR)]
      .filter((element) => !element.closest(`${CONTROL_AREA_SELECTOR}, ${COMPOSER_SELECTOR}`));

    if (proseTargets.length > 0) {
      return topLevelTargets(proseTargets);
    }

    const messageIdTargets = [...messageElement.querySelectorAll("[data-message-id]")]
      .filter((element) => (
        element.querySelector(MESSAGE_TEXT_BLOCK_SELECTOR) &&
        !element.querySelector(CONTROL_AREA_SELECTOR) &&
        !element.querySelector(COMPOSER_SELECTOR)
      ));

    if (messageIdTargets.length > 0) {
      return topLevelTargets(messageIdTargets);
    }

    const textBlockTargets = [...messageElement.querySelectorAll(MESSAGE_TEXT_BLOCK_SELECTOR)]
      .filter((element) => !element.closest(`${TECHNICAL_SELECTOR}, ${COMPOSER_SELECTOR}, [role='toolbar'], [role='menu']`));

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

  function applyDirection(element, kind, forcedDirection = null) {
    const direction = forcedDirection || directionFor(element, kind);
    if (!originalDirections.has(element)) {
      originalDirections.set(element, element.getAttribute("dir"));
    }
    clearDirectionClasses(element);
    element.classList.add(APPLIED_CLASS, kind, `cgpt-dir-${selectedMode}`, `cgpt-dir-${direction}`);
    element.setAttribute("dir", direction);
    return direction;
  }

  function applyInlineDirectionStyle(element, direction) {
    if (!originalInlineStyles.has(element)) {
      originalInlineStyles.set(element, {
        direction: element.style.direction,
        textAlign: element.style.textAlign
      });
    }

    element.style.direction = direction;
    element.style.textAlign = direction === "rtl" ? "right" : "left";
  }

  function restoreInlineDirectionStyle(element) {
    if (!originalInlineStyles.has(element)) {
      return;
    }

    const originalStyle = originalInlineStyles.get(element);
    element.style.direction = originalStyle.direction;
    element.style.textAlign = originalStyle.textAlign;
    originalInlineStyles.delete(element);
  }

  function getEditableDirectionTargets(element) {
    const targets = new Set();
    if (element.matches(EDITABLE_DIRECTION_TARGET_SELECTOR)) {
      targets.add(element);
    }

    if (typeof element.querySelectorAll === "function") {
      for (const target of element.querySelectorAll(EDITABLE_DIRECTION_TARGET_SELECTOR)) {
        if (!target.closest(`${CONTROL_AREA_SELECTOR}, ${EDIT_COMPOSER_EXCLUDED_SELECTOR}, .${CONTROL_CLASS}`)) {
          targets.add(target);
        }
      }
    }

    return targets;
  }

  function applyDirectionToEditableTree(element, direction) {
    for (const target of getEditableDirectionTargets(element)) {
      applyDirection(target, COMPOSER_CLASS, direction);
      applyInlineDirectionStyle(target, direction);
    }
  }

  function applyDirectionToActiveEditables(root = document) {
    for (const element of elementsMatching(root, COMPOSER_SELECTOR, true)) {
      if (isActiveEditableComposer(element)) {
        const direction = applyDirection(element, COMPOSER_CLASS);
        applyDirectionToEditableTree(element, direction);
      }
    }
  }

  function removeDirection(element) {
    const hadDirectionClass = element.classList.contains(APPLIED_CLASS) ||
      LEGACY_CLASSES.some((className) => element.classList.contains(className));

    restoreInlineDirectionStyle(element);
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
        const direction = applyDirection(element, COMPOSER_CLASS);
        applyDirectionToEditableTree(element, direction);
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
    const composers = [...document.querySelectorAll(COMPOSER_SELECTOR)].filter(isMainComposer);
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
        for (const target of getEditableDirectionTargets(composer)) {
          currentTargets.add(target);
        }
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
      applyDirectionToActiveEditables(root);
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
      const direction = applyDirection(composer, COMPOSER_CLASS);
      applyDirectionToEditableTree(composer, direction);
    }
  }

  function handleComposerFocus(event) {
    const composer = event.target instanceof Element ? event.target.closest(COMPOSER_SELECTOR) : null;
    if (composer && isComposerElement(composer)) {
      const direction = applyDirection(composer, COMPOSER_CLASS);
      applyDirectionToEditableTree(composer, direction);
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
  document.addEventListener("focusin", handleComposerFocus, true);
  document.addEventListener("keydown", handleKeyboardShortcut, true);
  startObserver();
  watchRouteChanges();
})();
