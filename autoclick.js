// ==UserScript==
// @name         Fast Search & Click PROSES + Auto Return (Auto Next Page)
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Filter "PROSES", Click, Auto Return, & Auto Next Page if Stuck
// @author       Xeyla
// @match        https://laptop.asshal.tech/proses*
// @match        https://laptop.asshal.tech/view_form/*
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

  const currentUrl = window.location.href;

  if (currentUrl.includes("/view_form/")) {
    console.log(
      "Terdeteksi di halaman View Form, bye-bye~ Balik ke Verifikasi...",
    );
    setTimeout(() => {
      window.location.href = "https://laptop.asshal.tech/proses";
    }, 500);
    return;
  }

  if (currentUrl.includes("/proses")) {
    const waitLoad = setInterval(() => {
      //
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

    console.log("Table ready! Lagi nyari target nih...");

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
        console.log("Ketemu! Clicking PROSES...");
        chosenBtn[0].click();
      } else {
        // Cek jika di halaman 1 dan tidak ada PROSES, langsung next page
        const $activePage = $(".pagination .page-number.active");
        const isFirstPage =
          $activePage.length > 0 && $activePage.text().trim() === "1";
        if (isFirstPage) {
          console.log("Halaman 1 kosong, auto next ke halaman 2...");
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
            return;
          }
        }
        // Default: log dan next page jika ada, atau mentok
        console.log(
          "Duh, gak ada tombol PROSES di page ini. Coba cek page sebelah ya...",
        );
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
          console.log("Gas ke Page berikutnya! ✈️");
          $nextPageLink[0].click();
          setTimeout(() => {
            satSetWatWet();
          }, 2000);
        } else {
          console.log(
            "Yah, udah mentok beb. Gak ada page lagi atau tombolnya disabled. 😢",
          );
        }
      }
    }, 800);
  }
})();
