// ==UserScript==
// @name         Fast Search & Click PROSES + Auto Return
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Filter "PROSES", Click, and Auto Return from view_form
// @author       Xeyla
// @match        https://laptop.asshal.tech/verifikasi*
// @match        https://laptop.asshal.tech/view_form/*
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;

    // --- LOGIKA 1: Jika berada di halaman VIEW FORM, kembalikan ke VERIFIKASI ---
    if (currentUrl.includes('/view_form/')) {
        console.log("Terdeteksi di halaman View Form, kembali ke Verifikasi...");
        // Beri jeda sedikit (500ms) agar tidak dianggap spam/error oleh browser, lalu pindah
        setTimeout(() => {
            window.location.href = 'https://laptop.asshal.tech/verifikasi';
        }, 500);
        return;
    }

    // --- LOGIKA 2: Jika berada di halaman VERIFIKASI, jalankan Auto Clicker ---
    if (currentUrl.includes('/verifikasi')) {
        const waitLoad = setInterval(() => {
            if (typeof unsafeWindow.jQuery !== 'undefined' && unsafeWindow.jQuery('#table').length) {
                clearInterval(waitLoad);
                satSetWatWet();
            }
        }, 300);
    }

    function satSetWatWet() {
        const $ = unsafeWindow.jQuery;
        const $table = $('#table');

        // Reset search filter ke "PROSES"
        $table.bootstrapTable('resetSearch', 'PROSES');

        setTimeout(() => {
            const allProcessBtns = $('button.btn-warning').filter(function() {
                return $(this).text().trim() === 'PROSES';
            });

            const processBtn = allProcessBtns.eq(0);

            if (processBtn.length > 0) {
                processBtn.text('Clicked!! 🚀').css({
                    'background-color': '#ff0055',
                    'border-color': '#ff0055',
                    'font-weight': 'bold'
                });

                // Klik tombolnya (akan menyebabkan web pindah ke view_form)
                processBtn[0].click();
            } else {
                console.log("Gak nemu tombol PROSES, pekerjaan selesai!");
            }
        }, 800);
    }
})();