// ==UserScript==
// @name         Fast Search & Click PROSES (Last Page)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Filter "PROSES", Pindah ke Halaman Terakhir, Scan dari Bawah, Skip data "Hold"
// @author       Xeyla
// @match        https://laptop.asshal.tech/proses*
// @match        https://laptop.asshal.tech/view_form/*
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;

    // --- 1. Auto Return jika masuk ke View Form ---
    if (currentUrl.includes('/view_form/')) {
        console.log("Terdeteksi di halaman View Form, kembali ke Verifikasi...");
        setTimeout(() => {
            window.location.href = 'https://laptop.asshal.tech/proses';
        }, 500);
        return;
    }

    // --- 2. Main Logic di Halaman Proses ---
    if (currentUrl.includes('/proses')) {
        const waitLoad = setInterval(() => {
            if (typeof unsafeWindow.jQuery !== 'undefined' && unsafeWindow.jQuery('#table').length) {
                clearInterval(waitLoad);
                gasPolRemBlong();
            }
        }, 300);
    }

    function gasPolRemBlong() {
        const $ = unsafeWindow.jQuery;
        const $table = $('#table');

        // Reset search agar tombol PROSES muncul
        $table.bootstrapTable('resetSearch', 'PROSES');

        setTimeout(() => {
            // Cek Navigasi Halaman
            const options = $table.bootstrapTable('getOptions');
            const totalPages = options.totalPages;
            const currentPage = options.pageNumber;

            console.log(`Posisi: Halaman ${currentPage} dari ${totalPages}`);

            // Jika belum di halaman terakhir, pindah dulu
            if (totalPages > 1 && currentPage !== totalPages) {
                console.log("🚀 Otw pindah ke halaman terakhir...");
                $table.bootstrapTable('selectPage', totalPages);
                // Beri waktu loading tabel setelah pindah page
                setTimeout(scanAndClickBottomUp, 1500);
            } else {
                // Sudah di halaman terakhir (atau cuma 1 halaman)
                scanAndClickBottomUp();
            }

        }, 1000);

        function scanAndClickBottomUp() {
            // Ambil daftar HOLD dari LocalStorage
            let hold = [];
            try {
                const raw = localStorage.getItem("hold");
                hold = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(hold)) hold = [];
            } catch (e) {
                hold = [];
            }
            console.log("List Hold:", hold);

            // Identifikasi Kolom NPSN
            const $ths = $table.find("thead th");
            const npsnIdx = $ths.index($ths.filter('[data-field="npsn"]').first());

            // Ambil semua tombol PROSES yang terlihat
            const allProcessBtns = $table.find('tbody tr:visible').find('button.btn-warning').filter(function() {
                return $(this).text().trim() === 'PROSES';
            });

            // --- REVERSE LOGIC (Dari Bawah ke Atas) ---
            const reversedBtns = allProcessBtns.get().reverse();
            let chosenBtn = null;

            for (let btnDOM of reversedBtns) {
                const $btn = $(btnDOM);
                const $tr = $btn.closest("tr");
                let npsnText = "";

                // Ambil text NPSN
                if (npsnIdx >= 0) {
                    const $tds = $tr.find("td");
                    if ($tds.length > npsnIdx) {
                        npsnText = ($tds.eq(npsnIdx).text() || "").trim();
                    }
                }

                if (npsnText && hold.includes(npsnText)) {
                    continue;
                }

                chosenBtn = $btn;
                break;
            }

            if (chosenBtn && chosenBtn.length > 0) {
                console.log("Target ditemukan! Klik...");
                chosenBtn.text('Processing 🚀').css({
                    'background-color': '#ff0055',
                    'border-color': '#ff0055',
                    'font-weight': 'bold',
                    'color': 'white'
                });

                chosenBtn[0].click();
            } else {
                console.log("Tidak ada tombol yang bisa diklik di halaman ini (Semua di-hold atau tabel kosong).");
            }
        }
    }
})();