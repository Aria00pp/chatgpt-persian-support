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

  let scheduled = false;

  function elementsMatching(root, selector) {
    const matches = [];

    if (root instanceof Element && root.matches(selector)) {
      matches.push(root);
    }

    if (root && typeof root.querySelectorAll === "function") {
      matches.push(...root.querySelectorAll(selector));
    }

    return matches;
  }

  function isMessageElement(element) {
    if (element.matches("[data-message-author-role='user'], [data-message-author-role='assistant']")) {
      return true;
    }

    // Articles are ChatGPT's semantic conversation-turn fallback when author-role
    // data attributes are absent. Articles outside the primary content are ignored.
    return element.matches("main article");
  }

  function isComposerElement(element) {
    if (element.closest(`.${MESSAGE_CLASS}, [data-message-author-role], main article`)) {
      return false;
    }

    if (element.id === "prompt-textarea" || element.classList.contains("ProseMirror")) {
      return true;
    }

    // Generic textbox selectors are accepted only in ChatGPT's primary content/form area,
    // which avoids changing search fields and textboxes in menus or dialogs.
    return Boolean(element.closest("main, form"));
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
    for (const element of elementsMatching(root, COMPOSER_SELECTOR)) {
      if (isComposerElement(element)) {
        markRtl(element, COMPOSER_CLASS);
      }
    }
  }

  function applyRtlToMessages(root = document) {
    for (const element of elementsMatching(root, MESSAGE_SELECTOR)) {
      if (isMessageElement(element)) {
        markRtl(element, MESSAGE_CLASS);
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
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyRtl(root.isConnected === false ? document : root);
    });
  }

  function startObserver() {
    const target = document.documentElement;
    if (!target) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      // Batch all mutations into one pass. Scanning the document is intentional:
      // streamed content and SPA transitions often replace a node's ancestors.
      if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
        scheduleApply(document);
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
