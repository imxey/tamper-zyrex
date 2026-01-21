// ==UserScript==
// @name         Fast Search & Click PROSES + Auto Return
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Filter "PROSES", Click, and Auto Return from view_form
// @author       Xeyla
// @match        https://laptop.asshal.tech/proses*
// @match        https://laptop.asshal.tech/view_form/*
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

  const currentUrl = window.location.href;

  if (currentUrl.includes("/view_form/")) {
    console.log("Terdeteksi di halaman View Form, kembali ke Verifikasi...");
    setTimeout(() => {
      window.location.href = "https://laptop.asshal.tech/proses";
    }, 500);
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
      //
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
        });
        chosenBtn[0].click();
      } else {
        console.log(
          "Tidak ada tombol PROSES yang cocok (semua di-hold atau tidak ditemukan).",
        );
      }
    }, 800);
  }
})();
