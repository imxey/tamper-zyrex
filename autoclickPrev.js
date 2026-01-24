// ==UserScript==
// @name         Fast Search & Click PROSES (Turbo Reverse + Auto Prev Page)
// @namespace    http://tampermonkey.net/
// @version      8.0
// @description  Turbo Fetch (Background Scan) + Reverse Logic (Akhir ke Awal) + Auto Previous Page
// @author
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
      currentNPSN = strongTag.innerText.split("-")[0].trim();
    }

    let lastPage = 1;
    try {
      lastPage = localStorage.getItem("last_active_page") || 1;
    } catch (e) {}

    fetch(`https://laptop.asshal.tech/proses?page=${lastPage}&limit=50`)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        let hold = [];
        try {
          hold = JSON.parse(localStorage.getItem("hold")) || [];
        } catch {
          hold = [];
        }

        const rows = Array.from(doc.querySelectorAll("#table tbody tr"));

        const reversedRows = rows.reverse();

        let targetFound = false;

        for (let tr of reversedRows) {
          const tds = tr.querySelectorAll("td");
          if (tds.length < 9) continue;

          const rowNPSN = tds[6].innerText.trim();
          const actionHTML = tds[8].innerHTML;

          if (rowNPSN === currentNPSN) continue;

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

      localStorage.setItem("last_active_page", currentPage);

      if (totalPages > 1 && currentPage === 1) {
        $table.bootstrapTable("selectPage", totalPages);

        localStorage.setItem("last_active_page", totalPages);
        setTimeout(scanAndClickBottomUp, 2000);
      } else {
        scanAndClickBottomUp();
      }
    }

    function scanAndClickBottomUp() {
      const options = $table.bootstrapTable("getOptions");
      const currentPage = options.pageNumber;

      localStorage.setItem("last_active_page", currentPage);

      let hold = [];
      try {
        hold = JSON.parse(localStorage.getItem("hold")) || [];
      } catch {
        hold = [];
      }

      const $ths = $table.find("thead th");
      const npsnIdx = $ths.index($ths.filter('[data-field="npsn"]').first());

      const rows = $table.find("tbody tr:visible").get().reverse();

      let chosenBtn = null;
      let chosenNpsn = "";

      for (let tr of rows) {
        const $tr = $(tr);
        const $btn = $tr
          .find("button.btn-warning")
          .filter((i, el) => $(el).text().trim() === "PROSES");

        if ($btn.length === 0) continue;

        let npsnText = "";
        if (npsnIdx >= 0) {
          npsnText = ($tr.find("td").eq(npsnIdx).text() || "").trim();
        }

        if (npsnText && hold.includes(npsnText)) continue;

        chosenBtn = $btn.first();
        chosenNpsn = npsnText;
        break;
      }

      if (chosenBtn) {
        window.__LAST_NPSN__ = chosenNpsn;

        chosenBtn.text("Processing 🚀").css({
          "background-color": "#ff0055",
          "border-color": "#ff0055",
          "font-weight": "bold",
          color: "white",
        });

        chosenBtn[0].click();
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
      let hold = JSON.parse(localStorage.getItem("hold")) || [];
      if (!hold.includes(npsn)) {
        hold.push(npsn);
        localStorage.setItem("hold", JSON.stringify(hold));
      }
      btn.innerText = "SKIPPED! RELOADING...";
      setTimeout(() => location.reload(), 500);
    };
    document.body.appendChild(btn);
  }
})();
