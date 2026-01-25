// ==UserScript==
// @name         Fast Search & Click PROSES (Turbo Reverse + Queue + Auto Page)
// @namespace    http://tampermonkey.net/
// @version      9.0
// @description  Turbo Queue + Reverse Scan + Auto Refill + Skip Button
// @author       Xeyla
// @match        https://laptop.asshal.tech/proses*
// @match        https://laptop.asshal.tech/view_form/*
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

  const currentUrl = window.location.href;
  const STORAGE_KEY_HOLD = "hold";
  const STORAGE_KEY_QUEUE = "process_queue";
  const STORAGE_KEY_PAGE = "last_active_page";

  function getStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  if (currentUrl.includes("/view_form/")) {
    let currentNPSN = "";
    const strongTag = document.querySelector("strong");
    if (strongTag) {
      currentNPSN = strongTag.innerText.split("-")[0].trim();
    }

    if (currentNPSN) {
      const hold = getStorage(STORAGE_KEY_HOLD);
      if (!hold.includes(currentNPSN)) {
        hold.push(currentNPSN);
        saveStorage(STORAGE_KEY_HOLD, hold);
      }
    }

    const queue = getStorage(STORAGE_KEY_QUEUE);

    if (queue.length > 0) {
      const nextUrl = queue.shift();
      saveStorage(STORAGE_KEY_QUEUE, queue);
      window.location.href = nextUrl;
      return;
    }

    let lastPage = 1;
    try {
      lastPage = localStorage.getItem(STORAGE_KEY_PAGE) || 1;
    } catch (e) {}

    fetch(`https://laptop.asshal.tech/proses?page=${lastPage}&limit=50`)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const hold = getStorage(STORAGE_KEY_HOLD);
        const rows = Array.from(doc.querySelectorAll("#table tbody tr"));
        const reversedRows = rows.reverse();
        const newQueue = [];

        for (let tr of reversedRows) {
          const tds = tr.querySelectorAll("td");
          if (tds.length < 9) continue;

          const rowNPSN = tds[6].innerText.trim();
          const actionHTML = tds[8].innerHTML;

          if (rowNPSN === currentNPSN) continue;
          if (hold.includes(rowNPSN)) continue;

          if (actionHTML.includes("PROSES") && actionHTML.includes("href=")) {
            const linkMatch = actionHTML.match(/href="([^"]*)"/);
            if (linkMatch && linkMatch[1]) {
              newQueue.push(linkMatch[1]);
            }
          }
        }

        if (newQueue.length > 0) {
          const nextUrl = newQueue.shift();
          saveStorage(STORAGE_KEY_QUEUE, newQueue);
          window.location.href = nextUrl;
        } else {
          window.location.href = "https://laptop.asshal.tech/proses";
        }
      })
      .catch(() => {
        window.location.href = "https://laptop.asshal.tech/proses";
      });

    return;
  }

  if (currentUrl.includes("/proses")) {
    const waitLoad = setInterval(() => {
      if (
        typeof unsafeWindow.jQuery !== "undefined" &&
        unsafeWindow.jQuery("#table").length
      ) {
        clearInterval(waitLoad);
        initProsesScript();
      }
    }, 300);
  }

  function initProsesScript() {
    const $ = unsafeWindow.jQuery;
    const $table = $("#table");

    injectSkipButton();
    $table.bootstrapTable("resetSearch", "PROSES");

    setTimeout(() => {
      checkAndNavigatePage();
    }, 1000);

    function checkAndNavigatePage() {
      const options = $table.bootstrapTable("getOptions");
      const totalPages = options.totalPages;
      const currentPage = options.pageNumber;

      localStorage.setItem(STORAGE_KEY_PAGE, currentPage);

      if (totalPages > 1 && currentPage === 1) {
        $table.bootstrapTable("selectPage", totalPages);
        localStorage.setItem(STORAGE_KEY_PAGE, totalPages);
        setTimeout(scanAndClickBottomUp, 2000);
      } else {
        scanAndClickBottomUp();
      }
    }

    function scanAndClickBottomUp() {
      const options = $table.bootstrapTable("getOptions");
      const currentPage = options.pageNumber;

      localStorage.setItem(STORAGE_KEY_PAGE, currentPage);

      const hold = getStorage(STORAGE_KEY_HOLD);
      const queue = [];
      const $rows = $table.find("tbody tr:visible").get().reverse();

      let chosenBtn = null;
      let chosenNpsn = "";
      let firstUrl = "";

      for (let tr of $rows) {
        const $tr = $(tr);
        const $tds = $tr.find("td");
        if ($tds.length < 9) continue;

        const rowNPSN = $tds.eq(6).text().trim();
        const $actionTd = $tds.eq(8);
        const actionHTML = $actionTd.html();

        if (hold.includes(rowNPSN)) continue;

        if (actionHTML.includes("PROSES") && actionHTML.includes("href=")) {
          const linkMatch = actionHTML.match(/href="([^"]*)"/);
          if (linkMatch && linkMatch[1]) {
            const url = linkMatch[1];
            queue.push(url);

            if (!chosenBtn) {
              chosenBtn = $tr.find("button.btn-warning").first();
              chosenNpsn = rowNPSN;
              firstUrl = url;
            }
          }
        }
      }

      if (queue.length > 0) {
        queue.shift();
        saveStorage(STORAGE_KEY_QUEUE, queue);

        if (chosenBtn) {
          window.__LAST_NPSN__ = chosenNpsn;
          chosenBtn.text("Start Queue! 🚀").css({
            "background-color": "#ff0055",
            "border-color": "#ff0055",
            "font-weight": "bold",
            color: "white",
          });
          chosenBtn[0].click();
        } else {
          window.location.href = firstUrl;
        }
      } else {
        if (currentPage > 1) {
          $table.bootstrapTable("prevPage");
          setTimeout(scanAndClickBottomUp, 2000);
        } else {
          alert("🎉 Pekerjaan selesai!");
        }
      }
    }
  }

  function injectSkipButton() {
    if (document.getElementById("skipBtn")) return;
    const btn = document.createElement("button");
    btn.id = "skipBtn";
    btn.innerText = "SKIP THIS 🚫";
    btn.style.cssText = `position: fixed; bottom: 20px; right: 20px; z-index: 99999; padding: 12px 20px; background: #d9534f; color: #fff; border: 2px solid white; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);`;
    btn.onclick = () => {
      const npsn = window.__LAST_NPSN__;
      if (!npsn) {
        alert("Belum ada data.");
        return;
      }
      let hold = getStorage(STORAGE_KEY_HOLD);
      if (!hold.includes(npsn)) {
        hold.push(npsn);
        saveStorage(STORAGE_KEY_HOLD, hold);
      }
      btn.innerText = "SKIPPED! RELOADING...";
      setTimeout(() => location.reload(), 500);
    };
    document.body.appendChild(btn);
  }
})();
