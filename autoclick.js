// ==UserScript==
// @name         Fast Search & Click PROSES + Auto Return (Turbo Queue Refill)
// @namespace    http://tampermonkey.net/
// @version      5.2
// @description  Filter "PROSES", Click, & Turbo Jump with Auto-Refill Queue
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
      const text = strongTag.innerText || "";
      currentNPSN = text.split("-")[0].trim();
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

    fetch("https://laptop.asshal.tech/proses?limit=50")
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const hold = getStorage(STORAGE_KEY_HOLD);
        const rows = doc.querySelectorAll("#table tbody tr");
        const newQueue = [];

        for (let i = 0; i < rows.length; i++) {
          const tds = rows[i].querySelectorAll("td");
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
        processTable();
      }
    }, 300);
  }

  function processTable() {
    const $ = unsafeWindow.jQuery;
    const $table = $("#table");

    setTimeout(() => {
      const hold = getStorage(STORAGE_KEY_HOLD);
      const queue = [];
      const $rows = $table.find("tbody tr");

      $rows.each(function () {
        const $tr = $(this);
        const $tds = $tr.find("td");
        if ($tds.length < 9) return;

        const rowNPSN = $tds.eq(6).text().trim();
        const $actionTd = $tds.eq(8);
        const actionHTML = $actionTd.html();

        if (hold.includes(rowNPSN)) return;

        if (actionHTML.includes("PROSES") && actionHTML.includes("href=")) {
          const linkMatch = actionHTML.match(/href="([^"]*)"/);
          if (linkMatch && linkMatch[1]) {
            queue.push(linkMatch[1]);
          }
        }
      });

      if (queue.length > 0) {
        const firstUrl = queue.shift();
        saveStorage(STORAGE_KEY_QUEUE, queue);

        const $firstBtn = $rows.find(`a[href="${firstUrl}"]`).find("button");
        if($firstBtn.length === 0){
             window.location.href = firstUrl;
        } else {
             $firstBtn.text("Start Queue! 🚀").css({
                "background-color": "#ff0055",
                "border-color": "#ff0055",
                "font-weight": "bold",
                color: "white",
             });
             window.location.href = firstUrl;
        }

      } else {
        const $nextPageLi = $(".pagination .page-next");
        const $nextPageLink = $nextPageLi.find("a");

        if ($nextPageLink.length > 0 && !$nextPageLi.hasClass("disabled")) {
          $nextPageLink
            .css({
              "background-color": "#00d2d3",
              color: "white",
              "font-weight": "bold",
            })
            .text("NEXT ➡");
          $nextPageLink[0].click();
          setTimeout(() => {
            processTable();
          }, 2000);
        }
      }
    }, 800);
  }
})();