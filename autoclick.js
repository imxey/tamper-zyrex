// ==UserScript==
// @name         Fast Search & Click PROSES + Auto Return (Turbo Fetch Mode)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Filter "PROSES", Click, & Turbo Jump from View Form using Fetch
// @author       Xeyla
// @match        https://laptop.asshal.tech/proses*
// @match        https://laptop.asshal.tech/view_form/*
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

  const currentUrl = window.location.href;

  if (currentUrl.includes("/view_form/")) {
    let currentNPSN = "";
    const strongTag = document.querySelector("strong");
    if (strongTag) {
      const text = strongTag.innerText || "";
      currentNPSN = text.split("-")[0].trim();
    }

    fetch("https://laptop.asshal.tech/proses?limit=50")
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        let hold = [];
        try {
          const raw = localStorage.getItem("hold");
          hold = raw ? JSON.parse(raw) : [];
        } catch (e) {
          hold = [];
        }

        const rows = doc.querySelectorAll("#table tbody tr");

        let targetFound = false;

        for (let i = 0; i < rows.length; i++) {
          const tds = rows[i].querySelectorAll("td");
          if (tds.length < 9) continue;

          const rowNPSN = tds[6].innerText.trim();

          const actionHTML = tds[8].innerHTML;

          if (rowNPSN === currentNPSN) {
            continue;
          }

          if (hold.includes(rowNPSN)) {
            continue;
          }

          if (actionHTML.includes("PROSES") && actionHTML.includes("href=")) {
            const linkMatch = actionHTML.match(/href="([^"]*)"/);
            if (linkMatch && linkMatch[1]) {
              const targetUrl = linkMatch[1];

              targetFound = true;

              window.location.href = targetUrl;
              return;
            }
          }
        }

        if (!targetFound) {
          window.location.href = "https://laptop.asshal.tech/proses";
        }
      })
      .catch((err) => {
        console.error("❌ Gagal fetch data:", err);

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
        satSetWatWet();
      }
    }, 300);
  }

  function satSetWatWet() {
    const $ = unsafeWindow.jQuery;
    const $table = $("#table");

    setTimeout(() => {
      let hold = [];
      try {
        const raw = localStorage.getItem("hold");
        hold = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(hold)) hold = [];
      } catch (e) {
        hold = [];
      }

      const $ths = $table.find("thead th");
      const npsnIdx = $ths.index($ths.filter('[data-field="npsn"]').first());

      const allProcessBtns = $("button.btn-warning").filter(function () {
        return $(this).text().trim() === "PROSES";
      });

      let chosenBtn = null;

      allProcessBtns.each(function () {
        if (chosenBtn) return;
        const $btn = $(this);
        const $tr = $btn.closest("tr");
        let npsnText = "";
        if (npsnIdx >= 0) {
          const $tds = $tr.find("td");
          if ($tds.length > npsnIdx) {
            npsnText = ($tds.eq(npsnIdx).text() || "").trim();
          }
        }

        if (npsnText && hold.includes(npsnText)) {
          return;
        }
        chosenBtn = $btn;
      });

      if (chosenBtn && chosenBtn.length > 0) {
        chosenBtn.text("Clicked!! 🚀").css({
          "background-color": "#ff0055",
          "border-color": "#ff0055",
          "font-weight": "bold",
          color: "white",
        });
        chosenBtn[0].click();
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
            satSetWatWet();
          }, 2000);
        } else {
        }
      }
    }, 800);
  }
})();
