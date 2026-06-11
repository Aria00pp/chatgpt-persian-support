(() => {
  "use strict";

  const STORAGE_KEY = "directionMode";
  const DEFAULT_MODE = "rtl";
  const MODES = ["auto", "rtl", "ltr"];
  const APPLIED_CLASS = "cgpt-dir-applied";
  const COMPOSER_CLASS = "cgpt-dir-composer";
  const MESSAGE_CLASS = "cgpt-dir-message";
  const TABLE_CLASS = "cgpt-dir-table";
  const TABLE_CELL_CLASS = "cgpt-dir-table-cell";
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
    "input",
    "p",
    "[data-placeholder]"
  ].join(",");

  const EDITABLE_BLOCK_SELECTOR = [
    "p",
    "div",
    "li",
    "blockquote",
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
  const RESPONSE_CHANGE_MENU_ITEM_RE = /try\s+again|search\s+(?:the\s+)?web|تلاش[^\n]{0,20}دوباره|دوباره[^\n]{0,20}تلاش|جست(?:جو|وجو)[^\n]{0,20}وب|وب[^\n]{0,20}جست(?:جو|وجو)|حاول[^\n]{0,20}مرة|البحث[^\n]{0,20}الويب/i;
  const RESPONSE_CHANGE_MENU_SELECTOR = [
    "[role='menu']",
    "[role='dialog']",
    "[role='alertdialog']",
    "[popover]",
    "[data-testid*='menu' i]",
    "[data-testid*='popover' i]",
    "[data-radix-menu-content]",
    "[data-radix-popper-content-wrapper]"
  ].join(",");


  const CANVAS_DOCUMENT_SIGNAL_SELECTOR = [
    "[data-testid*='canvas' i]",
    "[data-testid*='artifact' i]",
    "[data-testid*='document-preview' i]",
    "[data-testid*='document_preview' i]",
    "[aria-label*='canvas' i]",
    "[aria-label*='document preview' i]",
    "[class*='canvas' i]",
    "[class*='artifact' i]",
    "[class*='document-preview' i]"
  ].join(",");

  const STRUCTURAL_CANVAS_CANDIDATE_SELECTOR = [
    "div",
    "section",
    "article",
    "[role='document']",
    "[role='region']",
    "[role='main']"
  ].join(",");

  const CANVAS_DOCUMENT_EXCLUDED_ANCESTOR_SELECTOR = [
    "nav",
    "aside",
    "header",
    "footer",
    "[role='dialog']",
    "[aria-modal='true']",
    "[role='menu']",
    "[role='listbox']"
  ].join(",");

  const CANVAS_DOCUMENT_SIMPLE_BLOCK_SELECTOR = [
    "p",
    "li",
    "blockquote",
    "pre",
    "code",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6"
  ].join(",");

  const CANVAS_DOCUMENT_BLOCK_CHILD_SELECTOR = "p, div, section, article, ul, ol, blockquote, h1, h2, h3, h4, h5, h6";

  const MESSAGE_OBSERVER_ROOT_MARGIN = "1200px 0px";
  const MESSAGE_OBSERVER_MARGIN_PX = 1200;
  const MAX_MESSAGES_PER_FRAME = 6;

  const pendingRoots = new Set();
  const originalDirections = new WeakMap();
  const originalInlineStyles = new WeakMap();
  const detectedDirectionCache = new WeakMap();
  const elementTextSignatureCache = new WeakMap();
  const tableLayoutDirectionCache = new WeakMap();
  const tableCellDirectionCache = new WeakMap();
  const structuralCanvasDetectionCache = new WeakMap();
  let selectedMode = DEFAULT_MODE;
  let debugEnabled = false;
  let fullScanScheduled = false;
  let scheduled = false;
  let cleanupScheduled = false;
  let messageObserver = null;
  let directionQueueScheduled = false;
  let perfStats = null;
  const messageDirectionQueue = new Set();
  const observedMessages = new WeakSet();


  function assistantMessageContainerFor(element) {
    if (!(element instanceof Element)) {
      return null;
    }

    const authorMessage = element.closest("[data-message-author-role]");
    if (authorMessage) {
      return authorMessage.matches("[data-message-author-role='assistant']") ? authorMessage : null;
    }

    const article = element.closest("main article");
    if (!article || article.querySelector("[data-message-author-role='user']")) {
      return null;
    }

    return article.querySelector("[data-message-author-role='assistant']") ? article : null;
  }

  function directDocumentBlockChildCount(element) {
    let count = 0;
    for (const child of element.children) {
      if (child.matches(CANVAS_DOCUMENT_BLOCK_CHILD_SELECTOR)) {
        count += 1;
      }
    }
    return count;
  }

  function hasScrollableCanvasPanelStructure(element) {
    const style = window.getComputedStyle ? window.getComputedStyle(element) : null;
    const overflowValue = style ? `${style.overflow} ${style.overflowY} ${style.overflowX}` : "";
    const hasScrollableOverflow = /auto|scroll/i.test(overflowValue) && (
      element.scrollHeight > element.clientHeight + 24 ||
      element.scrollWidth > element.clientWidth + 24
    );
    const hasPanelRole = element.matches("[role='document'], [role='region'], [role='main']");
    const classHint = String(element.className || "");
    const hasPanelClass = /(?:^|[-_\s])(overflow|scroll|panel|card|sheet|document|preview|rounded|border|shadow|h-full|max-h|w-full|flex|grid)(?:$|[-_\s])/i.test(classHint);

    return hasScrollableOverflow || hasPanelRole || hasPanelClass;
  }

  function hasLocalCanvasControls(element) {
    return [...element.querySelectorAll("button, [role='button'], [role='toolbar'], [aria-label], svg")]
      .some((control) => !control.closest("pre, code, table"));
  }

  function hasDocumentLikeCanvasStructure(element) {
    const directBlockCount = directDocumentBlockChildCount(element);
    const nestedBlockCount = element.querySelectorAll(CANVAS_DOCUMENT_BLOCK_CHILD_SELECTOR).length;
    const hasHeadingAndParagraph = Boolean(element.querySelector("h1, h2, h3")) && Boolean(element.querySelector("p, ul, ol"));
    const hasMultipleSections = element.querySelectorAll("section, article").length >= 2;

    return directBlockCount >= 2 || nestedBlockCount >= 5 || hasHeadingAndParagraph || hasMultipleSections;
  }

  function isStructuralCanvasDocumentBlock(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const textLength = (element.textContent || "").replace(/\s+/g, " ").trim().length;
    const signature = [
      textLength,
      element.childElementCount,
      element.scrollHeight,
      element.clientHeight,
      String(element.className || "")
    ].join(":");
    const cached = structuralCanvasDetectionCache.get(element);
    if (cached && cached.signature === signature) {
      return cached.result;
    }

    const messageElement = assistantMessageContainerFor(element);
    const result = Boolean(
      messageElement &&
      element !== messageElement &&
      !element.matches(MESSAGE_SELECTOR) &&
      !element.matches(CANVAS_DOCUMENT_SIMPLE_BLOCK_SELECTOR) &&
      !element.closest(CANVAS_DOCUMENT_EXCLUDED_ANCESTOR_SELECTOR) &&
      (!element.matches(MESSAGE_PROSE_SELECTOR) || hasScrollableCanvasPanelStructure(element)) &&
      textLength >= 240 &&
      hasDocumentLikeCanvasStructure(element) &&
      (hasLocalCanvasControls(element) || hasScrollableCanvasPanelStructure(element))
    );

    structuralCanvasDetectionCache.set(element, { signature, result });
    return result;
  }

  function structuralCanvasCandidatesFor(messageElement) {
    const root = assistantMessageContainerFor(messageElement);
    if (!root || !(messageElement instanceof Element)) {
      return [];
    }

    const searchRoot = root.contains(messageElement) ? messageElement : root;
    const candidates = [...searchRoot.querySelectorAll(STRUCTURAL_CANVAS_CANDIDATE_SELECTOR)]
      .filter((element) => isStructuralCanvasDocumentBlock(element));
    return topLevelTargets(candidates);
  }

  function isCanvasDocumentBlock(element) {
    return Boolean(
      element instanceof Element &&
      !element.matches(MESSAGE_SELECTOR) &&
      (element.matches(CANVAS_DOCUMENT_SIGNAL_SELECTOR) || isStructuralCanvasDocumentBlock(element))
    );
  }

  function canvasDocumentContainerFor(element) {
    if (!(element instanceof Element)) {
      return null;
    }

    const selectorContainer = element.closest(CANVAS_DOCUMENT_SIGNAL_SELECTOR);
    if (selectorContainer) {
      return selectorContainer;
    }

    const messageElement = assistantMessageContainerFor(element);
    if (!messageElement) {
      return null;
    }

    let current = element;
    while (current && current !== messageElement.parentElement) {
      if (isStructuralCanvasDocumentBlock(current)) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  function isInsideCanvasDocumentBlock(element) {
    return Boolean(canvasDocumentContainerFor(element));
  }

  function containsCanvasDocumentBlock(element) {
    return Boolean(
      element instanceof Element &&
      (
        isCanvasDocumentBlock(element) ||
        element.querySelector(CANVAS_DOCUMENT_SIGNAL_SELECTOR) ||
        structuralCanvasCandidatesFor(element).length > 0
      )
    );
  }

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
    const candidates = [];
    let current = element.parentElement;

    for (let depth = 0; current && depth < 8; depth += 1) {
      if (current.matches("nav, aside, header, footer, [role='search'], [role='searchbox'], [role='combobox'], [role='listbox'], [data-testid*='settings' i], [data-testid*='search' i], [data-testid*='filter' i]")) {
        break;
      }

      candidates.push(current);
      current = current.parentElement;
    }

    const menuSignaled = candidates.find(hasResponseChangeMenuSignals);
    if (menuSignaled) {
      return menuSignaled;
    }

    const semanticContainer = candidates.find((candidate) => candidate.matches(RESPONSE_CHANGE_CONTEXT_SELECTOR));
    if (semanticContainer) {
      return semanticContainer;
    }

    const controlContainer = candidates.find((candidate) => candidate.querySelector(COMPOSER_CONTROL_SELECTOR));
    return controlContainer || candidates[0] || element.parentElement;
  }

  function hasResponseChangeMenuSignals(container) {
    if (!container) {
      return false;
    }

    const contextText = [elementOwnText(container), container.textContent || ""].join(" ").slice(0, 5000);
    return RESPONSE_CHANGE_CONTEXT_RE.test(contextText);
  }

  function hasIconOnlySubmitButtonNearEditable(element, container) {
    if (!container || !hasResponseChangeMenuSignals(container)) {
      return false;
    }

    const editableBounds = element.getBoundingClientRect();
    for (const button of container.querySelectorAll("button, [role='button']")) {
      if (button.contains(element) || element.contains(button)) {
        continue;
      }

      const label = elementOwnText(button).trim();
      const looksIconOnly = label.length === 0 || label.length < 3;
      const type = button.getAttribute("type");
      const looksSubmitLike = type === "submit" || button.querySelector("svg") || /send|submit|arrow|ارسال|إرسال/.test(normalizedInputHint(button));
      const buttonBounds = button.getBoundingClientRect();
      const isNearby = !editableBounds.width || !buttonBounds.width || Math.abs(buttonBounds.top - editableBounds.top) < Math.max(buttonBounds.height, editableBounds.height, 48);

      if (looksIconOnly && looksSubmitLike && isNearby) {
        return true;
      }
    }

    return false;
  }

  function isFloatingResponseChangeContainer(container, element) {
    return Boolean(
      container && (
        container.matches(RESPONSE_CHANGE_CONTEXT_SELECTOR) ||
        element.closest(RESPONSE_CHANGE_CONTEXT_SELECTOR) ||
        container.style.position === "fixed" ||
        container.style.position === "absolute"
      )
    );
  }

  function isAskToChangeResponseInput(element) {
    return isPromptLikeEditable(element, true) &&
      isVisibleConnected(element) &&
      ASK_TO_CHANGE_RESPONSE_RE.test(elementOwnText(element, false));
  }

  function isFocusedResponseChangeInput(element) {
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

    if (!isPromptLikeEditable(element, true) || !isVisibleConnected(element) || !isFocusedWithin(element)) {
      return false;
    }

    const container = responseChangeContainerFor(element);
    return Boolean(container && hasResponseChangeMenuSignals(container));
  }

  function hasResponseChangeContext(element) {
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

    if (!isPromptLikeEditable(element, true) || !isVisibleConnected(element)) {
      return false;
    }

    const container = responseChangeContainerFor(element);
    if (!container || container.closest("nav, aside, header, footer, [role='search'], [role='searchbox'], [role='combobox'], [role='listbox'], [data-testid*='settings' i], [data-testid*='search' i], [data-testid*='filter' i]")) {
      return false;
    }

    const nearbyText = [elementOwnText(element), container.textContent || ""].join(" ").slice(0, 5000);
    const hasAskSignal = ASK_TO_CHANGE_RESPONSE_RE.test(nearbyText);
    const hasMenuSignal = hasResponseChangeMenuSignals(container);
    const hasNearbyIconSubmit = hasIconOnlySubmitButtonNearEditable(element, container);

    return hasAskSignal || (hasMenuSignal && (isFocusedWithin(element) || isFloatingResponseChangeContainer(container, element) || hasNearbyIconSubmit));
  }

  function isResponseChangeComposer(element) {
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

    if (!isPromptLikeEditable(element, true) || !isVisibleConnected(element)) {
      return false;
    }

    if (isMainComposer(element) || isUserMessageEditComposer(element)) {
      return false;
    }

    if (element.matches("input[type='search'], [role='searchbox'], [role='combobox']") ||
        element.closest("button, [role='button'], nav, aside, header, footer, [role='listbox'], [role='combobox'], [data-testid*='settings' i], [data-testid*='search' i], [data-testid*='filter' i], [data-testid*='model' i]")) {
      return false;
    }

    return isAskToChangeResponseInput(element) || isFocusedResponseChangeInput(element) || hasResponseChangeContext(element);
  }

  function responseChangeMenuContainerFor(element) {
    if (!(element instanceof Element)) {
      return null;
    }

    if (element.matches(RESPONSE_CHANGE_MENU_SELECTOR)) {
      return element;
    }

    return element.closest(RESPONSE_CHANGE_MENU_SELECTOR);
  }

  function isExcludedResponseChangeMenuArea(element) {
    return Boolean(
      element.closest("nav, aside, header, footer, [role='search'], [role='searchbox'], [role='combobox'], [role='listbox'], [data-testid*='settings' i], [data-testid*='search' i], [data-testid*='filter' i], [data-testid*='model' i]")
    );
  }

  function isFocusedResponseChangeMenu(element) {
    if (!(element instanceof Element) || !isVisibleConnected(element) || isExcludedResponseChangeMenuArea(element)) {
      return false;
    }

    const container = responseChangeMenuContainerFor(element);
    if (!container || !isVisibleConnected(container) || isExcludedResponseChangeMenuArea(container)) {
      return false;
    }

    const active = document.activeElement;
    const focusedInMenu = Boolean(active && (active === container || container.contains(active) || element === active));
    return focusedInMenu && hasResponseChangeMenuSignals(container);
  }

  function isResponseChangeMenuItem(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const role = element.getAttribute("role") || "";
    const text = previewText(element.textContent, 240);
    return role === "menuitem" || role === "option" || RESPONSE_CHANGE_MENU_ITEM_RE.test(text);
  }

  function responseChangeMenuItemRows(menuElement) {
    if (!(menuElement instanceof Element)) {
      return [];
    }

    const rows = [...menuElement.querySelectorAll("[role='menuitem'], [role='option'], button, [role='button']")]
      .filter((element) => RESPONSE_CHANGE_MENU_ITEM_RE.test(previewText(element.textContent, 240)));

    for (const element of menuElement.querySelectorAll("div, li, span")) {
      if (RESPONSE_CHANGE_MENU_ITEM_RE.test(previewText(element.textContent, 240))) {
        const row = element.closest("[role='menuitem'], [role='option'], button, [role='button']") || element;
        if (!rows.includes(row)) {
          rows.push(row);
        }
      }
    }

    return topLevelTargets(rows.filter((row) => menuElement.contains(row)));
  }

  function responseChangeMenuNativeTargets(menuElement) {
    if (!(menuElement instanceof Element)) {
      return [];
    }

    return topLevelTargets([
      ...responseChangeMenuItemRows(menuElement),
      ...menuElement.querySelectorAll("button, [role='button']")
    ].filter((target, index, targets) => target instanceof Element && targets.indexOf(target) === index));
  }

  function isIconOnlyControl(element) {
    if (!(element instanceof Element) || !element.matches("button, [role='button']")) {
      return false;
    }

    const label = elementOwnText(element).trim();
    return label.length === 0 || (label.length < 3 && Boolean(element.querySelector("svg")));
  }

  function isPseudoInputCandidate(element, menuElement, firstMenuItemTop) {
    if (!(element instanceof Element) || element === menuElement || !isVisibleConnected(element)) {
      return false;
    }

    if (element.matches("button, [role='button'], [role='menuitem'], [role='option'], svg") || isResponseChangeMenuItem(element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const text = previewText(element.textContent, 240);
    const aboveMenuItems = Number.isFinite(firstMenuItemTop) && rect.top < firstMenuItemTop - 1;
    const hasNonMenuText = text.length > 0 && !RESPONSE_CHANGE_MENU_ITEM_RE.test(text);
    const nearIconButton = [...menuElement.querySelectorAll("button, [role='button']")]
      .some((button) => isIconOnlyControl(button) && Math.abs(button.getBoundingClientRect().top - rect.top) < Math.max(rect.height, 48));

    return aboveMenuItems && (hasNonMenuText || nearIconButton || element.children.length > 0);
  }

  function getResponseChangePseudoInputTargets(menuElement) {
    if (!(menuElement instanceof Element)) {
      return [];
    }

    const menuRows = responseChangeMenuItemRows(menuElement);
    const firstMenuItemTop = menuRows.reduce((top, row) => Math.min(top, row.getBoundingClientRect().top), Infinity);
    const candidates = [];
    const directChildren = [...menuElement.children].slice(0, 6);

    for (const child of directChildren) {
      if (isPseudoInputCandidate(child, menuElement, firstMenuItemTop)) {
        candidates.push(child);
      }

      for (const descendant of [...child.querySelectorAll("div, span, p, [data-placeholder]")].slice(0, 12)) {
        if (isPseudoInputCandidate(descendant, menuElement, firstMenuItemTop)) {
          candidates.push(descendant);
        }
      }
    }

    return topLevelTargets(candidates);
  }

  function responseChangePseudoInputText(menuElement) {
    return getResponseChangePseudoInputTargets(menuElement)
      .map((element) => element.textContent || element.getAttribute("data-placeholder") || "")
      .join(" ");
  }

  function directionForResponseChangeMenu(menuElement) {
    if (selectedMode !== "auto") {
      return selectedMode;
    }

    return detectDirectionFromText(responseChangePseudoInputText(menuElement));
  }

  function applyResponseChangeMenuTargetDirection(element, direction) {
    applyDirection(element, COMPOSER_CLASS, direction);
    applyInlineDirectionStyle(element, direction);
  }

  function applyNativeMenuItemDirection(element) {
    applyDirection(element, COMPOSER_CLASS, "ltr");
    applyInlineDirectionStyle(element, "ltr");
    element.style.unicodeBidi = "normal";
  }

  function applyDirectionToResponseChangeMenu(menuElement, forcedDirection = null) {
    const menu = responseChangeMenuContainerFor(menuElement) || menuElement;
    if (!isFocusedResponseChangeMenu(menu)) {
      return null;
    }

    const direction = forcedDirection || directionForResponseChangeMenu(menu);
    const pseudoInputTargets = getResponseChangePseudoInputTargets(menu);
    const menuItemRows = responseChangeMenuNativeTargets(menu);
    const directionTargets = [menu, ...pseudoInputTargets];

    for (const target of directionTargets) {
      applyResponseChangeMenuTargetDirection(target, direction);
    }

    for (const row of menuItemRows) {
      applyNativeMenuItemDirection(row);
    }

    debugResponseChangeMenuApplied(menu, direction, directionTargets, menuItemRows);
    return { direction, directionTargets, menuItemRows };
  }
  function previewText(text, limit) {
    return String(text || "").replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function classNameForDebug(element) {
    return typeof element.className === "string" ? element.className : String(element.getAttribute("class") || "");
  }

  function elementDirectionSummary(element) {
    if (!(element instanceof Element)) {
      return null;
    }

    return {
      dir: element.getAttribute("dir") || "",
      styleDirection: element.style.direction || "",
      styleTextAlign: element.style.textAlign || "",
      styleUnicodeBidi: element.style.unicodeBidi || ""
    };
  }

  function elementSummary(element, includeText = true) {
    if (!(element instanceof Element)) {
      return null;
    }

    return {
      tagName: element.tagName,
      id: element.id || "",
      className: classNameForDebug(element),
      role: element.getAttribute("role") || "",
      dataTestid: element.getAttribute("data-testid") || "",
      ariaLabel: element.getAttribute("aria-label") || "",
      placeholder: element.getAttribute("placeholder") || "",
      dir: element.getAttribute("dir") || "",
      styleDirection: element.style.direction || "",
      styleTextAlign: element.style.textAlign || "",
      styleUnicodeBidi: element.style.unicodeBidi || "",
      isContentEditable: element.isContentEditable,
      textContentPreview: includeText ? previewText(element.textContent, 120) : ""
    };
  }

  function closestElementSummary(element, selector) {
    return element instanceof Element ? elementSummary(element.closest(selector)) : null;
  }

  function isDebugEnabled() {
    return Boolean(
      debugEnabled ||
      (document.documentElement && document.documentElement.dataset.cgptRtlDebug === "1")
    );
  }

  function isFloatingDebugContext(element) {
    if (!isPromptLikeEditable(element, true) && !isFocusedResponseChangeMenu(element)) {
      return false;
    }

    const popupContainer = element.closest(RESPONSE_CHANGE_CONTEXT_SELECTOR);
    if (popupContainer) {
      return true;
    }

    const container = responseChangeContainerFor(element);
    if (!container) {
      return false;
    }

    const style = window.getComputedStyle ? window.getComputedStyle(container) : null;
    return hasResponseChangeMenuSignals(container) || Boolean(style && ["fixed", "absolute", "sticky"].includes(style.position));
  }

  function parentChainForDebug(element) {
    const parentChain = [];
    let current = element;
    for (let depth = 0; current && depth < 8; depth += 1) {
      parentChain.push(elementSummary(current));
      current = current.parentElement;
    }
    return parentChain;
  }


  function canvasDocumentDebugSnapshot(element) {
    const selection = window.getSelection ? window.getSelection() : null;
    const selectedNode = selection && selection.rangeCount > 0 ? selection.anchorNode : null;
    const selectedElement = selectedNode instanceof Element ? selectedNode : selectedNode && selectedNode.parentElement;
    const inspectedElement = element instanceof Element ? element : selectedElement;
    const messageElement = inspectedElement ? assistantMessageContainerFor(inspectedElement) : null;
    const canvasContainer = selectedElement ? canvasDocumentContainerFor(selectedElement) : inspectedElement && canvasDocumentContainerFor(inspectedElement);
    const appliedRoot = canvasContainer || messageElement || inspectedElement;
    const cgptAppliedCount = appliedRoot && typeof appliedRoot.querySelectorAll === "function"
      ? appliedRoot.querySelectorAll(`.${APPLIED_CLASS}`).length + (appliedRoot.classList.contains(APPLIED_CLASS) ? 1 : 0)
      : 0;

    return {
      messageContainsCanvasDocument: Boolean(messageElement && containsCanvasDocumentBlock(messageElement)),
      containsCanvasDocumentBlock: Boolean(inspectedElement && containsCanvasDocumentBlock(inspectedElement)),
      hasCanvasContainer: Boolean(canvasContainer),
      selectedInsideCanvasDocumentBlock: Boolean(selectedElement && isInsideCanvasDocumentBlock(selectedElement)),
      cgptAppliedCount,
      selectedElement: elementSummary(selectedElement, false),
      canvasContainer: elementSummary(canvasContainer, false),
      messageElement: elementSummary(messageElement, false)
    };
  }

  function inspectCanvasDocumentContext() {
    console.info("[ChatGPT Persian Direction] canvas document debug", canvasDocumentDebugSnapshot(document.activeElement));
  }

  function debugEditableContext(element, reason, force = false) {
    if (!(element instanceof Element) || (!force && (!isDebugEnabled() || !isFloatingDebugContext(element)))) {
      return;
    }

    const focusedMenu = isFocusedResponseChangeMenu(element);
    const container = focusedMenu ? responseChangeMenuContainerFor(element) : responseChangeContainerFor(element);
    const active = document.activeElement instanceof Element ? document.activeElement : null;
    const editingHost = getEditingHost(element);
    const activeBlock = getActiveEditableBlock(element);
    const pseudoInputTargets = focusedMenu ? getResponseChangePseudoInputTargets(container) : [];
    const excludedMenuItemRows = focusedMenu ? responseChangeMenuNativeTargets(container) : [];
    const wouldApplyKeyboardDirection = Boolean((isComposerElement(element) && editingHost) || focusedMenu);
    const diagnostic = {
      reason,
      selectedMode,
      activeElement: elementSummary(active, false),
      inspectedElement: elementSummary(element),
      isPromptLikeEditableAllowExcluded: isPromptLikeEditable(element, true),
      isFocusedResponseChangeMenu: focusedMenu,
      isResponseChangeComposer: isResponseChangeComposer(element),
      isAskToChangeResponseInput: isAskToChangeResponseInput(element),
      isFocusedResponseChangeInput: isFocusedResponseChangeInput(element),
      hasResponseChangeContext: hasResponseChangeContext(element),
      isActiveEditableComposer: isActiveEditableComposer(element),
      isComposerElement: isComposerElement(element),
      canvasDocument: canvasDocumentDebugSnapshot(element),
      responseChangeContainer: elementSummary(container),
      hasResponseChangeMenuSignals: hasResponseChangeMenuSignals(container),
      hasIconOnlySubmitButtonNearEditable: hasIconOnlySubmitButtonNearEditable(element, container),
      editingHost: elementSummary(editingHost),
      activeEditableBlock: elementSummary(activeBlock),
      pseudoInputTargets: pseudoInputTargets.map((target) => elementSummary(target)),
      excludedMenuItemRows: excludedMenuItemRows.map((row) => elementSummary(row)),
      wouldApplyDirectionLikeKeyboardShortcut: wouldApplyKeyboardDirection,
      directionState: {
        element: elementDirectionSummary(element),
        editingHost: elementDirectionSummary(editingHost),
        activeBlock: elementDirectionSummary(activeBlock)
      },
      closestForm: closestElementSummary(element, "form"),
      closestRoleMenuDialogPopover: closestElementSummary(element, "[role='menu'], [role='dialog'], [role='alertdialog'], [popover]"),
      closestRadixMenuPopupWrapper: closestElementSummary(element, "[data-radix-menu-content], [data-radix-popper-content-wrapper], [data-testid*='menu' i], [data-testid*='popover' i]"),
      parentChain: parentChainForDebug(element),
      containerTextPreview: previewText(container && container.textContent, 500)
    };

    console.info("[ChatGPT Persian Direction] editable debug", diagnostic);
  }

  function debugDirectionApplied(element, direction, targets) {
    if (!isDebugEnabled() || !(element instanceof Element) || !isResponseChangeComposer(element)) {
      return;
    }

    console.info("[ChatGPT Persian Direction] response-change direction applied", {
      selectedMode,
      direction,
      element: elementSummary(element),
      targets: targets.map((target) => elementSummary(target, false))
    });
  }

  function debugResponseChangeMenuApplied(menuElement, direction, targets, excludedRows) {
    if (!isDebugEnabled()) {
      return;
    }

    console.info("[ChatGPT Persian Direction] response-change menu direction applied", {
      selectedMode,
      direction,
      element: elementSummary(menuElement),
      pseudoInputTargets: targets.map((target) => elementSummary(target, false)),
      excludedMenuItemRows: excludedRows.map((row) => elementSummary(row, false))
    });
  }

  function inspectActiveEditableContext() {
    const active = document.activeElement instanceof Element ? document.activeElement : null;
    const editable = active ? active.closest(COMPOSER_SELECTOR) || responseChangeMenuContainerFor(active) || active : null;
    debugEditableContext(editable, "manual", true);
  }

  function handleDebugEvent(event) {
    if (event.type === "cgpt-rtl-debug-enable") {
      debugEnabled = true;
      console.info("[ChatGPT Persian Direction] debug enabled");
    } else if (event.type === "cgpt-rtl-debug-disable") {
      debugEnabled = false;
      if (document.documentElement) {
        delete document.documentElement.dataset.cgptRtlDebug;
      }
      console.info("[ChatGPT Persian Direction] debug disabled");
    } else if (event.type === "cgpt-rtl-inspect-active") {
      inspectActiveEditableContext();
    } else if (event.type === "cgpt-rtl-inspect-canvas") {
      inspectCanvasDocumentContext();
    }
  }

  function installDebugInspector() {
    document.addEventListener("cgpt-rtl-debug-enable", handleDebugEvent);
    document.addEventListener("cgpt-rtl-debug-disable", handleDebugEvent);
    document.addEventListener("cgpt-rtl-inspect-active", handleDebugEvent);
    document.addEventListener("cgpt-rtl-inspect-canvas", handleDebugEvent);
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
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

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
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

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
    if (isInsideCanvasDocumentBlock(element) || !isPromptLikeEditable(element) || !isVisibleConnected(element) || isMainComposer(element)) {
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
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

    return isUserMessageEditComposer(element) || isLikelyChatEditable(element) || isResponseChangeComposer(element);
  }

  function isInlineEditComposer(element) {
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

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
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

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
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

    return isMainComposer(element) || isInlineEditComposer(element) || isRetryComposer(element) || isResponseChangeComposer(element);
  }

  function isMessageElement(element) {
    return element.matches(MESSAGE_SELECTOR);
  }

  function isComposerElement(element) {
    if (isInsideCanvasDocumentBlock(element)) {
      return false;
    }

    return isMainComposer(element) || isInlineEditComposer(element) || isRetryComposer(element) || isResponseChangeComposer(element) || isActiveEditableComposer(element);
  }

  function topLevelTargets(elements) {
    return elements.filter((element, index) => (
      !elements.some((other, otherIndex) => otherIndex !== index && other.contains(element))
    ));
  }

  function getMessageTextTargets(messageElement) {
    if (isInsideCanvasDocumentBlock(messageElement)) {
      return [];
    }

    const proseTargets = [...messageElement.querySelectorAll(MESSAGE_PROSE_SELECTOR)]
      .filter((element) => !isInsideCanvasDocumentBlock(element) && !containsCanvasDocumentBlock(element) && !element.closest(`${CONTROL_AREA_SELECTOR}, ${COMPOSER_SELECTOR}`));

    if (proseTargets.length > 0) {
      return topLevelTargets(proseTargets);
    }

    const messageIdTargets = [...messageElement.querySelectorAll("[data-message-id]")]
      .filter((element) => (
        !isInsideCanvasDocumentBlock(element) &&
        element.querySelector(MESSAGE_TEXT_BLOCK_SELECTOR) &&
        !element.querySelector(CONTROL_AREA_SELECTOR) &&
        !element.querySelector(COMPOSER_SELECTOR) &&
        !containsCanvasDocumentBlock(element)
      ));

    if (messageIdTargets.length > 0) {
      return topLevelTargets(messageIdTargets);
    }

    const textBlockTargets = [...messageElement.querySelectorAll(MESSAGE_TEXT_BLOCK_SELECTOR)]
      .filter((element) => !isInsideCanvasDocumentBlock(element) && !element.closest(`${TECHNICAL_SELECTOR}, ${COMPOSER_SELECTOR}, [role='toolbar'], [role='menu']`));

    if (textBlockTargets.length > 0) {
      return topLevelTargets(textBlockTargets);
    }

    const authorRoleTarget = messageElement.matches("[data-message-author-role]")
      ? messageElement
      : messageElement.querySelector("[data-message-author-role='user'], [data-message-author-role='assistant']");

    const fallbackTarget = authorRoleTarget || messageElement;
    if (isInsideCanvasDocumentBlock(fallbackTarget) || containsCanvasDocumentBlock(fallbackTarget)) {
      return [];
    }

    return [fallbackTarget];
  }

  function isTableElement(element) {
    return Boolean(element && element.matches && element.matches("table"));
  }

  function getTableDirectionTargets(messageElement) {
    if (isInsideCanvasDocumentBlock(messageElement)) {
      return [];
    }

    return [...messageElement.querySelectorAll("table")]
      .filter((tableElement) => !isInsideCanvasDocumentBlock(tableElement) && shouldDirectionManageTable(tableElement));
  }

  function shouldDirectionManageTable(tableElement) {
    if (isInsideCanvasDocumentBlock(tableElement) || !isTableElement(tableElement)) {
      return false;
    }

    if (tableElement.closest("pre, code, kbd, samp, math, .katex, .MathJax, [class*='syntax'], [class*='highlight'], [class*='editor'], [class*='Editor'], [class*='terminal' i]")) {
      return false;
    }

    if (tableElement.matches("[role='grid'], [role='treegrid']")) {
      return false;
    }

    return true;
  }

  function tableHeaderText(tableElement) {
    const firstHeaderRow = tableElement.tHead && tableElement.tHead.rows.length > 0
      ? tableElement.tHead.rows[0]
      : [...tableElement.querySelectorAll("tr")].find((rowElement) => rowElement.querySelector("th"));

    if (firstHeaderRow) {
      const headerText = [...firstHeaderRow.querySelectorAll("th")]
        .map((cellElement) => cellElement.textContent || "")
        .join(" ")
        .trim();

      if (headerText) {
        return headerText;
      }
    }

    const firstRow = tableElement.querySelector("tr");
    if (!firstRow) {
      return "";
    }

    return [...firstRow.querySelectorAll("th, td")]
      .map((cellElement) => cellElement.textContent || "")
      .join(" ")
      .trim();
  }

  function directionForTableLayout(tableElement) {
    if (selectedMode === "rtl" || selectedMode === "ltr") {
      return selectedMode;
    }

    return cachedDirectionForTableLayout(tableElement);
  }

  function directionForTableCell(cellElement) {
    return cachedDirectionForTableCell(cellElement);
  }

  function applyStableDirectionToTable(tableElement, direction) {
    applyDirection(tableElement, TABLE_CLASS, direction);
  }

  function applyDirectionToTableCell(cellElement) {
    const direction = directionForTableCell(cellElement);
    applyDirection(cellElement, TABLE_CELL_CLASS, direction);
    applyInlineDirectionStyle(cellElement, direction);
  }

  function applyDirectionToTableCells(tableElement) {
    if (isInsideCanvasDocumentBlock(tableElement) || !shouldDirectionManageTable(tableElement)) {
      return;
    }

    const layoutDirection = directionForTableLayout(tableElement);
    applyStableDirectionToTable(tableElement, layoutDirection);
    for (const cellElement of tableElement.querySelectorAll("th, td")) {
      if (perfStats) {
        perfStats.cells += 1;
      }
      applyDirectionToTableCell(cellElement);
    }
  }

  function strongDirectionForCharacter(character) {
    if (/[\u0590-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(character)) {
      return "rtl";
    }

    if (/[A-Za-z]/.test(character)) {
      return "ltr";
    }

    return null;
  }

  function getStrongDirectionStats(text, options = {}) {
    const sampleLimit = options.sampleLimit || 200;
    const characters = Array.from(String(text || ""));
    let visibleIndex = 0;
    let previousStrongDirection = null;
    const stats = {
      rtlCount: 0,
      latinCount: 0,
      rtlRuns: 0,
      latinRuns: 0,
      firstRtlIndex: -1,
      firstLatinIndex: -1,
      firstStrongDirection: null,
      latinPrefixCount: 0
    };

    for (const character of characters) {
      if (/\s/u.test(character)) {
        continue;
      }

      if (visibleIndex >= sampleLimit) {
        break;
      }

      const strongDirection = strongDirectionForCharacter(character);
      if (strongDirection === "rtl") {
        stats.rtlCount += 1;
        if (stats.firstRtlIndex === -1) {
          stats.firstRtlIndex = visibleIndex;
        }
        if (previousStrongDirection !== "rtl") {
          stats.rtlRuns += 1;
        }
      } else if (strongDirection === "ltr") {
        stats.latinCount += 1;
        if (stats.firstLatinIndex === -1) {
          stats.firstLatinIndex = visibleIndex;
        }
        if (stats.firstRtlIndex === -1) {
          stats.latinPrefixCount += 1;
        }
        if (previousStrongDirection !== "ltr") {
          stats.latinRuns += 1;
        }
      }

      if (strongDirection) {
        stats.firstStrongDirection = stats.firstStrongDirection || strongDirection;
        previousStrongDirection = strongDirection;
      }

      visibleIndex += 1;
    }

    return stats;
  }

  function isShortLatinPrefixBeforeRtl(text, stats = getStrongDirectionStats(text)) {
    if (stats.firstLatinIndex === -1 || stats.firstRtlIndex === -1) {
      return false;
    }

    if (stats.firstLatinIndex > stats.firstRtlIndex || stats.firstRtlIndex > 50) {
      return false;
    }

    if (stats.latinPrefixCount > 30 || stats.rtlCount < 4) {
      return false;
    }

    return stats.rtlCount >= stats.latinCount * 0.55 || (stats.rtlRuns >= stats.latinRuns && stats.rtlCount >= stats.latinCount * 0.45) || stats.rtlCount >= 12;
  }

  function detectDirectionFromText(text, options = {}) {
    if (perfStats) {
      perfStats.detectCalls += 1;
    }

    const stats = getStrongDirectionStats(text, options);

    if (stats.rtlCount === 0 && stats.latinCount === 0) {
      return "rtl";
    }

    if (stats.rtlCount === 0) {
      return "ltr";
    }

    if (stats.latinCount === 0) {
      return "rtl";
    }

    if (isShortLatinPrefixBeforeRtl(text, stats)) {
      return "rtl";
    }

    if (stats.rtlCount >= stats.latinCount) {
      return "rtl";
    }

    if (stats.firstStrongDirection === "rtl") {
      return stats.latinCount > stats.rtlCount * 2.5 ? "ltr" : "rtl";
    }

    return stats.latinCount >= stats.rtlCount * 1.8 ? "ltr" : "rtl";
  }

  function composerText(element) {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      return element.value;
    }

    return element.textContent || "";
  }

  function textSignatureFor(element, sampleLimit = 220, textOverride = null) {
    const text = String(textOverride === null ? (element.textContent || "") : textOverride);
    const tailLimit = Math.min(40, sampleLimit);
    return [
      text.length,
      text.slice(0, sampleLimit),
      text.length > sampleLimit ? text.slice(-tailLimit) : ""
    ].join("::");
  }

  function cachedDirectionForTextElement(element, options = {}) {
    const text = options.text === undefined
      ? (options.kind === COMPOSER_CLASS ? composerText(element) : element.textContent || "")
      : options.text;
    const signature = textSignatureFor(element, options.sampleLimit || 220, text);

    if (elementTextSignatureCache.get(element) === signature && detectedDirectionCache.has(element)) {
      return detectedDirectionCache.get(element);
    }

    const direction = detectDirectionFromText(text, options);
    elementTextSignatureCache.set(element, signature);
    detectedDirectionCache.set(element, direction);
    return direction;
  }

  function cachedDirectionForTableCell(cellElement) {
    const signature = textSignatureFor(cellElement, 220);
    const cached = tableCellDirectionCache.get(cellElement);
    if (cached && cached.signature === signature) {
      return cached.direction;
    }

    const direction = detectDirectionFromText(cellElement.textContent || "");
    tableCellDirectionCache.set(cellElement, { signature, direction });
    return direction;
  }

  function cachedDirectionForTableLayout(tableElement) {
    const headerText = tableHeaderText(tableElement);
    const text = headerText || tableElement.textContent || "";
    const signature = textSignatureFor(tableElement, 220, text);
    const cached = tableLayoutDirectionCache.get(tableElement);
    if (cached && cached.signature === signature) {
      return cached.direction;
    }

    const direction = detectDirectionFromText(text);
    tableLayoutDirectionCache.set(tableElement, { signature, direction });
    return direction;
  }

  function directionFor(element, kind) {
    if (selectedMode !== "auto") {
      return selectedMode;
    }

    return cachedDirectionForTextElement(element, { kind });
  }

  function clearDirectionClasses(element) {
    const classesToRemove = [...DIRECTION_CLASSES, ...LEGACY_CLASSES].filter((className) => element.classList.contains(className));
    if (classesToRemove.length > 0) {
      element.classList.remove(...classesToRemove);
    } else if (perfStats) {
      perfStats.skippedWrites += 1;
    }
  }

  function applyDirection(element, kind, forcedDirection = null) {
    if (isInsideCanvasDocumentBlock(element)) {
      return forcedDirection || selectedMode;
    }

    const direction = forcedDirection || directionFor(element, kind);
    const desiredClasses = [APPLIED_CLASS, kind, `cgpt-dir-${selectedMode}`, `cgpt-dir-${direction}`];
    const currentDir = element.getAttribute("dir");
    const hasStaleDirectionClass = DIRECTION_CLASSES.some((className) => (
      className !== `cgpt-dir-${selectedMode}` &&
      className !== `cgpt-dir-${direction}` &&
      element.classList.contains(className)
    )) || LEGACY_CLASSES.some((className) => element.classList.contains(className));
    const missingClass = desiredClasses.some((className) => !element.classList.contains(className));

    if (currentDir === direction && !hasStaleDirectionClass && !missingClass) {
      if (perfStats) {
        perfStats.skippedWrites += 1;
      }
      return direction;
    }

    if (!originalDirections.has(element)) {
      originalDirections.set(element, currentDir);
    }

    if (hasStaleDirectionClass) {
      clearDirectionClasses(element);
    }

    for (const className of desiredClasses) {
      if (!element.classList.contains(className)) {
        element.classList.add(className);
      }
    }

    if (currentDir !== direction) {
      element.setAttribute("dir", direction);
    }
    return direction;
  }

  function applyInlineDirectionStyle(element, direction) {
    if (isInsideCanvasDocumentBlock(element)) {
      return;
    }

    const textAlign = direction === "rtl" ? "right" : "left";
    if (element.style.direction === direction && element.style.textAlign === textAlign && element.style.unicodeBidi === "isolate") {
      if (perfStats) {
        perfStats.skippedWrites += 1;
      }
      return;
    }

    if (!originalInlineStyles.has(element)) {
      originalInlineStyles.set(element, {
        direction: element.style.direction,
        textAlign: element.style.textAlign,
        unicodeBidi: element.style.unicodeBidi
      });
    }

    if (element.style.direction !== direction) {
      element.style.direction = direction;
    }
    if (element.style.textAlign !== textAlign) {
      element.style.textAlign = textAlign;
    }
    if (element.style.unicodeBidi !== "isolate") {
      element.style.unicodeBidi = "isolate";
    }
  }

  function restoreInlineDirectionStyle(element) {
    if (!originalInlineStyles.has(element)) {
      return;
    }

    const originalStyle = originalInlineStyles.get(element);
    element.style.direction = originalStyle.direction;
    element.style.textAlign = originalStyle.textAlign;
    element.style.unicodeBidi = originalStyle.unicodeBidi;
    originalInlineStyles.delete(element);
  }

  function isEditableDirectionExcluded(element, allowMenuAncestor = false) {
    const excludedSelector = allowMenuAncestor
      ? [
          "button",
          "[role='button']",
          "[role='toolbar']",
          "[role='listbox']",
          "[data-testid*='copy' i]",
          "[data-testid*='feedback' i]",
          EDIT_COMPOSER_EXCLUDED_SELECTOR,
          `.${CONTROL_CLASS}`
        ].join(",")
      : `${CONTROL_AREA_SELECTOR}, ${EDIT_COMPOSER_EXCLUDED_SELECTOR}, .${CONTROL_CLASS}`;

    return Boolean(element.closest(excludedSelector));
  }
  function getEditingHost(element) {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      return element;
    }

    if (element.matches(".ProseMirror, [contenteditable='true'], [role='textbox']")) {
      return element;
    }

    return element.closest(".ProseMirror, [contenteditable='true'], [role='textbox']");
  }

  function getActiveEditableBlock(element) {
    const host = getEditingHost(element);
    if (!host || isInsideCanvasDocumentBlock(host) || host instanceof HTMLTextAreaElement || host instanceof HTMLInputElement) {
      return host;
    }

    const selection = window.getSelection ? window.getSelection() : null;
    const anchorNode = selection && selection.rangeCount > 0 ? selection.anchorNode : null;
    const anchorElement = anchorNode instanceof Element ? anchorNode : anchorNode && anchorNode.parentElement;
    const selectionBlock = anchorElement && host.contains(anchorElement)
      ? anchorElement.closest(EDITABLE_BLOCK_SELECTOR)
      : null;

    if (selectionBlock && host.contains(selectionBlock)) {
      return selectionBlock;
    }

    const focused = document.activeElement instanceof Element && host.contains(document.activeElement)
      ? document.activeElement.closest(EDITABLE_BLOCK_SELECTOR)
      : null;

    if (focused && host.contains(focused)) {
      return focused;
    }

    return host.querySelector(EDITABLE_BLOCK_SELECTOR) || host;
  }

  function applyParagraphDirection(element, direction) {
    if (!element) {
      return;
    }

    const host = getEditingHost(element) || element;
    if (isEditableDirectionExcluded(element, isResponseChangeComposer(host))) {
      return;
    }

    applyDirection(element, COMPOSER_CLASS, direction);
    applyInlineDirectionStyle(element, direction);
  }

  function getKeyboardShortcutDirectionTargets(element) {
    const targets = new Set();
    const host = getEditingHost(element) || element;
    if (isInsideCanvasDocumentBlock(host)) {
      return targets;
    }

    if (host instanceof HTMLTextAreaElement || host instanceof HTMLInputElement) {
      targets.add(host);
      return targets;
    }

    targets.add(host);

    const activeBlock = getActiveEditableBlock(host);
    if (activeBlock) {
      targets.add(activeBlock);
    }

    if (typeof host.querySelectorAll === "function") {
      for (const block of host.querySelectorAll(EDITABLE_BLOCK_SELECTOR)) {
        if (!isEditableDirectionExcluded(block, isResponseChangeComposer(host))) {
          targets.add(block);
        }
      }
    }

    return targets;
  }

  function applyDirectionLikeKeyboardShortcut(element, direction) {
    for (const target of getKeyboardShortcutDirectionTargets(element)) {
      applyParagraphDirection(target, direction);
    }
  }

  function getEditableDirectionTargets(element) {
    const targets = new Set();
    if (isInsideCanvasDocumentBlock(element)) {
      return targets;
    }

    if (element.matches(EDITABLE_DIRECTION_TARGET_SELECTOR)) {
      targets.add(element);
    }

    if (typeof element.querySelectorAll === "function") {
      for (const target of element.querySelectorAll(EDITABLE_DIRECTION_TARGET_SELECTOR)) {
        if (!isInsideCanvasDocumentBlock(target) && !isEditableDirectionExcluded(target, isResponseChangeComposer(getEditingHost(element) || element))) {
          targets.add(target);
        }
      }
    }

    for (const target of getKeyboardShortcutDirectionTargets(element)) {
      targets.add(target);
    }

    return targets;
  }

  function applyDirectionToEditableTree(element, direction) {
    const targets = [...getEditableDirectionTargets(element)];
    for (const target of targets) {
      applyParagraphDirection(target, direction);
    }
    applyDirectionLikeKeyboardShortcut(element, direction);
    debugDirectionApplied(element, direction, targets);
  }

  function applyDirectionToActiveEditables(root = document) {
    if (root instanceof Element && isInsideCanvasDocumentBlock(root)) {
      return;
    }

    for (const element of elementsMatching(root, COMPOSER_SELECTOR, true)) {
      if (!isInsideCanvasDocumentBlock(element) && isActiveEditableComposer(element)) {
        const direction = applyDirection(element, COMPOSER_CLASS);
        applyDirectionToEditableTree(element, direction);
      }
    }
  }

  function applyDirectionToFocusedResponseChangeMenus(root = document) {
    const activeMenu = document.activeElement instanceof Element
      ? responseChangeMenuContainerFor(document.activeElement)
      : null;

    for (const element of elementsMatching(root, RESPONSE_CHANGE_MENU_SELECTOR, true)) {
      if (isFocusedResponseChangeMenu(element)) {
        applyDirectionToResponseChangeMenu(element);
      }
    }

    if (activeMenu && isFocusedResponseChangeMenu(activeMenu)) {
      applyDirectionToResponseChangeMenu(activeMenu);
    }
  }

  function removeDirection(element) {
    const hadDirectionClass = element.classList.contains(APPLIED_CLASS) ||
      LEGACY_CLASSES.some((className) => element.classList.contains(className));

    restoreInlineDirectionStyle(element);
    element.classList.remove(APPLIED_CLASS, COMPOSER_CLASS, MESSAGE_CLASS, TABLE_CLASS, TABLE_CELL_CLASS, ...DIRECTION_CLASSES, ...LEGACY_CLASSES);
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
    if (root instanceof Element && isInsideCanvasDocumentBlock(root)) {
      return;
    }

    for (const element of elementsMatching(root, COMPOSER_SELECTOR, true)) {
      if (!isInsideCanvasDocumentBlock(element) && isComposerElement(element)) {
        const direction = applyDirection(element, COMPOSER_CLASS);
        applyDirectionToEditableTree(element, direction);
      }
    }
  }

  function applyDirectionToMessages(root = document) {
    if (root instanceof Element && isInsideCanvasDocumentBlock(root)) {
      return;
    }

    for (const messageElement of elementsMatching(root, MESSAGE_SELECTOR, true)) {
      if (isInsideCanvasDocumentBlock(messageElement) || !isMessageElement(messageElement)) {
        continue;
      }

      if (perfStats) {
        perfStats.messages += 1;
      }

      for (const target of getMessageTextTargets(messageElement)) {
        applyDirection(target, MESSAGE_CLASS);
      }

      for (const tableElement of getTableDirectionTargets(messageElement)) {
        if (perfStats) {
          perfStats.tables += 1;
        }
        applyDirectionToTableCells(tableElement);
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

    for (const menu of document.querySelectorAll(RESPONSE_CHANGE_MENU_SELECTOR)) {
      if (isFocusedResponseChangeMenu(menu)) {
        currentTargets.add(menu);
        for (const target of getResponseChangePseudoInputTargets(menu)) {
          currentTargets.add(target);
        }
        for (const row of responseChangeMenuNativeTargets(menu)) {
          currentTargets.add(row);
        }
      }
    }

    for (const message of document.querySelectorAll(MESSAGE_SELECTOR)) {
      if (isMessageElement(message)) {
        for (const target of getMessageTextTargets(message)) {
          currentTargets.add(target);
        }
        for (const tableElement of getTableDirectionTargets(message)) {
          currentTargets.add(tableElement);
          for (const cellElement of tableElement.querySelectorAll("th, td")) {
            currentTargets.add(cellElement);
          }
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

  function createPerfStats() {
    return {
      observedMessages: 0,
      queuedMessages: 0,
      processedMessages: 0,
      skippedOffscreenMessages: 0,
      messages: 0,
      tables: 0,
      cells: 0,
      detectCalls: 0,
      skippedWrites: 0
    };
  }

  function withPerfStats(label, callback, details = {}) {
    const previousPerfStats = perfStats;
    const startedAt = debugEnabled && typeof performance !== "undefined" ? performance.now() : 0;
    perfStats = debugEnabled ? createPerfStats() : null;

    try {
      return callback();
    } catch (_error) {
      // ChatGPT can replace DOM subtrees while they are being inspected. A future
      // mutation or route event will retry without interrupting the page.
      return undefined;
    } finally {
      if (debugEnabled && perfStats) {
        console.debug("[cgpt-dir] " + label, {
          elapsedMs: Math.round((performance.now() - startedAt) * 10) / 10,
          ...perfStats,
          ...details
        });
      }
      perfStats = previousPerfStats;
    }
  }

  function applyInteractiveDirections(root = document) {
    return withPerfStats("interactive pass", () => {
      applyDirectionToComposer(root);
      applyDirectionToActiveEditables(root);
      applyDirectionToFocusedResponseChangeMenus(root);
      if (root === document) {
        ensureDirectionControl();
      }
    }, { root: root === document ? "document" : root && root.nodeName });
  }

  function isMessageNearViewport(messageElement) {
    if (!(messageElement instanceof Element) || !messageElement.isConnected) {
      return false;
    }

    const rect = messageElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    return rect.bottom >= -MESSAGE_OBSERVER_MARGIN_PX && rect.top <= viewportHeight + MESSAGE_OBSERVER_MARGIN_PX;
  }

  function setupMessageIntersectionObserver() {
    if (messageObserver || typeof IntersectionObserver !== "function") {
      return;
    }

    messageObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          enqueueMessageForDirection(entry.target);
        }
      }
    }, { root: null, rootMargin: MESSAGE_OBSERVER_ROOT_MARGIN, threshold: 0 });
  }

  function observeMessageForLazyDirection(messageElement) {
    if (!(messageElement instanceof Element) || !isMessageElement(messageElement) || observedMessages.has(messageElement)) {
      return;
    }

    observedMessages.add(messageElement);
    if (perfStats) {
      perfStats.observedMessages += 1;
    }

    if (messageObserver) {
      messageObserver.observe(messageElement);
    }

    if (!messageObserver || isMessageNearViewport(messageElement)) {
      enqueueMessageForDirection(messageElement);
    }
  }

  function refreshObservedMessages(root = document) {
    setupMessageIntersectionObserver();
    for (const messageElement of elementsMatching(root, MESSAGE_SELECTOR, true)) {
      observeMessageForLazyDirection(messageElement);
    }
  }

  function enqueueMessageForDirection(messageElement) {
    if (!(messageElement instanceof Element) || !messageElement.isConnected || !isMessageElement(messageElement)) {
      return;
    }

    if (!messageDirectionQueue.has(messageElement)) {
      messageDirectionQueue.add(messageElement);
      if (perfStats) {
        perfStats.queuedMessages += 1;
      }
    }

    if (directionQueueScheduled) {
      return;
    }

    directionQueueScheduled = true;
    requestAnimationFrame(processDirectionQueue);
  }

  function processDirectionQueue() {
    directionQueueScheduled = false;
    withPerfStats("message queue", () => {
      let processed = 0;
      for (const messageElement of [...messageDirectionQueue]) {
        messageDirectionQueue.delete(messageElement);
        if (!messageElement.isConnected) {
          continue;
        }

        if (!isMessageNearViewport(messageElement)) {
          if (perfStats) {
            perfStats.skippedOffscreenMessages += 1;
          }
          continue;
        }

        applyDirectionToMessages(messageElement);
        processed += 1;
        if (perfStats) {
          perfStats.processedMessages += 1;
        }

        if (processed >= MAX_MESSAGES_PER_FRAME) {
          break;
        }
      }

      if (messageDirectionQueue.size > 0) {
        directionQueueScheduled = true;
        requestAnimationFrame(processDirectionQueue);
      }
    }, { queuedMessages: messageDirectionQueue.size });
  }

  function applyDirectionToVisibleMessages(root = document) {
    return withPerfStats("visible message refresh", () => {
      refreshObservedMessages(root);
      for (const messageElement of elementsMatching(root, MESSAGE_SELECTOR, true)) {
        if (isMessageNearViewport(messageElement)) {
          enqueueMessageForDirection(messageElement);
        } else if (perfStats) {
          perfStats.skippedOffscreenMessages += 1;
        }
      }
    }, { root: root === document ? "document" : root && root.nodeName });
  }

  function applyDirections(root = document, options = {}) {
    if (root instanceof Element && isInsideCanvasDocumentBlock(root)) {
      return undefined;
    }

    return withPerfStats("apply pass", () => {
      if (options.fullReconcile) {
        reconcileAppliedElements();
      }
      applyDirectionToComposer(root);
      applyDirectionToActiveEditables(root);
      applyDirectionToFocusedResponseChangeMenus(root);
      if (options.includeMessages || root !== document) {
        applyDirectionToMessages(root);
      }
      if (root === document || options.fullReconcile) {
        ensureDirectionControl();
      }
    }, {
      root: root === document ? "document" : root && root.nodeName,
      fullReconcile: Boolean(options.fullReconcile)
    });
  }

  function scheduleIdleWork(callback, timeout = 3000) {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(callback, { timeout });
    } else {
      setTimeout(callback, timeout);
    }
  }

  function scheduleCleanup() {
    if (cleanupScheduled) {
      return;
    }

    cleanupScheduled = true;
    scheduleIdleWork(() => {
      cleanupScheduled = false;
      applyInteractiveDirections(document);
      refreshObservedMessages(document);
      applyDirectionToVisibleMessages(document);
    }, 3000);
  }

  function scheduleApply(root = document, options = {}) {
    if (root instanceof Element && isInsideCanvasDocumentBlock(root)) {
      return;
    }

    const fullScan = Boolean(options.fullScan) || root === document || root === document.documentElement;
    if (fullScan) {
      fullScanScheduled = true;
      pendingRoots.clear();
    } else if (!fullScanScheduled && root instanceof Element) {
      pendingRoots.add(root);
      scheduleCleanup();
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
        applyInteractiveDirections(document);
        applyDirectionToVisibleMessages(document);
        scheduleCleanup();
        return;
      }

      const roots = [...pendingRoots];
      pendingRoots.clear();
      for (const pendingRoot of roots) {
        if (!pendingRoot.isConnected) {
          scheduleCleanup();
          continue;
        }

        applyDirections(pendingRoot, { fullReconcile: false, includeMessages: true });
        refreshObservedMessages(pendingRoot);
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
    messageDirectionQueue.clear();
    applyInteractiveDirections(document);
    refreshObservedMessages(document);
    applyDirectionToVisibleMessages(document);
    scheduleCleanup();
  }

  function loadMode() {
    if (!chrome.storage || !chrome.storage.local) {
      applyInteractiveDirections(document);
      applyDirectionToVisibleMessages(document);
      return;
    }

    chrome.storage.local.get(STORAGE_KEY, (stored) => {
      const storedMode = stored && stored[STORAGE_KEY];
      setMode(MODES.includes(storedMode) ? storedMode : DEFAULT_MODE, false);
    });
  }

  function handleComposerInput(event) {
    const target = event.target instanceof Element ? event.target : null;
    const composer = target ? target.closest(COMPOSER_SELECTOR) : null;
    const menu = target ? responseChangeMenuContainerFor(target) : null;
    if (composer) {
      debugEditableContext(composer, "input");
    } else if (menu) {
      debugEditableContext(menu, "input");
    }
    if (composer && isComposerElement(composer)) {
      const direction = applyDirection(composer, COMPOSER_CLASS);
      applyDirectionToEditableTree(composer, direction);
    } else if (menu && isFocusedResponseChangeMenu(menu)) {
      applyDirectionToResponseChangeMenu(menu);
    }
  }

  function handleComposerFocus(event) {
    const target = event.target instanceof Element ? event.target : null;
    const composer = target ? target.closest(COMPOSER_SELECTOR) : null;
    const menu = target ? responseChangeMenuContainerFor(target) : null;
    if (composer) {
      debugEditableContext(composer, "focusin");
    } else if (menu) {
      debugEditableContext(menu, "focusin");
    }
    if (composer && isComposerElement(composer)) {
      const direction = applyDirection(composer, COMPOSER_CLASS);
      applyDirectionToEditableTree(composer, direction);
    } else if (menu && isFocusedResponseChangeMenu(menu)) {
      applyDirectionToResponseChangeMenu(menu);
    }
  }

  function shortcutModeFromEvent(event) {
    if (event.code === "ShiftRight") {
      return "rtl";
    }

    if (event.code === "ShiftLeft") {
      return "ltr";
    }

    if (event.shiftKey && event.code === "KeyA") {
      return "auto";
    }

    return null;
  }

  function handleKeyboardShortcut(event) {
    const target = event.target instanceof Element ? event.target : null;
    const composer = target ? target.closest(COMPOSER_SELECTOR) : null;
    const menu = target ? responseChangeMenuContainerFor(target) : null;
    const focusedResponseMenu = menu && isFocusedResponseChangeMenu(menu);

    if (focusedResponseMenu) {
      applyDirectionToResponseChangeMenu(menu);
    }

    if (!event.ctrlKey) {
      return;
    }

    const mode = shortcutModeFromEvent(event);
    if (!mode) {
      return;
    }

    if ((composer && isComposerElement(composer)) || focusedResponseMenu) {
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
        if (mutation.type !== "characterData" && mutation.addedNodes.length === 0) {
          continue;
        }

        const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
        if (!target || isInsideCanvasDocumentBlock(target)) {
          continue;
        }

        const addedElements = [...mutation.addedNodes].filter((node) => node instanceof Element);
        if (addedElements.some((element) => isInsideCanvasDocumentBlock(element) || containsCanvasDocumentBlock(element))) {
          continue;
        }

        const addedElementCount = addedElements.length;
        const addedLargeSubtree = addedElements.some((node) => (
          node.querySelectorAll && node.querySelectorAll(`${MESSAGE_SELECTOR}, ${COMPOSER_SELECTOR}, table`).length > 4
        ));
        if (addedElementCount > 8 || addedLargeSubtree) {
          applyInteractiveDirections(document);
          refreshObservedMessages(target);
          applyDirectionToVisibleMessages(document);
          scheduleCleanup();
          continue;
        }

        const scopedRoot = target.closest("th, td")?.closest("table") ||
          target.closest(MESSAGE_SELECTOR) ||
          target.closest(COMPOSER_CONTAINER_SELECTOR) ||
          target.closest(COMPOSER_SELECTOR) ||
          target.closest(RESPONSE_CHANGE_MENU_SELECTOR) ||
          target;
        scheduleApply(scopedRoot);
      }
    });

    observer.observe(target, { childList: true, characterData: true, subtree: true });
  }

  function handleRouteChange() {
    messageDirectionQueue.clear();
    applyInteractiveDirections(document);
    refreshObservedMessages(document);
    applyDirectionToVisibleMessages(document);
    scheduleCleanup();
  }

  function watchRouteChanges() {
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("pageshow", handleRouteChange);

    for (const method of ["pushState", "replaceState"]) {
      const original = history[method];
      if (typeof original !== "function" || original.__cgptDirectionWrapped) {
        continue;
      }

      const wrapped = function (...args) {
        const result = original.apply(this, args);
        handleRouteChange();
        return result;
      };

      Object.defineProperty(wrapped, "__cgptDirectionWrapped", { value: true });
      history[method] = wrapped;
    }
  }

  if (globalThis.__CGPT_DIRECTION_TEST_HOOKS__) {
    Object.assign(globalThis.__CGPT_DIRECTION_TEST_HOOKS__, {
      textSignatureFor,
      cachedDirectionForTextElement,
      cachedDirectionForTableCell,
      cachedDirectionForTableLayout,
      isMessageNearViewport,
      enqueueMessageForDirection,
      processDirectionQueue,
      detectDirectionFromText
    });
    return;
  }

  installDebugInspector();
  setupMessageIntersectionObserver();
  applyInteractiveDirections(document);
  refreshObservedMessages(document);
  applyDirectionToVisibleMessages(document);
  scheduleCleanup();
  loadMode();
  document.addEventListener("input", handleComposerInput, true);
  document.addEventListener("focusin", handleComposerFocus, true);
  document.addEventListener("keydown", handleKeyboardShortcut, true);
  startObserver();
  watchRouteChanges();
})();
