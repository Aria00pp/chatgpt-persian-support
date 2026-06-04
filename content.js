(() => {
  "use strict";

  const COMPOSER_CLASS = "cgpt-rtl-composer";
  const MESSAGE_CLASS = "cgpt-rtl-message";
  const APPLIED_CLASS = "cgpt-rtl-applied";

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

  const pendingRoots = new Set();
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
    if (element.id === "prompt-textarea" && !isExcludedUiArea(element)) {
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
      .filter((element) => !element.closest("pre, code, table, [role='toolbar'], [role='menu']"));

    if (textBlockTargets.length > 0) {
      return topLevelTargets(textBlockTargets);
    }

    // Plain user messages may not contain semantic prose children. Author-role
    // containers are safer fallbacks than whole article turns with action bars.
    const authorRoleTarget = messageElement.matches("[data-message-author-role]")
      ? messageElement
      : messageElement.querySelector("[data-message-author-role='user'], [data-message-author-role='assistant']");

    return [authorRoleTarget || messageElement];
  }

  function markRtl(element, className) {
    if (!element.classList.contains(className)) {
      element.classList.add(APPLIED_CLASS, className);
    }

    if (element.getAttribute("dir") !== "rtl") {
      element.setAttribute("dir", "rtl");
    }
  }

  function applyRtlToComposer(root = document) {
    for (const element of elementsMatching(root, COMPOSER_SELECTOR, true)) {
      if (isComposerElement(element)) {
        markRtl(element, COMPOSER_CLASS);
      }
    }
  }

  function applyRtlToMessages(root = document) {
    for (const messageElement of elementsMatching(root, MESSAGE_SELECTOR, true)) {
      if (!isMessageElement(messageElement)) {
        continue;
      }

      for (const target of getMessageTextTargets(messageElement)) {
        markRtl(target, MESSAGE_CLASS);
      }
    }
  }

  function applyRtl(root = document) {
    try {
      applyRtlToComposer(root);
      applyRtlToMessages(root);
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
        applyRtl(document);
        return;
      }

      const roots = [...pendingRoots];
      pendingRoots.clear();
      for (const pendingRoot of roots) {
        applyRtl(pendingRoot.isConnected ? pendingRoot : document);
      }
    });
  }

  function startObserver() {
    const target = document.documentElement;
    if (!target) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          scheduleApply(mutation.target);
        }
      }
    });

    observer.observe(target, { childList: true, subtree: true });
  }

  function watchRouteChanges() {
    window.addEventListener("popstate", () => scheduleApply(document));
    window.addEventListener("pageshow", () => scheduleApply(document));

    for (const method of ["pushState", "replaceState"]) {
      const original = history[method];
      if (typeof original !== "function" || original.__cgptRtlWrapped) {
        continue;
      }

      const wrapped = function (...args) {
        const result = original.apply(this, args);
        scheduleApply(document);
        return result;
      };

      Object.defineProperty(wrapped, "__cgptRtlWrapped", { value: true });
      history[method] = wrapped;
    }
  }

  applyRtl(document);
  startObserver();
  watchRouteChanges();
})();
