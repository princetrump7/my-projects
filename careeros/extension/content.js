// CareerOS LinkedIn Content Script
// Injects CareerOS buttons into LinkedIn pages

(function () {
  "use strict";

  function isLinkedInProfilePage() {
    return /^\/in\//.test(window.location.pathname) && window.location.pathname !== "/in/";
  }

  function isLinkedInJobPage() {
    return window.location.href.includes("/jobs/");
  }

  function injectAnalyzeButton() {
    if (!isLinkedInProfilePage()) return;

    var existingBtn = document.getElementById("careeros-analyze-btn");
    if (existingBtn) return;

    var actionSection =
      document.querySelector(
        ".pv-top-card--list, .profile-rail-card__actions, .ph5"
      );
    if (!actionSection) return;

    var btnContainer = document.createElement("div");
    btnContainer.style.cssText = "margin-top: 12px;";

    var btn = document.createElement("button");
    btn.id = "careeros-analyze-btn";
    btn.textContent = "Analyze with CareerOS";
    btn.style.cssText =
      "background: #E879A3; color: #000; border: none; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; transition: opacity 0.2s;";

    btn.onmouseenter = function () {
      btn.style.opacity = "0.9";
    };
    btn.onmouseleave = function () {
      btn.style.opacity = "1";
    };

    btn.onclick = function () {
      chrome.runtime.sendMessage({ action: "openSidePanel", tab: "analyze" });
    };

    btnContainer.appendChild(btn);
    actionSection.insertBefore(btnContainer, actionSection.firstChild);
  }

  function injectOptimizeButton() {
    if (!isLinkedInJobPage()) return;

    var existingBtn = document.getElementById("careeros-optimize-btn");
    if (existingBtn) return;

    var actionBar = document.querySelector(
      ".jobs-apply-button--top-card, .jobs-save-button, .job-details-jobs-unified-top-card__actions"
    );
    if (!actionBar) return;

    var btn = document.createElement("button");
    btn.id = "careeros-optimize-btn";
    btn.textContent = "Optimize CV for This Job";
    btn.style.cssText =
      "background: #E879A3; color: #000; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 8px; transition: opacity 0.2s;";

    btn.onmouseenter = function () {
      btn.style.opacity = "0.9";
    };
    btn.onmouseleave = function () {
      btn.style.opacity = "1";
    };

    btn.onclick = function () {
      chrome.runtime.sendMessage({ action: "openSidePanel", tab: "optimize" });
    };

    actionBar.appendChild(btn);
  }

  // Main injection logic
  function inject() {
    injectAnalyzeButton();
    injectOptimizeButton();
  }

  // Run on page load
  inject();

  // Observe DOM changes (LinkedIn is a SPA)
  var observer = new MutationObserver(function () {
    inject();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Listen for URL changes (SPA navigation)
  var lastUrl = window.location.href;
  var urlObserver = new MutationObserver(function () {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(inject, 1000);
    }
  });

  urlObserver.observe(document.querySelector("title") || document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();
