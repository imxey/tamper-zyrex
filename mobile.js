// ==UserScript==
// @name         Sistem Verifikasi & Monitoring (All-in-One Ultimate)
// @namespace    http://asshal.tech/
// @version      34.0-combo-ultimate
// @description  Gabungan: Dashboard Mobile + Sticky Action + Tap Nav + Auto Next Queue + Auto Return
// @author       System Admin & Xeyla's Bestie
// @match        https://laptop.asshal.tech/form/*
// @match        https://laptop.asshal.tech/verifikasi*
// @match        https://laptop.asshal.tech/view_form/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.6/viewer.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      owo.mars-project.my.id
// @connect      owo-zyrex.mars-project.my.id
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==

(function () {
  "use strict";

  const currentUrl = window.location.href;

  if (currentUrl.includes("/view_form/")) {
    console.log("Terdeteksi di halaman View Form, kembali ke Verifikasi...");
    setTimeout(() => {
      window.location.href = "https://laptop.asshal.tech/verifikasi";
    }, 500);
    return;
  }

  if (currentUrl.includes("/verifikasi")) {
    const waitLoad = setInterval(() => {
      if (
        typeof unsafeWindow.jQuery !== "undefined" &&
        unsafeWindow.jQuery("#table").length
      ) {
        clearInterval(waitLoad);
        satSetWatWet();
      }
    }, 300);
    return;
  }

  function satSetWatWet() {
    const $ = unsafeWindow.jQuery;
    const $table = $("#table");

    $table.bootstrapTable("resetSearch", "PROSES");

    setTimeout(() => {
      const allProcessBtns = $("button.btn-warning").filter(function () {
        return $(this).text().trim() === "PROSES";
      });

      const processBtn = allProcessBtns.eq(0);

      if (processBtn.length > 0) {
        processBtn.text("Clicked!! 🚀").css({
          "background-color": "#ff0055",
          "border-color": "#ff0055",
          "font-weight": "bold",
        });

        processBtn[0].click();
      } else {
        console.log(
          "Gak nemu tombol PROSES, pekerjaan selesai atau istirahat dulu bestie!",
        );
      }
    }, 800);
  }

  if (!currentUrl.includes("/form/")) return;

  const BASE_API_URL = "https://owo-zyrex.mars-project.my.id";
  const AUTH_API_URL = "https://owo-zyrex.mars-project.my.id/login";
  const TOKEN_EXPIRY_MS = 3 * 60 * 60 * 1000;

  let formState = {
    dropdowns: {},
    sn_manual: "",
    tgl_manual: "",
    formCollapsed: true,
  };

  let lastHistoryDate = "";
  // Store comments from /awb API response (mobile)
  let awbComments = [];

  const REASON_MAPPING = {
    "bapp_hal2_Simpulan Belum Dipilih":
      "(1A) Simpulan BAPP pada hal 2 belum dipilih",
    "bapp_hal2_Tidak ada paraf": "(1B) Simpulan BAPP pada hal 2 belum diparaf",
    "nm_ttd_bapp_Tidak Terdaftar Dapodik":
      "(1C) Pihak sekolah yang menandatangani BAPP tidak terdaftar dalam data Dapodik",
    "bapp_hal1_Ceklis tidak lengkap":
      "(1D) Ceklis BAPP tidak lengkap pada halaman 1",
    "bapp_hal2_Ceklis tidak lengkap":
      "(1E) Ceklis BAPP tidak lengkap pada halaman 2",
    "ket_tgl_bapp_Tidak ada": "(1F) Tanggal pada BAPP Hal 2 tidak ada",
    "nm_ttd_bapp_TTD tidak ada":
      "(1G) Tidak ada tanda tangan dari Pihak Sekolah atau Pihak Kedua",
    "nm_ttd_bapp_Tidak konsisten":
      "(1H) Data penandatangan pada hal 1 dan hal 2 BAPP tidak konsisten",
    "bapp_hal1_Double ceklis": "(1I) Double ceklis pada halaman 1 BAPP",
    "nm_ttd_bapp_Data tidak lengkap":
      "(1J) Data Pihak Sekolah pada BAPP tidak lengkap",
    "bapp_hal1_Data BAPP sekolah tidak sesuai":
      "(1K) Data BAPP sekolah tidak sesuai",
    "bapp_hal1_Tidak terlihat jelas":
      "(1L) BAPP halaman 1 tidak terlihat jelas",
    "bapp_hal2_Tidak terlihat jelas":
      "(1M) BAPP Halaman 2 tidak terlihat jelas",
    "bapp_hal1_Data tidak lengkap": "(1N) Data BAPP halaman 1 tidak lengkap",
    "stempel_Tidak sesuai": "(1O) Stempel pada BAPP halaman 2 tidak sesuai",
    "stempel_Tidak ada": "(1P) Stempel Tidak Ada",
    "bapp_hal1_Tidak Sesuai/Rusak/Tidak Ada":
      "(1Q) Ceklis BAPP hal 1 terdapat ceklis TIDAK SESUAI",
    "bapp_hal1_No Surat Tugas": "(1R) Nomor surat tugas tidak ada",
    bapp_hal1_Diedit: "(1S) BAPP Hal 1 tidak boleh diedit digital",
    bapp_hal2_Diedit: "(1T) BAPP Hal 2 tidak boleh diedit digital",
    "nm_ttd_bapp_NIP Tidak Ada":
      "(1U) NIP/NIK penandatangan pihak sekolah tidak ada",
    "bc_bapp_sn_Tidak Sesuai": "(1V) Serial Number BAPP berbeda dengan Unit",
    "bapp_hal1_Tidak ada": "(1W) BAPP Hal 1 tidak ada",
    "bapp_hal2_Tidak ada": "(1X) BAPP Hal 2 tidak ada",
    "bapp_hal2_Ceklis Belum Dapat Diterima": "(1Y) Ceklis Belum Dapat Diterima",
    "bapp_hal2_Tanggal tidak konsisten":
      "(1Z) Tanggal pada BAPP hal 2 tidak konsisten",
    "ket_tgl_bapp_Beda Hal 1 dan 2":
      "(1AA) Tanggal pada BAPP hal 1 dan 2 tidak konsisten",
    "nm_ttd_bapp_Tidak konsisten": "(1AB) Data penandatangan beda hal 1 dan 2",
    "ket_tgl_bapp_Tidak AAda": "(1AC) Tanggal BAPP tidak ada",
    "stempel_Tidak terlihat jelas": "(1AD) Stempel tidak terlihat",
    "bc_bapp_sn_SN Tidak Ada": "(1AE) SN pada BAPP tidak ada",
    "bc_bapp_sn_Tidak ada": "(1AF) Barcode SN pada BAPP tidak ada",
    "bc_bapp_sn_Tidak terlihat jelas": "(1AG) Barcode SN pada BAPP tidak jelas",
    "nm_ttd_bapp_Tidak ada nama terang pada bagian tanda tangan":
      "(1AH) Tidak ada nama terang",
    "bc_bapp_sn_Tidak sesuai": "(1AI) Barcode SN tidak sesuai web",
    "bapp_hal2_Ceklis Minus": "(1AJ) Ceklis BAPP hal 2 minus",
    "bapp_hal2_Double Ceklis": "(1AK) Double ceklis pada halaman 2",
    "bapp_hal1_BAPP terpotong": "(1AL) BAPP Halaman 1 terpotong",
    "bapp_hal2_BAPP terpotong": "(1AM) BAPP Halaman 2 terpotong",
    "bapp_hal1_Pihak pertama bukan dari tenaga pendidik":
      "(1AN) Pihak pertama hanya boleh dari kepala sekolah/wakil kepala sekolah/guru/pengajar/operator sekolah",
    "f_unit_Tidak ada": "(2A) Foto kelengkapan Laptop tidak ada",
    "f_unit_Tidak sesuai": "(2B) Foto kelengkapan Laptop tidak sesuai",
    "sn_laptop_Tidak Jelas": "(3A) Foto serial number tidak jelas",
    "sn_laptop_Input Tidak Sesuai": "(3B) Serial number input tidak sesuai",
    "sn_laptop_Tidak Ada": "(3C) Foto Serial Number tidak ada",
    sn_laptop_Duplikat: "(3D) SN Duplikat",
    "sn_laptop_Tidak Valid": "(3E) SN tidak valid",
    "f_papan_identitas_Tidak sesuai": "(4A) Foto sekolah tidak sesuai",
    "f_papan_identitas_Tidak ada": "(4B) Foto sekolah tidak ada",
    "f_box_pic_Tidak sesuai": "(4C) Foto Box dan PIC tidak sesuai",
    "f_box_pic_Tidak ada": "(4D) Foto Box dan PIC tidak ada",
    "f_papan_identitas_Tidak Jelas": "(4E) Foto sekolah tidak jelas",
    "geo_tag_Tidak sesuai": "(5A) Geo Tagging tidak sesuai",
    "geo_tag_Tidak ada": "(5B) Geo Tagging tidak ada",
    "geo_tag_Tidak terlihat jelas": "(5C) Geo Tagging tidak jelas",
    "spesifikasi_dxdiag_Tidak sesuai": "(6A) DxDiag tidak sesuai",
    "spesifikasi_dxdiag_Tidak ada": "(6B) DxDiag tidak ada",
    "spesifikasi_dxdiag_Tidak terlihat jelas": "(6C) DxDiag tidak jelas",
  };

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.6/viewer.min.css";
  document.head.appendChild(link);

  GM_addStyle(`
        body { padding-bottom: 90px !important; overflow-x: hidden; }

        #sys-dashboard { font-family: 'Segoe UI', sans-serif; margin: 10px; background: #fff; border: 1px solid #d1d1d1; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: auto; }
        .sys-header { background: #f5f5f5; padding: 10px 15px; border-bottom: 1px solid #ddd; display: flex; flex-direction: column; gap: 10px; justify-content: center; align-items: flex-start; }
        .sys-header h3 { margin: 0; font-size: 14px; font-weight: 700; color: #2c3e50; }

        .sys-header-right { display: flex; align-items: center; gap: 5px; width: 100%; justify-content: space-between; }
        .sys-status-label { font-size: 11px; padding: 4px 8px; background: #3498db; color: white; border-radius: 2px; font-weight: 600; }
        .sys-btn-reset { font-size: 10px; padding: 6px 10px; border: 1px solid #ccc; background: #fff; border-radius: 3px; cursor: pointer; color: #555; display: flex; align-items: center; gap: 3px; }

        .sys-content { padding: 15px; }
        .sys-section-header { font-size: 14px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; border-bottom: 2px solid #3498db; display: inline-block; padding-bottom: 5px; }
        .sys-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 20px; }
        .sys-gallery-item { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; cursor: pointer; }
        .sys-gallery-item img { width: 100%; height: 80px; object-fit: cover; display: block; }
        .sys-gallery-caption { padding: 3px; font-size: 9px; text-align: center; background: #f9f9f9; border-top: 1px solid #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .sys-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .sys-table th { background: #ecf0f1; padding: 8px; text-align: left; border-bottom: 2px solid #bdc3c7; }
        .sys-table td { padding: 6px 8px; border-bottom: 1px solid #eee; }

        .sys-modal {display: none; position: fixed; z-index: 2147483647; left: 0; top: 0; width: 100%; height: 100%; overflow: auto;background-color: rgba(0,0,0,0.8); backdrop-filter: blur(5px);align-items: center; justify-content: center;}
        .sys-modal-content {background-color: #fefefe; padding: 20px; border: 1px solid #888; width: 85%; max-width: 350px; border-radius: 10px;box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; font-family: 'Segoe UI', sans-serif;}

        /* STICKY BOXES - MOBILE FIX */
        .sys-sticky-box {
            position: fixed !important;
            z-index: 100 !important;
            background: rgba(255, 255, 255, 0.98);
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            pointer-events: auto !important;
            font-family: 'Inter', 'Segoe UI', sans-serif !important;
            border: 1px solid rgba(0,0,0,0.1);
            left: 2% !important;
            right: 2% !important;
            width: 96% !important;
            padding: 8px !important;
            box-sizing: border-box !important;
        }

        /* INFO BOX (Left) -> Fix Layout Tumpuk & Hapus Garis Tabrakan */
        #sys-sticky-left {
            top: 55px !important;
            height: auto !important;
            background: #fff !important;
            display: block !important;
            padding: 12px !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
            z-index: 1000 !important;
        }

        #sys-sticky-left .sys-card-header {
            padding-bottom: 8px;
            border-bottom: 1px dashed #ddd;
            margin-bottom: 8px;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
        }

        #sys-sticky-left .sys-card-header h2 {
            font-size: 13px;
            font-weight: 800;
            color: #0056b3;
            margin: 0 0 2px 0;
        }

        #sys-sticky-left .sys-card-npsn {
            font-size: 11px;
            color: #888;
        }

        #sys-sticky-left .sys-serial-section {
            margin-bottom: 8px;
            display: block;
        }
        #sys-sticky-left .sys-serial-label {
            font-size: 9px;
            font-weight: bold;
            color: #e11d48;
            display: block;
            margin-bottom: 2px;
            text-transform: uppercase;
        }
        #sys-sticky-left .sys-serial-number {
            font-size: 16px;
            font-weight: 900;
            color: #1e293b;
            display: block;
            line-height: 1.2;
        }

        #sys-sticky-left .sys-info-alamat {
            font-size: 10px;
            color: #555;
            line-height: 1.3;
            border-top: 1px solid #f0f0f0;
            padding-top: 6px;
            margin-top: 6px;
        }

        .sys-rotate-btn {
            background: #3498db;
            color: white;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .sys-rotate-btn:hover {
            background: #2980b9;
        }

        .sys-rotate-btn:active {
            transform: scale(0.95);
        }

        /* FORM BOX (Right) -> Collapsible */
        #sys-sticky-right {
            top: auto !important;
            bottom: 70px !important;
            max-height: 40vh !important;
            overflow-y: auto !important;
            border-top: 3px solid #3498db;
            transition: max-height 0.3s ease;
        }

        #sys-sticky-right.collapsed {
            max-height: 35px !important; /* Cuma judul doang */
            overflow: hidden !important;
        }

        .sys-sticky-title {
            font-size: 12px !important;
            margin-bottom: 5px !important;
            padding-bottom: 5px;
            font-weight: bold;
            text-align: center;
            border-bottom: 1px solid #eee;
            cursor: pointer; /* Biar keliatan bisa diklik */
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .sys-form-row {
            margin-bottom: 5px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 2px;
        }
        .sys-form-label {
            font-size: 10px !important;
            width: 40%;
            margin-bottom: 0;
            line-height: 1.1;
        }
        .sys-form-select, .sys-form-input {
            width: 58%;
            height: 30px;
            padding: 2px 5px;
            font-size: 12px;
        }

        /* Action Bar */
        #sys-action-bar {
            position: fixed; bottom: 0; left: 0; width: 100%;
            z-index: 2147483647; background: white;
            border-top: 1px solid #ddd; padding: 8px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            display: flex; justify-content: center;
            box-sizing: border-box;
        }

        #sys-btn-dynamic-main {
            font-size: 13px !important;
            padding: 10px !important;
            width: 100% !important;
            border-radius: 6px !important;
        }

        /* Navigation Areas */
        .sys-nav-area {
            position: fixed;
            top: 0;
            height: 100%;
            width: 20%;
            z-index: 999;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            /* background: rgba(255,0,0,0.2); Debug only */
        }
        #sys-nav-prev { left: 0; }
        #sys-nav-next { right: 0; }

        .sys-hidden { display: none; }
        
        /* --- CUSTOM ALERT MODAL --- */
        .sys-alert-overlay {position: fixed; top: 0; left: 0; width: 100%; height: 100%;background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);display: flex; align-items: center; justify-content: center;z-index: 2147483647; opacity: 0; transition: opacity 0.3s;}
        .sys-alert-box {background: white; width: 90%; max-width: 400px; border-radius: 12px;box-shadow: 0 20px 40px rgba(0,0,0,0.4);transform: translateY(-20px); transition: transform 0.3s;overflow: hidden; font-family: 'Segoe UI', sans-serif;}
        .sys-alert-header {padding: 15px 20px; background: #f8f9fa;border-bottom: 1px solid #eee; font-weight: bold;display: flex; align-items: center; gap: 10px; color: #2c3e50;}
        .sys-alert-body {padding: 20px; color: #444; line-height: 1.6; font-size: 14px;max-height: 300px; overflow-y: auto;}
        .sys-alert-footer {padding: 15px 20px; background: #f8f9fa;border-top: 1px solid #eee; text-align: right;display: flex; justify-content: flex-end; gap: 10px;}
        .sys-alert-btn {padding: 8px 20px; border-radius: 6px; border: none;font-weight: 600; cursor: pointer; transition: 0.2s;}
        .sys-alert-btn-primary { background: #3498db; color: white; }
        .sys-alert-btn-primary:hover { background: #2980b9; }
        .sys-alert-btn-secondary { background: #e0e0e0; color: #555; }
        .sys-alert-btn-secondary:hover { background: #d0d0d0; }
        .sys-alert-show { opacity: 1; }
        .sys-alert-show .sys-alert-box { transform: translateY(0); }
        
        #sys-photo-counter { top: 10px !important; font-size: 11px !important; padding: 4px 12px !important; }
  `);

  const footer = document.querySelector(".footer-copyright-area");
  if (footer) footer.remove();

  const modalHtml = `
        <div id="sys-auth-modal" class="sys-modal">
            <div class="sys-modal-content">
                <h3>🔐 Login Sistem Zyrex</h3>
                <div class="sys-input-group">
                    <label>Username</label>
                    <input type="text" id="sys-auth-user" class="sys-modal-input" placeholder="Masukkan Username">
                </div>
                <div class="sys-input-group">
                    <label>Password</label>
                    <input type="password" id="sys-auth-pass" class="sys-modal-input" placeholder="Masukkan Password">
                </div>
                <button id="sys-btn-login-action" class="sys-btn-login-action">LOGIN</button>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  function sysNotify(
    message,
    title = "Pemberitahuan",
    type = "alert",
    defaultValue = "",
  ) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sys-alert-overlay";

      let contentHtml = `<div class="sys-alert-body">${message.replace(
        /\n/g,
        "<br>",
      )}</div>`;
      let footerHtml = `<button class="sys-alert-btn sys-alert-btn-primary" id="sys-alert-ok">OK</button>`;

      if (type === "prompt") {
        contentHtml += `
                <div style="padding: 0 20px 20px 20px;">
                    <textarea id="sys-alert-input" class="sys-form-input"
                        style="width:100%; height:80px; resize:none; font-family:inherit;"
                        placeholder="Masukkan alasan penolakan...">${defaultValue}</textarea>
                </div>`;
        footerHtml = `
                <button class="sys-alert-btn sys-alert-btn-secondary" id="sys-alert-cancel">Batal</button>
                <button class="sys-alert-btn sys-alert-btn-primary" id="sys-alert-ok">Kirim Tolak</button>
            `;
      } else if (type === "confirm") {
        footerHtml = `
                <button class="sys-alert-btn sys-alert-btn-secondary" id="sys-alert-cancel">Batal</button>
                <button class="sys-alert-btn sys-alert-btn-primary" id="sys-alert-ok">Setuju</button>
            `;
      }

      overlay.innerHTML = `
            <div class="sys-alert-box">
                <div class="sys-alert-header">⚠️ ${title}</div>
                ${contentHtml}
                <div class="sys-alert-footer">${footerHtml}</div>
            </div>
        `;

      document.body.appendChild(overlay);
      setTimeout(() => overlay.classList.add("sys-alert-show"), 10);

      const inputEl = overlay.querySelector("#sys-alert-input");
      if (inputEl) setTimeout(() => inputEl.focus(), 100);

      overlay.querySelector("#sys-alert-ok").onclick = () => {
        const val = inputEl ? inputEl.value : true;
        overlay.classList.remove("sys-alert-show");
        setTimeout(() => {
          overlay.remove();
          resolve(val);
        }, 300);
      };

      const cancelBtn = overlay.querySelector("#sys-alert-cancel");
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          overlay.classList.remove("sys-alert-show");
          setTimeout(() => {
            overlay.remove();
            resolve(null);
          }, 300);
        };
      }
    });
  }

  function checkAuth() {
    const token = localStorage.getItem("access_token_v1");
    const tokenTime = localStorage.getItem("access_token_time");
    const now = Date.now();

    if (!token || !tokenTime || now - parseInt(tokenTime) > TOKEN_EXPIRY_MS) {
      showLoginModal();
      return false;
    }
    return true;
  }

  function showLoginModal() {
    const modal = document.getElementById("sys-auth-modal");
    modal.style.display = "flex";
    setTimeout(() => document.getElementById("sys-auth-user").focus(), 100);
  }

  function hideLoginModal() {
    document.getElementById("sys-auth-modal").style.display = "none";
  }

  document
    .getElementById("sys-btn-login-action")
    .addEventListener("click", async function () {
      const user = document.getElementById("sys-auth-user").value;
      const pass = document.getElementById("sys-auth-pass").value;
      const btn = this;

      if (!user || !pass) {
        await sysNotify("Username dan Password wajib diisi!", "Input Kosong");
        return;
      }

      const originalText = btn.innerText;
      btn.innerText = "Loading...";
      btn.disabled = true;

      GM_xmlhttpRequest({
        method: "POST",
        url: AUTH_API_URL,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ username: user, password: pass }),
        onload: async function (response) {
          btn.disabled = false;
          btn.innerText = originalText;

          if (response.status === 200) {
            try {
              const res = JSON.parse(response.responseText);
              const newToken = res.token || res.access_token;

              if (newToken) {
                localStorage.setItem("access_token_v1", newToken);
                localStorage.setItem("access_token_time", Date.now());
                hideLoginModal();
                location.reload();
              } else {
                await sysNotify(
                  "Gagal: Token tidak ditemukan dalam respon server.",
                  "Login Error",
                );
              }
            } catch (e) {
              alert("Error parsing response: " + e.message);
            }
          } else {
            await sysNotify(
              "Login Gagal! Cek username/password. (" + response.status + ")",
              "Login Error",
            );
          }
        },
        onerror: function (err) {
          btn.disabled = false;
          btn.innerText = originalText;
          alert("Koneksi Error ke server login.");
        },
      });
    });

  if (!checkAuth()) return;
  let userToken = localStorage.getItem("access_token_v1");

  const pageData = {
    npsn: document.getElementById("npsn")?.value || "-",
    namaSekolah: (function () {
      const el = document.querySelector(".alert-info h2");
      if (el) {
        const text = el.innerText.trim();
        const firstDashIndex = text.indexOf("-");
        if (firstDashIndex !== -1) {
          return text.substring(firstDashIndex + 1).trim();
        }
        return text;
      }
      return "Tidak Ditemukan";
    })(),
    snPenyedia: (function () {
      const el = document.querySelector(".alert-st-one .message-mg-rt strong");
      return el ? el.innerText.trim() : "-";
    })(),
    alamat: (function () {
      const inputs = document.querySelectorAll('input[name="tempat"]');
      let addr = [];
      inputs.forEach((input) => {
        if (input.value) addr.push(input.value);
      });
      return addr.length > 0 ? addr.join(", ") : "-";
    })(),
    noBapp: document.getElementById("no_bapp")?.value || "-",
  };

  function injectActionButtons() {
    const originalSubmit = document.querySelector(
      '.login-horizental button[type="submit"], .btn-login',
    );
    if (originalSubmit) originalSubmit.style.display = "none";

    if (!document.getElementById("sys-action-bar")) {
      const actionBar = document.createElement("div");
      actionBar.id = "sys-action-bar";

      const dynamicBtn = document.createElement("button");
      dynamicBtn.id = "sys-btn-dynamic-main";
      dynamicBtn.type = "button";

      dynamicBtn.onclick = async function (e) {
        e.preventDefault();
        const mainForm = document.querySelector("form");
        if (mainForm && !mainForm.checkValidity()) {
          mainForm.reportValidity();
          return;
        }

        const action = this.getAttribute("data-action");

        if (action === "approve") {
          callApi(this, "approve", null);
        } else {
          let defaultReason = generateAutoReason();
          const reason = await sysNotify(
            `<b>Deteksi Masalah Otomatis:</b><br><small>${defaultReason}</small><br><br>Konfirmasi Penolakan?`,
            "Alasan Penolakan",
            "prompt",
            defaultReason,
          );
          if (reason !== null && reason.trim() !== "") {
            callApi(this, "reject", reason);
          } else if (reason !== null) {
            await sysNotify("Alasan penolakan wajib diisi!", "Peringatan");
          }
        }
      };

      actionBar.appendChild(dynamicBtn);
      document.body.appendChild(actionBar);

      updateDynamicButtonState();
    }
  }

  function callApi(btnElement, actionType, reason) {
    const originalText = btnElement.innerHTML;
    const url = `${BASE_API_URL}/${actionType}`;

    btnElement.disabled = true;
    btnElement.innerHTML =
      '<i class="fa fa-spinner fa-spin"></i> Memproses Zyrex...';

    const payload = { token: userToken, npsn: pageData.npsn };
    if (actionType === "reject") payload.reason = reason;

    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(payload),
      onload: async function (response) {
        if (response.status === 401 || response.status === 403) {
          await sysNotify(
            "⚠️ Sesi Habis! Silakan login ulang.",
            "Sesi Berakhir",
          );
          localStorage.removeItem("access_token_v1");
          showLoginModal();
          btnElement.disabled = false;
          btnElement.innerHTML = originalText;
          return;
        }

        if (response.status >= 200 && response.status < 300) {
          btnElement.innerHTML =
            '<i class="fa fa-check"></i> Menyimpan Asshal...';
          const originalSubmit = document.querySelector(
            '.login-horizental button[type="submit"], .btn-login',
          );
          if (originalSubmit) {
            originalSubmit.click();
          } else {
            document.querySelector("form").submit();
          }
        } else {
          btnElement.disabled = false;
          btnElement.innerHTML = originalText;
          let errMsg = "Unknown";
          try {
            errMsg =
              JSON.parse(response.responseText).error || response.responseText;
          } catch (e) {}
          await sysNotify(
            `❌ GAGAL ZYREX (${actionType.toUpperCase()})!\nData Asshal BELUM Disimpan.\n\nServer: ${
              response.status
            }\nPesan: ${errMsg}`,
            "Error API",
          );
        }
      },
      onerror: function (err) {
        btnElement.disabled = false;
        btnElement.innerHTML = originalText;
        alert("❌ ERROR KONEKSI: Gagal menghubungi backend Zyrex.");
      },
    });
  }

  function generateAutoReason() {
    const issues = [];
    for (const [key, val] of Object.entries(formState.dropdowns)) {
      if (
        !val ||
        val === "Sesuai" ||
        val === "Ada" ||
        val === "Lengkap" ||
        val === "Jelas" ||
        val === "Konsisten"
      )
        continue;

      const safeKeywords = [
        "sesuai",
        "ada",
        "lengkap",
        "jelas",
        "terbaca",
        "konsisten",
      ];
      const valLower = val.toLowerCase();
      const isSafe = safeKeywords.some(
        (keyword) =>
          valLower.includes(keyword) &&
          !valLower.includes("tidak") &&
          !valLower.includes("belum"),
      );

      if (!isSafe) {
        const exactKey = `${key}_${val}`;
        let mappedReason = REASON_MAPPING[exactKey];
        if (!mappedReason) {
          const searchKeyLower = exactKey.toLowerCase();
          const foundKey = Object.keys(REASON_MAPPING).find(
            (k) => k.toLowerCase() === searchKeyLower,
          );
          if (foundKey) mappedReason = REASON_MAPPING[foundKey];
        }
        if (mappedReason) {
          issues.push(mappedReason);
        } else {
          const originalSelect = document.querySelector(
            `select[name="${key}"]`,
          );
          let label = key;
          if (originalSelect) {
            const row =
              originalSelect.closest(".form-group") ||
              originalSelect.closest(".sys-form-row");
            if (row) {
              const lbl =
                row.querySelector("label") || row.querySelector(".login2");
              if (lbl) label = lbl.innerText.trim();
            }
          }
          issues.push(`${label} (${val})`);
        }
      }
    }
    return issues.join(", ");
  }

  function isFormValidForApprove() {
    const issues = generateAutoReason();
    return issues === "";
  }

  function updateDynamicButtonState() {
    const btn = document.getElementById("sys-btn-dynamic-main");
    if (!btn) return;

    if (isFormValidForApprove()) {
      btn.innerHTML = '<i class="fa fa-check-circle"></i> SIMPAN & TERIMA';
      btn.className = "state-approve";
      btn.setAttribute("data-action", "approve");
    } else {
      btn.innerHTML = '<i class="fa fa-times-circle"></i> SIMPAN & TOLAK';
      btn.className = "state-reject";
      btn.setAttribute("data-action", "reject");
    }
  }

  injectActionButtons();

  if (pageData.npsn !== "-" && pageData.npsn) {
    const loadDiv = document.createElement("div");
    loadDiv.style.cssText =
      "position:fixed;bottom:10px;right:10px;background:#2c3e50;color:#fff;padding:10px 20px;border-radius:30px;z-index:9999999;font-size:12px;font-weight:bold;";
    loadDiv.innerText = "Memuat data...";
    document.body.appendChild(loadDiv);

    GM_xmlhttpRequest({
      method: "POST",
      url: `${BASE_API_URL}/awb`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ token: userToken, npsn: pageData.npsn }),
      onload: function (response) {
        loadDiv.remove();
        if (response.status === 200) {
          try {
            initSystem(JSON.parse(response.responseText));
          } catch (e) {}
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token_v1");
          showLoginModal();
        }
      },
      onerror: function () {
        loadDiv.remove();
      },
    });
  }

  let viewerInstance = null;
  function initSystem(data) {
    // Capture comments if present in updated /awb response
    awbComments = Array.isArray(data?.comments) ? data.comments : [];
    renderDashboard(data);
  }

  function updatePhotoCounter() {
    if (!viewerInstance) return;
    let existingCounter = document.getElementById("sys-photo-counter");
    if (existingCounter) existingCounter.remove();
    const viewerContainer = document.querySelector(".viewer-container");
    if (!viewerContainer) return;
    const currentIndex = viewerInstance.index || 0;
    const totalPhotos = viewerInstance.images.length || 0;
    const counter = document.createElement("div");
    counter.id = "sys-photo-counter";
    counter.style.cssText =
      "position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 30px; font-weight: bold; font-size: 14px; z-index: 99999; font-family: 'Segoe UI', sans-serif;";
    counter.innerText = `Foto ${currentIndex + 1} dari ${totalPhotos}`;
    document.body.appendChild(counter);
  }

  function renderDashboard(data) {
    const { awb, nomorResi } = data;
    const photos = awb.ListPhotoJSON || {};
    const history = awb.History || [];
    const photoKeys = Object.keys(photos);

    if (history && history.length > 0) {
      const lastEvent = history[history.length - 1];
      if (lastEvent && lastEvent.date) {
        lastHistoryDate = lastEvent.date.split(" ")[0];
      }
    }

    const old = document.getElementById("sys-dashboard");
    if (old) old.remove();

    const container = document.createElement("div");
    container.id = "sys-dashboard";
    let html = `
            <div class="sys-header">
                <h3>Verifikasi AWB: ${nomorResi || "-"}</h3>
                <div class="sys-header-right">
                    <button id="sys-btn-reset" class="sys-btn-reset" title="Klik untuk login ulang">🔄 Reset</button>
                    <span class="sys-status-label">${
                      awb.CurrentState || "UNKNOWN"
                    }</span>
                </div>
            </div>
            <div class="sys-content"><div class="sys-section-header">Dokumentasi Unit</div><div id="sys-gallery-container" class="sys-gallery">`;

    if (photoKeys.length > 0) {
      photoKeys.forEach((key) => {
        html += `<div class="sys-gallery-item"><img src="${photos[key]}" alt="${key}"><div class="sys-gallery-caption">${key}</div></div>`;
      });
    } else {
      html += `<p style="padding:10px;text-align:center;color:#999;">Tidak ada foto.</p>`;
    }

    html += `</div><div class="sys-section-header">Riwayat Pengiriman</div><div style="max-height:300px;overflow-y:auto;"><table class="sys-table"><thead><tr><th>Waktu</th><th>Lokasi</th><th>Status</th><th>Keterangan</th></tr></thead><tbody>`;
    history.forEach((h) => {
      html += `<tr><td style="white-space:nowrap;">${h.date}</td><td>${
        h.location_code || "-"
      }</td><td><strong>${h.status_code}</strong></td><td>${
        h.status
      }<br><small style="color:#888;">${h.status_desc}</small></td></tr>`;
    });
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
    document.body.appendChild(container);

    setTimeout(() => {
      const btnReset = document.getElementById("sys-btn-reset");
      if (btnReset) {
        btnReset.onclick = function () {
          showLoginModal();
        };
      }
    }, 500);

    const galleryEl = document.getElementById("sys-gallery-container");
    if (galleryEl && photoKeys.length > 0) {
      viewerInstance = new Viewer(galleryEl, {
        title: false,
        navbar: false,
        zoomRatio: 0.1,
        transition: true,
        tooltip: false,
        movable: true,
        keyboard: false,
        slideOnWheel: false,
        toolbar: false,
        button: false,
        loop: true,
        view: function () {
          setTimeout(() => {
            injectStickyBoxesToViewer();
            injectTapNavigation();
            updatePhotoCounter();
          }, 100);
        },
      });

      setTimeout(() => {
        if (viewerInstance) {
          viewerInstance.show();
          updatePhotoCounter();
        }
      }, 500);

      viewerInstance.options.viewed = function () {
        updatePhotoCounter();
      };
    }
  }

  function injectTapNavigation() {
    const viewerContainer = document.querySelector(".viewer-container");
    if (!viewerContainer) return;

    if (document.getElementById("sys-nav-prev")) return;

    const prevDiv = document.createElement("div");
    prevDiv.id = "sys-nav-prev";
    prevDiv.className = "sys-nav-area";

    const nextDiv = document.createElement("div");
    nextDiv.id = "sys-nav-next";
    nextDiv.className = "sys-nav-area";

    const handlePrev = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (viewerInstance) viewerInstance.prev();
    };

    const handleNext = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (viewerInstance) viewerInstance.next();
    };

    prevDiv.addEventListener("click", handlePrev);
    nextDiv.addEventListener("click", handleNext);

    viewerContainer.appendChild(prevDiv);
    viewerContainer.appendChild(nextDiv);
  }

  function injectStickyBoxesToViewer() {
    const viewerContainer = document.querySelector(".viewer-container");
    if (!viewerContainer) return;

    const existingLeft = viewerContainer.querySelector("#sys-sticky-left");
    const existingRight = viewerContainer.querySelector("#sys-sticky-right");
    if (existingLeft) existingLeft.remove();
    if (existingRight) existingRight.remove();

    const leftBox = document.createElement("div");
    leftBox.id = "sys-sticky-left";
    leftBox.className = "sys-sticky-box";
    leftBox.innerHTML = `
        <div class="sys-card-header">
            <div style="flex: 1;">
                <h2>${pageData.namaSekolah}</h2>
                <div class="sys-card-npsn">NPSN: ${pageData.npsn}</div>
            </div>
            <div style="display: flex; gap: 5px; flex-shrink: 0;">
                <button id="sys-rotate-left" class="sys-rotate-btn" title="Rotate Left">↶</button>
                <button id="sys-rotate-right" class="sys-rotate-btn" title="Rotate Right">↷</button>
            </div>
        </div>
        <div class="sys-serial-section">
            <span class="sys-serial-label">SERIAL NUMBER</span>
            <div class="sys-serial-number">${pageData.snPenyedia}</div>
        </div>
        <div class="sys-info-alamat">${pageData.alamat}</div>
        ${(() => {
          if (!awbComments || awbComments.length === 0) return "";
          const items = awbComments
            .map((c) => {
              const ts = (c.CreatedAt || "").replace("T", " ").split("+")[0];
              const who = c.commenter_name
                ? ` — <strong>${c.commenter_name}</strong>`
                : "";
              const text = (c.comment || "")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              return `<li style=\"margin-bottom:6px; line-height:1.35;\"><div style=\"font-size:10px; color:#64748b;\">${ts}${who}</div><div style=\"font-size:12px; color:#0f172a;\">${text}</div></li>`;
            })
            .join("");
          return `
            <div style=\"margin-top:10px; border-top:1px solid #e2e8f0; padding-top:8px;\">
              <div style=\"font-weight:700; font-size:12px; color:#1e293b;\">Komentar Verifikasi</div>
              <ul style=\"list-style: none; padding:0; margin:6px 0 0 0; max-height:140px; overflow:auto;\">${items}</ul>
            </div>`;
        })()}
    `;
    viewerContainer.appendChild(leftBox);

    leftBox.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    leftBox.addEventListener("touchstart", (e) => {
      e.stopPropagation();
    });

    leftBox.addEventListener("touchend", (e) => {
      e.stopPropagation();
    });

    setTimeout(() => {
      const rotateLeftBtn = document.getElementById("sys-rotate-left");
      const rotateRightBtn = document.getElementById("sys-rotate-right");

      if (rotateLeftBtn) {
        rotateLeftBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (viewerInstance) viewerInstance.rotate(-90);
        };
      }

      if (rotateRightBtn) {
        rotateRightBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (viewerInstance) viewerInstance.rotate(90);
        };
      }
    }, 100);

    const rightBox = document.createElement("div");
    rightBox.id = "sys-sticky-right";
    rightBox.className = "sys-sticky-box";

    rightBox.addEventListener("mouseenter", () => {
      if (viewerInstance) {
        viewerInstance.options.zoomable = false;
        viewerInstance.options.movable = false;
      }
    });
    rightBox.addEventListener("mouseleave", () => {
      if (viewerInstance) {
        viewerInstance.options.zoomable = true;
        viewerInstance.options.movable = true;
      }
    });
    rightBox.addEventListener(
      "wheel",
      (e) => {
        e.stopPropagation();
        rightBox.scrollTop += e.deltaY;
      },
      { passive: false },
    );

    [
      "mousedown",
      "mouseup",
      "click",
      "touchstart",
      "touchend",
      "keydown",
      "keyup",
    ].forEach((evt) => {
      rightBox.addEventListener(evt, function (e) {
        e.stopPropagation();
      });
    });

    let formHtml = `<div class="sys-sticky-title" id="sys-toggle-form">
        <span>Form Evaluasi</span>
        <i class="fa fa-chevron-up" id="sys-arrow-icon"></i>
    </div>`;

    formHtml += `<div id="sys-form-content" class="sys-hidden">`;

    formHtml += createDropdownHtml("ket_tgl_bapp", "Status Tgl");
    formHtml += `<div class="sys-form-row sys-hidden" id="box_date_wrapper"><label class="sys-form-label">Tgl BAPP</label><input type="date" class="sys-form-input" id="box_tgl_bapp_input" value="${
      formState.tgl_manual || ""
    }"></div>`;

    const fields = [
      { name: "geo_tag", label: "Geo Tagging" },
      { name: "f_papan_identitas", label: "Papan Nama" },
      { name: "f_box_pic", label: "BOX & PIC" },
      { name: "f_unit", label: "Unit" },
      { name: "spesifikasi_dxdiag", label: "Dxdiag" },
      { name: "bc_bapp_sn", label: "Barcode SN" },
    ];
    fields.forEach((f) => {
      formHtml += createDropdownHtml(f.name, f.label);
    });

    formHtml += `<div class="sys-form-row"><label class="sys-form-label">SN Manual</label><input type="text" class="sys-form-input" id="box_sn_bapp_input" placeholder="SN..." style="text-transform:uppercase;" value="${
      formState.sn_manual || ""
    }"></div>`;

    const fields2 = [
      { name: "bapp_hal1", label: "Hal 1" },
      { name: "bapp_hal2", label: "Hal 2" },
      { name: "nm_ttd_bapp", label: "TTD" },
      { name: "stempel", label: "Stempel" },
    ];
    fields2.forEach((f) => {
      formHtml += createDropdownHtml(f.name, f.label);
    });

    formHtml += `</div>`;

    rightBox.innerHTML = formHtml;
    viewerContainer.appendChild(rightBox);
    setupSyncLogic(rightBox);

    setTimeout(() => {
      const toggleBtn = document.getElementById("sys-toggle-form");
      const arrow = document.getElementById("sys-arrow-icon");
      const formContent = document.getElementById("sys-form-content");

      toggleBtn.onclick = () => {
        formContent.classList.toggle("sys-hidden");
        formState.formCollapsed = formContent.classList.contains("sys-hidden");
        if (formState.formCollapsed) {
          arrow.className = "fa fa-chevron-up";
        } else {
          arrow.className = "fa fa-chevron-down";
        }
      };
    }, 100);
  }

  function cascadeDropdownChanges(targetName, value, pageJQuery) {
    if (targetName === "bc_bapp_sn") {
      if (value === "Tidak ada" || value === "Tidak terlihat jelas") {
        const snBox = document.getElementById("box_sn_bapp_input");
        const snReal = document.getElementById("sn_bapp");
        if (snBox && snReal) {
          snBox.value = "-";
          snReal.value = "-";
          formState.sn_manual = "-";
        }
      }
    }
    if (targetName === "bapp_hal1" && value === "Tidak ada") {
      const bcSelect = document.querySelector(
        'select[data-target="bc_bapp_sn"]',
      );
      if (bcSelect) {
        bcSelect.value = "Tidak ada";
        formState.dropdowns["bc_bapp_sn"] = "Tidak ada";
        syncDropdown("bc_bapp_sn", "Tidak ada", pageJQuery);
      }
      const snBox = document.getElementById("box_sn_bapp_input");
      const snReal = document.getElementById("sn_bapp");
      if (snBox && snReal) {
        snBox.value = "-";
        snReal.value = "-";
        formState.sn_manual = "-";
      }
    }
    if (targetName === "bapp_hal2" && value === "Tidak ada") {
      const ttdSelect = document.querySelector(
        'select[data-target="nm_ttd_bapp"]',
      );
      if (ttdSelect) {
        ttdSelect.value = "TTD tidak ada";
        formState.dropdowns["nm_ttd_bapp"] = "TTD tidak ada";
        syncDropdown("nm_ttd_bapp", "TTD tidak ada", pageJQuery);
      }
      const stempelSelect = document.querySelector(
        'select[data-target="stempel"]',
      );
      if (stempelSelect) {
        stempelSelect.value = "Tidak ada";
        formState.dropdowns["stempel"] = "Tidak ada";
        syncDropdown("stempel", "Tidak ada", pageJQuery);
      }
      const tglSelect = document.querySelector(
        'select[data-target="ket_tgl_bapp"]',
      );
      if (tglSelect) {
        tglSelect.value = "Tidak ada";
        formState.dropdowns["ket_tgl_bapp"] = "Tidak ada";
        syncDropdown("ket_tgl_bapp", "Tidak ada", pageJQuery);
        handleDateVisibility("Tidak ada");
      }
    }
  }

  function setupSyncLogic(boxElement) {
    const pageJQuery =
      typeof unsafeWindow !== "undefined" && unsafeWindow.jQuery
        ? unsafeWindow.jQuery
        : null;
    const stickySelects = boxElement.querySelectorAll("select");
    stickySelects.forEach((select) => {
      const tName = select.getAttribute("data-target");
      if (tName === "ket_tgl_bapp") handleDateVisibility(select.value);
      if (select.value === "" && !formState.dropdowns[tName])
        setBestDefault(select);

      select.addEventListener("change", function () {
        const val = this.value;
        formState.dropdowns[tName] = val;
        syncDropdown(tName, val, pageJQuery);
        if (tName === "ket_tgl_bapp") handleDateVisibility(val);
        if (tName === "bc_bapp_sn") handleSNLogic(val);
        cascadeDropdownChanges(tName, val, pageJQuery);
        updateDynamicButtonState();
      });
    });

    const snBox = document.getElementById("box_sn_bapp_input");
    const snReal = document.getElementById("sn_bapp");
    if (snBox && snReal) {
      if (formState.sn_manual) snReal.value = formState.sn_manual;
      snBox.addEventListener("click", function () {
        this.focus();
      });
      snBox.addEventListener("input", function () {
        formState.sn_manual = this.value.toUpperCase();
        snReal.value = this.value.toUpperCase();
      });
    }

    const dateBox = document.getElementById("box_tgl_bapp_input");
    const dateReal = document.querySelector('input[name="tgl_bapp"]');
    if (dateBox && dateReal) {
      const offsetDate = (currentDateVal, days) => {
        let d = currentDateVal ? new Date(currentDateVal) : new Date();
        if (isNaN(d.getTime())) d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
      };
      dateBox.addEventListener(
        "wheel",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          const direction = e.deltaY > 0 ? -1 : 1;
          const newDate = offsetDate(this.value, direction);
          this.value = newDate;
          this.dispatchEvent(new Event("input", { bubbles: true }));
          this.dispatchEvent(new Event("change", { bubbles: true }));
        },
        { passive: false },
      );

      ["input", "change"].forEach((evt) => {
        dateBox.addEventListener(evt, function () {
          const isoDate = this.value;
          if (typeof formState !== "undefined") {
            formState.tgl_manual = isoDate;
          }
          if (!isoDate) return;
          const parts = isoDate.split("-");
          const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
          if (pageJQuery) {
            const $realInput = pageJQuery(dateReal);
            if (typeof $realInput.datepicker === "function") {
              $realInput.datepicker("update", dateObj);
            } else {
              const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              $realInput.val(formattedDate).trigger("change");
            }
          } else {
            dateReal.value = isoDate;
          }
        });
      });
    }
  }

  function createDropdownHtml(targetName, label) {
    const originalSelect = document.querySelector(
      `select[name="${targetName}"]`,
    );
    if (!originalSelect) return "";
    let html = `<div class="sys-form-row"><label class="sys-form-label">${label}</label>`;
    html += `<select class="sys-form-select" data-target="${targetName}">`;
    const savedVal = formState.dropdowns[targetName];
    Array.from(originalSelect.options).forEach((opt) => {
      if (opt.value) {
        let isSelected = "";
        if (savedVal !== undefined) {
          if (opt.value === savedVal) isSelected = "selected";
        } else {
          if (opt.selected) isSelected = "selected";
        }
        html += `<option value="${
          opt.value
        }" ${isSelected}>${opt.text.trim()}</option>`;
      } else {
        html += `<option value="">- Pilih -</option>`;
      }
    });
    html += `</select></div>`;
    return html;
  }

  function setBestDefault(selectElement) {
    const bestKeywords = ["Sesuai", "Lengkap", "Konsisten", "Ada"];
    for (let i = 0; i < selectElement.options.length; i++) {
      const optText = selectElement.options[i].text;
      const optVal = selectElement.options[i].value;
      if (bestKeywords.some((keyword) => optText.includes(keyword))) {
        selectElement.value = optVal;
        const pageJQuery =
          typeof unsafeWindow !== "undefined" && unsafeWindow.jQuery
            ? unsafeWindow.jQuery
            : null;
        formState.dropdowns[selectElement.getAttribute("data-target")] = optVal;
        syncDropdown(
          selectElement.getAttribute("data-target"),
          optVal,
          pageJQuery,
        );
        if (selectElement.getAttribute("data-target") === "ket_tgl_bapp")
          handleDateVisibility(optVal);
        if (selectElement.getAttribute("data-target") === "bc_bapp_sn")
          handleSNLogic(optVal);
        return;
      }
    }
  }

  function syncDropdown(targetName, value, jq) {
    const originalSelect = document.querySelector(
      `select[name="${targetName}"]`,
    );
    if (originalSelect) {
      originalSelect.value = value;
      originalSelect.dispatchEvent(new Event("change"));
      if (jq) {
        jq(originalSelect).trigger("chosen:updated");
        jq(originalSelect).change();
      }
    }
  }

  function handleDateVisibility(value) {
    const wrapper = document.getElementById("box_date_wrapper");
    const dateInput = document.getElementById("box_tgl_bapp_input");
    const realDateInput = document.querySelector('input[name="tgl_bapp"]');
    const pageJQuery =
      typeof unsafeWindow !== "undefined" && unsafeWindow.jQuery
        ? unsafeWindow.jQuery
        : null;

    if (value === "Sesuai") {
      if (wrapper) wrapper.classList.remove("sys-hidden");
      if (dateInput && !dateInput.value && !formState.tgl_manual) {
        let isoDate = lastHistoryDate;
        if (!isoDate) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const day = String(now.getDate()).padStart(2, "0");
          isoDate = `${year}-${month}-${day}`;
        }
        dateInput.value = isoDate;
        formState.tgl_manual = isoDate;
        if (
          realDateInput &&
          pageJQuery &&
          typeof pageJQuery(realDateInput).datepicker === "function"
        ) {
          const parts = isoDate.split("-");
          const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
          pageJQuery(realDateInput).datepicker("update", dateObj);
        }
      }
    } else {
      if (wrapper) wrapper.classList.add("sys-hidden");
    }
  }

  function handleSNLogic(value) {
    const snBox = document.getElementById("box_sn_bapp_input");
    const snReal = document.getElementById("sn_bapp");
    if (!snBox || !snReal) return;
    if (value === "Ada") {
      if (pageData.snPenyedia !== "-" && !formState.sn_manual) {
        snBox.value = pageData.snPenyedia;
        snReal.value = pageData.snPenyedia;
        formState.sn_manual = pageData.snPenyedia;
      }
    }
  }
})();
