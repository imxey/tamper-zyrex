// ==UserScript==
// @name         Sistem Verifikasi & Monitoring (Left Side Datadik Edition)
// @namespace    http://asshal.tech/
// @version      36.1
// @description  Dashboard + Auto Auth + One Click Sync + Sticky Action + Datadik Pindah ke Kiri
// @author       System Admin (ft. Xeyla)
// @match        https://laptop.asshal.tech/form/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.6/viewer.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      owo.mars-project.my.id
// @connect      owo-zyrex.mars-project.my.id
// @connect      taila6748c.ts.net
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==

(function () {
  "use strict";

  const BASE_API_URL = "https://owo-zyrex.mars-project.my.id";
  const AUTH_API_URL = "https://owo-zyrex.mars-project.my.id/login";
  const TOKEN_EXPIRY_MS = 3 * 60 * 60 * 1000;

  let formState = {
    dropdowns: {},
    sn_manual: "",
    tgl_manual: "",
  };

  let lastHistoryDate = "";
  let confirmationEnabled =
    localStorage.getItem("sys_confirm_enabled") !== "false";
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
        /* Dashboard Utama */
        #sys-dashboard { font-family: 'Segoe UI', sans-serif; margin-left: 220px; margin-right: 20px; margin-bottom: 50px; margin-top: 20px; background: #fff; border: 1px solid #d1d1d1; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .sys-header { background: #f5f5f5; padding: 15px 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; }
        .sys-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #2c3e50; }

        .sys-header-right { display: flex; align-items: center; gap: 10px; }
        .sys-status-label { font-size: 12px; padding: 4px 12px; background: #3498db; color: white; border-radius: 2px; font-weight: 600; }
        .sys-btn-reset { font-size: 10px; padding: 4px 8px; border: 1px solid #ccc; background: #fff; border-radius: 3px; cursor: pointer; color: #555; display: flex; align-items: center; gap: 3px; }
        .sys-btn-reset:hover { background: #f0f0f0; border-color: #999; color: #333; }
        .sys-btn-toggle-confirm { font-size: 10px; padding: 4px 10px; border: 1px solid #ccc; background: #fff; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600; transition: all 0.2s; }
        .sys-btn-toggle-confirm.enabled { background: #27ae60; color: white; border-color: #27ae60; }
        .sys-btn-toggle-confirm.disabled { background: #e74c3c; color: white; border-color: #e74c3c; }
        .sys-btn-toggle-confirm:hover { transform: scale(1.02); }

        .sys-content { padding: 20px; }
        .sys-section-header { font-size: 14px; font-weight: bold; color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #3498db; display: inline-block; padding-bottom: 5px; }
        .sys-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .sys-gallery-item { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; cursor: pointer; }
        .sys-gallery-item:hover { border-color: #3498db; }
        .sys-gallery-item img { width: 100%; height: 120px; object-fit: cover; display: block; }
        .sys-gallery-caption { padding: 5px; font-size: 11px; text-align: center; background: #f9f9f9; border-top: 1px solid #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sys-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .sys-table th { background: #ecf0f1; padding: 10px; text-align: left; border-bottom: 2px solid #bdc3c7; }
        .sys-table td { padding: 8px 10px; border-bottom: 1px solid #eee; }

        /* --- LOGIN MODAL CSS --- */
        .sys-modal {display: none; position: fixed; z-index: 2147483647; left: 0; top: 0; width: 100%; height: 100%; overflow: auto;background-color: rgba(0,0,0,0.8); backdrop-filter: blur(5px);align-items: center; justify-content: center;}
        .sys-modal-content {background-color: #fefefe; padding: 30px; border: 1px solid #888; width: 350px; border-radius: 10px;box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; font-family: 'Segoe UI', sans-serif;}
        .sys-modal-content h3 { margin-top: 0; color: #333; margin-bottom: 20px; font-size: 20px; }
        .sys-input-group { margin-bottom: 15px; text-align: left; }
        .sys-input-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #555; }
        .sys-modal-input {width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 5px;font-size: 14px; outline: none; transition: border 0.3s;}
        .sys-modal-input:focus { border-color: #3498db; }
        .sys-btn-login-action {width: 100%; padding: 12px; background: #3498db; color: white; border: none; border-radius: 5px;font-size: 14px; font-weight: bold; cursor: pointer; transition: background 0.3s; margin-top: 10px;}
        .sys-btn-login-action:hover { background: #2980b9; }

        /* --- STICKY BOXES --- */
        .sys-sticky-box {position: absolute; top: 20px; z-index: 100!important;background: rgba(255, 255, 255, 0.98);padding: 18px;border-radius: 12px;box-shadow: 0 10px 30px rgba(0,0,0,0.5);width: 280px;max-height: 80vh;overflow-y: auto !important; /* WAJIB AKTIF */pointer-events: auto !important;overflow-x: hidden;font-family: 'Inter', 'Segoe UI', sans-serif !important;border: 1px solid rgba(0,0,0,0.1);scrollbar-width: thin; /* Untuk Firefox */scrollbar-color: #3498db #eee;}

        /* [UPDATED] Left Sticky Box CSS untuk menampung Data Guru */
        #sys-sticky-left {
            left: 20px;
            width: 320px !important;
            padding: 0 !important;
            background: #f1f5f9 !important;
            border-radius: 12px !important;
            border: 1px solid #e2e8f0 !important;
            /* Ubah overflow menjadi auto agar bisa discroll jika data guru panjang */
            overflow-y: auto !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
        }

        #sys-sticky-right {right: 20px; width: 340px; border: none; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(5px);}
        .sys-sticky-box::-webkit-scrollbar { width: 8px; }
        .sys-sticky-box::-webkit-scrollbar-track { background: #f1f1f1; }
        .sys-sticky-box::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

        .sys-sticky-title { font-size: 14px !important; font-weight: 800 !important; letter-spacing: 1px; padding-bottom: 10px; margin-bottom: 15px !important; text-align: center; color: #2c3e50 !important; border-bottom: 2px solid #3498db !important; text-transform: uppercase !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; }
        .sys-toggle-mini { font-size: 8px !important; padding: 2px 6px !important; border: 1px solid #ccc; background: #fff; border-radius: 3px; cursor: pointer; display: inline-flex !important; align-items: center; gap: 3px; font-weight: 700; transition: all 0.2s; white-space: nowrap; }
        .sys-toggle-mini.enabled { background: #27ae60; color: white; border-color: #27ae60; }
        .sys-toggle-mini.disabled { background: #e74c3c; color: white; border-color: #e74c3c; }
        .sys-toggle-mini:hover { transform: scale(1.05); }

        .sys-info-row { margin-bottom: 12px !important; border-bottom: 1px solid #eee; padding-bottom: 8px !important; display: flex !important; flex-direction: column !important; gap: 4px !important; height: auto !important; line-height: normal !important; position: relative !important; clear: both !important;}
        .sys-info-label { font-weight: 700 !important; color: #666 !important; font-size: 11px !important; text-transform: uppercase; letter-spacing: 0.5px; display: block !important; margin: 0 !important; width: 100% !important; }
        .sys-info-value { color: #000 !important; font-size: 13px !important; font-weight: 500 !important; line-height: 1.4 !important; word-wrap: break-word !important; width: 100% !important; }

        .sys-form-row {margin-bottom: 15px; display: flex; flex-direction: column; gap: 6px;}
        .sys-form-label {font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase; color: #2c3e50; letter-spacing: 0.5px; display: block; margin-bottom: 5px;}
        .sys-form-select, .sys-form-input {width: 100%; height: 38px; padding: 8px 12px; border-radius: 8px; border: 1px solid #d1d8e0; background-color: #ffffff; font-size: 13px; transition: all 0.2s ease; box-sizing: border-box;}
        .sys-form-select:hover, .sys-form-input:hover {border-color: #3498db; background-color: #fff;}
        .sys-form-select:focus, .sys-form-input:focus {border-color: #3498db; box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2); outline: none;}

        .sys-card-header {padding: 12px 18px;background: #f1f5f9;}
        .sys-card-header h2 {color: #0056b3;font-size: 16px;font-weight: 900; /* Extra Bold */margin: 0;line-height: 1.2;padding-bottom: 8px;}
        .sys-card-npsn {font-size: 13px;font-weight: 600;color: #64748b;margin-top: 2px;margin-bottom: 8px;}
        .sys-serial-section {background: #ffe4e6 !important; /* Warna pink sesuai gambar */padding: 12px 18px;border-top: 1px solid #fecdd3;border-bottom: 1px solid #fecdd3;}
        .sys-serial-label {font-size: 10px;font-weight: 800;color: #e11d48; /* Merah gelap */text-transform: uppercase;letter-spacing: 0.5px;margin-bottom: 6px;display: block;}
        .sys-serial-number {font-size: 22px !important;font-weight: 900 !important;color: #1e293b;letter-spacing: -0.5px;padding-top: 18px;padding-bottom: 6px;}
        .sys-card-body {padding: 18px;background: #ffffff;}
        .sys-info-title {font-weight: 900;font-size: 14px;color: #1e293b;margin-bottom: 6px;display: block;}
        .sys-info-item {font-size: 13px;color: #334155;padding-top: 8px;line-height: 1.5;}
        .sys-info-label-alamat {font-weight: 800;color: #1e293b;}

        #box_sn_bapp_input {background: #fff9e6; border: 1px solid #f1c40f; font-weight: bold; color: #d35400;}
        .sys-form-select { cursor: pointer !important; }
        .sys-hidden { display: none; }

        /* CSS Fix for Datepicker in Sticky Box */
        .datepicker-dropdown { max-height: 280px !important; overflow-y: auto !important; overflow-x: hidden !important; z-index: 99999999 !important; background: white !important; border: 1px solid #3498db !important; }
        .datepicker table {width: 100% !important;}
        .datepicker.datepicker-dropdown.dropdown-menu {z-index: 9999999999 !important;}

        /* --- STICKY ACTION BAR CSS --- */
        #sys-action-bar {position: fixed; bottom: 0; left: 0; width: 100%; z-index: 2147483647;background: white; border-top: 2px solid #3498db; padding: 15px 20px;box-shadow: 0 -2px 10px rgba(0,0,0,0.1); display: flex; justify-content: center; align-items: center; gap: 20px;}
        body { padding-bottom: 80px !important; }
        /* --- DYNAMIC ACTION BUTTON --- */
        #sys-btn-dynamic-main {
            font-size: 14px !important;
            font-weight: bold !important;
            padding: 12px 40px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            text-transform: uppercase !important;
            color: white !important;
            border: none !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
            min-width: 250px;
        }

        /* Warna saat kondisi TERIMA (Hijau) */
        .state-approve { background-color: #10ac84 !important; }
        .state-approve:hover { background-color: #0e9471 !important; transform: translateY(-2px); }

        /* Warna saat kondisi TOLAK (Merah) */
        .state-reject { background-color: #ee5253 !important; }
        .state-reject:hover { background-color: #d63031 !important; transform: translateY(-2px); }

            /* --- SKIP BUTTON --- */
            #sys-btn-skip { font-size: 12px !important; font-weight: 800 !important; padding: 10px 20px !important; border-radius: 8px !important; cursor: pointer !important; text-transform: uppercase !important; color: #1e293b !important; background: #f1f5f9 !important; border: 1px solid #d1d8e0 !important; transition: all 0.2s ease !important; box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important; }
            #sys-btn-skip:hover { background: #e2e8f0 !important; transform: translateY(-1px); }

        /* --- CUSTOM ALERT MODAL --- */
        .sys-alert-overlay {position: fixed; top: 0; left: 0; width: 100%; height: 100%;background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);display: flex; align-items: center; justify-content: center;z-index: 2147483647; opacity: 0; transition: opacity 0.3s;}
        .sys-alert-box {background: white; width: 400px; border-radius: 12px;box-shadow: 0 20px 40px rgba(0,0,0,0.4);transform: translateY(-20px); transition: transform 0.3s;overflow: hidden; font-family: 'Segoe UI', sans-serif;}
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

      let contentHtml = `<div class="sys-alert-body">${message.replace(/\n/g, "<br>")}</div>`;
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
      const elNormal = document.querySelector(
        ".alert-st-one .message-mg-rt strong",
      );
      if (elNormal) return elNormal.innerText.trim();
      const elDupe = document.querySelector(".alert-danger strong");
      if (elDupe) return elDupe.innerText.trim();
      return "-";
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
          if (confirmationEnabled) {
            const confirmed = await sysNotify(
              "Apakah Anda yakin ingin <b>MENERIMA</b> data ini?",
              "Konfirmasi Penerimaan",
              "confirm",
            );
            if (!confirmed) return;
          }
          callApi(this, "approve", null);
        } else {
          let defaultReason = generateAutoReason();

          if (confirmationEnabled) {
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
          } else {
            callApi(this, "reject", defaultReason);
          }
        }
      };

      const skipBtn = document.createElement("button");
      skipBtn.id = "sys-btn-skip";
      skipBtn.type = "button";
      skipBtn.innerText = "SKIP";
      skipBtn.title = "Lewati dan lanjut ke halaman proses";
      skipBtn.onclick = function (e) {
        e.preventDefault();
        try {
          const npsnVal = pageData.npsn;
          let hold = [];
          try {
            const raw = localStorage.getItem("hold");
            hold = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(hold)) hold = [];
          } catch (err) {
            hold = [];
          }
          if (npsnVal && npsnVal !== "-") {
            if (!hold.includes(npsnVal)) hold.push(npsnVal);
            localStorage.setItem("hold", JSON.stringify(hold));
          }
        } catch (e) {
          console.log("Gagal menyimpan data hold:", e);
        }
        window.location.href = "https://laptop.asshal.tech/proses";
      };

      actionBar.appendChild(dynamicBtn);
      actionBar.appendChild(skipBtn);
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
            `❌ GAGAL ZYREX (${actionType.toUpperCase()})!\nData Asshal BELUM Disimpan.\n\nServer: ${response.status}\nPesan: ${errMsg}`,
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
    const elDupe = document.querySelector(".alert-danger strong");
    if (elDupe) {
      return "(3D) SN duplikat";
    }
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

  async function fetchSchoolGuru(npsn) {
    try {
      const res = await fetch(
        `https://jkt-dc01.taila6748c.ts.net/fetch-school-data?npsn=${npsn}`,
        {
          method: "POST",
          headers: { accept: "application/json" },
        },
      );
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function renderDashboard(data) {
    setTimeout(async () => {
      const npsn = pageData.npsn;
      if (!npsn || npsn === "-") return;

      const leftBox = document.getElementById("sys-sticky-left"); // Changed to LEFT box
      if (!leftBox) return;

      if (document.getElementById("sys-guru-box")) return;

      const guruBox = document.createElement("div");
      guruBox.id = "sys-guru-box";
      // Added margin-top and padding to fit nicely inside the left box structure
      guruBox.style =
        "margin-top:10px;padding:12px;background:#f8fafc;border-top:1px solid #e2e8f0;";

      // --- FIX LAYOUT GURU BOX (Dashboard) ---
      guruBox.innerHTML = `
        <div style="font-weight:800; font-size:11px; text-transform:uppercase; color:#64748b; letter-spacing:0.5px; margin-bottom:8px; display:block;">Kepala Sekolah :</div>
        <div id="sys-kepsek-nama" style="margin-bottom:12px; font-size:13px; font-weight:600; color:#1e293b; background:#f0f9ff; border:1px solid #bae6fd; padding:8px 12px; border-radius:6px; display:block;">Loading...</div>
        <input id="sys-guru-search" class="sys-form-input" style="margin-bottom:10px;" placeholder="Cari guru..." autocomplete="off">
        <div id="sys-guru-list" style="max-height:180px; overflow-y:auto; border:1px solid #e2e8f0; background:#fff; border-radius:7px; padding:4px;"></div>
      `;

      // Append to the bottom of the left box
      leftBox.appendChild(guruBox);

      const schoolData = await fetchSchoolGuru(npsn);
      if (!schoolData) {
        document.getElementById("sys-kepsek-nama").innerText =
          "Gagal fetch data.";
        return;
      }
      document.getElementById("sys-kepsek-nama").innerHTML =
        `<div class="sys-kepsek-nama-block">
          <div class="sys-kepsek-nama">${schoolData.namaKepsek || "-"}</div>
        </div>`;
      GM_addStyle(`
        .sys-kepsek-nama-block {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0;
          width: 100%;
          box-sizing: border-box;
        }
        .sys-kepsek-label {
          font-size: 11px;
          color: #0284c7;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.5px;
          background: #e0f2fe;
          border-radius: 6px 6px 0 0;
          padding: 6px 12px 2px 12px;
          margin-bottom: 0;
        }
        .sys-kepsek-nama {
          font-size: 16px;
          color: #1e293b;
          font-weight: 700;
          word-break: break-word;
          white-space: normal;
          background: #f0f9ff;
          border-radius: 0 0 6px 6px;
          padding: 8px 12px 8px 12px;
          border: 1px solid #bae6fd;
          border-top: none;
        }
      `);

      let guruList = schoolData.guruLain || [];
      if (schoolData.namaKepsek) {
        guruList = [
          { nama: schoolData.namaKepsek, jabatan: "Kepala Sekolah" },
          ...guruList,
        ];
      }
      const listDiv = document.getElementById("sys-guru-list");

      function renderList(filter) {
        let html = "";
        let results = guruList;
        let searchPattern = filter?.trim().toLowerCase();
        if (searchPattern && searchPattern.length > 1) {
          results = guruList
            .filter(
              (g) =>
                g.nama.toLowerCase().startsWith(searchPattern) ||
                g.jabatan.toLowerCase().startsWith(searchPattern),
            )
            .slice(0, 5);
        } else if (searchPattern && searchPattern.length <= 1) {
          results = [];
        }
        results.forEach((g) => {
          let nama = g.nama;
          let jabatan = g.jabatan;
          if (searchPattern && searchPattern.length > 1) {
            if (nama.toLowerCase().startsWith(searchPattern)) {
              nama = `<mark style=\"background: #ffe066; color: #222;\">${nama.slice(0, searchPattern.length)}</mark>${nama.slice(searchPattern.length)}`;
            }
            if (jabatan.toLowerCase().startsWith(searchPattern)) {
              jabatan = `<mark style=\"background: #ffe066; color: #222;\">${jabatan.slice(0, searchPattern.length)}</mark>${jabatan.slice(searchPattern.length)}`;
            }
          }
          html += `<div class="sys-guru-list-item"><b>${nama}</b><br><span class='sys-guru-list-jabatan'>${jabatan}</span></div>`;
        });
        listDiv.innerHTML =
          html ||
          '<div style="color:#cbd5e1; font-size:12px; padding:8px; text-align:center;">Tidak ada data ditampilkan.</div>';
      }
      renderList("");
      // Tambah CSS global untuk styling hasil pencarian guru
      GM_addStyle(`
        .sys-guru-list-item {
          display: block;
          font-size: 13px;
          line-height: 1.5;
          padding: 8px 12px;
          margin: 0;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          background: #fff;
          transition: background 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sys-guru-list-item:last-child { border-bottom: none; }
        .sys-guru-list-item:hover { background: #f1f5f9; }
        .sys-guru-list-jabatan {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 500;
        }
      `);
      document
        .getElementById("sys-guru-search")
        .addEventListener("input", (e) => renderList(e.target.value));
    }, 1000);

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
                    <button id="sys-btn-toggle-confirm" class="sys-btn-toggle-confirm ${confirmationEnabled ? "enabled" : "disabled"}" title="Toggle konfirmasi modal">
                        <span id="confirm-icon">${confirmationEnabled ? "🔔" : "🔕"}</span>
                        <span id="confirm-text">${confirmationEnabled ? "Konfirmasi ON" : "Konfirmasi OFF"}</span>
                    </button>
                    <button id="sys-btn-reset" class="sys-btn-reset" title="Klik untuk login ulang">🔄 Reset Token</button>
                    <span class="sys-status-label">${awb.CurrentState || "UNKNOWN"}</span>
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
      html += `<tr><td style="white-space:nowrap;">${h.date}</td><td>${h.location_code || "-"}</td><td><strong>${h.status_code}</strong></td><td>${h.status}<br><small style="color:#888;">${h.status_desc}</small></td></tr>`;
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

      const btnToggleConfirm = document.getElementById(
        "sys-btn-toggle-confirm",
      );
      if (btnToggleConfirm) {
        btnToggleConfirm.onclick = function () {
          confirmationEnabled = !confirmationEnabled;
          localStorage.setItem("sys_confirm_enabled", confirmationEnabled);

          const icon = document.getElementById("confirm-icon");
          const text = document.getElementById("confirm-text");

          if (confirmationEnabled) {
            this.className = "sys-btn-toggle-confirm enabled";
            if (icon) icon.textContent = "🔔";
            if (text) text.textContent = "Konfirmasi ON";
          } else {
            this.className = "sys-btn-toggle-confirm disabled";
            if (icon) icon.textContent = "🔕";
            if (text) text.textContent = "Konfirmasi OFF";
          }
        };
      }
    }, 500);

    const galleryEl = document.getElementById("sys-gallery-container");
    if (galleryEl && photoKeys.length > 0) {
      viewerInstance = new Viewer(galleryEl, {
        title: false,
        navbar: true,
        zoomRatio: 0.2,
        transition: false,
        tooltip: true,
        movable: true,
        toolbar: {
          zoomIn: 1,
          zoomOut: 1,
          rotateLeft: 1,
          rotateRight: 1,
          prev: 1,
          next: 1,
          reset: 1,
        },
        view: function () {
          setTimeout(() => {
            injectStickyBoxesToViewer();
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

  document.addEventListener(
    "keydown",
    function (e) {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        ((activeEl.tagName === "INPUT" &&
          (activeEl.type === "text" || activeEl.type === "password")) ||
          activeEl.tagName === "TEXTAREA")
      )
        return;

      const viewerContainer = document.querySelector(
        ".viewer-container.viewer-in",
      );
      if (viewerContainer && viewerInstance) {
        const key = e.key.toLowerCase();
        const allowedKeys = ["a", "d", "q", "e", "r", "x", "escape"];

        if (allowedKeys.includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (key === "a") viewerInstance.prev();
          if (key === "d") viewerInstance.next();
          if (key === "q") viewerInstance.rotate(-90);
          if (key === "e") viewerInstance.rotate(90);
          if (key === "r") viewerInstance.reset();
          if (key === "x" || key === "escape") viewerInstance.hide();
        }
      }
    },
    true,
  );

  const handleMouseNav = (e) => {
    if (e.button === 3 || e.button === 4) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return true;
    }
    return false;
  };

  document.addEventListener("mouseup", handleMouseNav, true);
  document.addEventListener(
    "mousedown",
    function (e) {
      if (handleMouseNav(e)) {
        const viewerContainer = document.querySelector(
          ".viewer-container.viewer-in",
        );
        if (viewerContainer && viewerInstance) {
          if (e.button === 3) viewerInstance.prev();
          if (e.button === 4) viewerInstance.next();
        }
      }
    },
    true,
  );

  function injectStickyBoxesToViewer() {
    const viewerContainer = document.querySelector(".viewer-container");
    if (!viewerContainer) return;

    const existingLeft = viewerContainer.querySelector("#sys-sticky-left");
    const existingRight = viewerContainer.querySelector("#sys-sticky-right");

    if (existingLeft && existingRight) return;

    if (existingLeft) existingLeft.remove();
    if (existingRight) existingRight.remove();

    const leftBox = document.createElement("div");
    leftBox.id = "sys-sticky-left";
    leftBox.className = "sys-sticky-box";
    leftBox.innerHTML = `
        <div class="sys-card-header">
            <h2>${pageData.namaSekolah}</h2>
            <div class="sys-card-npsn">NPSN: ${pageData.npsn}</div>
        </div>
        <div class="sys-serial-section">
            <span class="sys-serial-label">SERIAL NUMBER</span>
            <div class="sys-serial-number">${pageData.snPenyedia}</div>
        </div>
        <div class="sys-card-body">
            <span class="sys-info-title">Alamat</span>
            <div class="sys-info-item"><span class="sys-info-label"></span> ${pageData.alamat}</div>
            ${(() => {
              if (!awbComments || awbComments.length === 0) return "";
              const items = awbComments
                .map((c) => {
                  const ts = (c.CreatedAt || "")
                    .replace("T", " ")
                    .split("+")[0];
                  const who = c.commenter_name
                    ? ` — <strong>${c.commenter_name}</strong>`
                    : "";
                  const text = (c.comment || "")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                  return `<li style="margin-bottom:8px; line-height:1.4;"><div style="font-size:13px; color:#64748b;">${ts}${who}</div><div style="font-size:17px; color:#0f172a;">${text}</div></li>`;
                })
                .join("");
              return `<div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:12px;"><span class="sys-info-title">Riwayat Komentar</span><ul style="list-style: none; padding:0; margin:8px 0 0 0; max-height:800px; overflow:auto;">${items}</ul></div>`;
            })()}
        </div>
    `;
    viewerContainer.appendChild(leftBox);

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
        const toScroll = e.deltaY;
        rightBox.scrollTop += toScroll;
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

    let formHtml = `<div class="sys-sticky-title"><span>Form Evaluasi</span><button id="sys-btn-toggle-confirm-mini" class="sys-toggle-mini ${confirmationEnabled ? "enabled" : "disabled"}" title="Toggle konfirmasi modal"><span id="confirm-icon-mini">${confirmationEnabled ? "🔔" : "🔕"}</span></button></div>`;
    formHtml += createDropdownHtml("ket_tgl_bapp", "Status Tgl BAPP");
    formHtml += `<div class="sys-form-row sys-hidden" id="box_date_wrapper"><label class="sys-form-label">Input Tanggal BAPP</label><input type="date" class="sys-form-input" id="box_tgl_bapp_input" value="${formState.tgl_manual || ""}"></div>`;

    const fields = [
      { name: "geo_tag", label: "Geo Tagging" },
      { name: "f_papan_identitas", label: "Papan Identitas" },
      { name: "f_box_pic", label: "BOX dan PIC" },
      { name: "f_unit", label: "Kelengkapan Unit" },
      { name: "spesifikasi_dxdiag", label: "Spek Dxdiag" },
      { name: "bc_bapp_sn", label: "Barcode SN BAPP" },
    ];
    fields.forEach((f) => {
      formHtml += createDropdownHtml(f.name, f.label);
    });
    formHtml += `<div class="sys-form-row"><label class="sys-form-label">Input SN (Manual)</label><input type="text" class="sys-form-input" id="box_sn_bapp_input" placeholder="Ketik SN di sini..." style="text-transform:uppercase;" value="${formState.sn_manual || ""}"></div>`;
    const fields2 = [
      { name: "bapp_hal1", label: "BAPP Hal 1" },
      { name: "bapp_hal2", label: "BAPP Hal 2" },
      { name: "nm_ttd_bapp", label: "Tanda Tangan" },
      { name: "stempel", label: "Stempel" },
    ];
    fields2.forEach((f) => {
      formHtml += createDropdownHtml(f.name, f.label);
    });
    rightBox.innerHTML = formHtml;
    viewerContainer.appendChild(rightBox);

    const btnToggleMini = rightBox.querySelector(
      "#sys-btn-toggle-confirm-mini",
    );
    if (btnToggleMini) {
      btnToggleMini.onclick = function (e) {
        e.stopPropagation();
        confirmationEnabled = !confirmationEnabled;
        localStorage.setItem("sys_confirm_enabled", confirmationEnabled);
        const iconMini = this.querySelector("#confirm-icon-mini");
        if (confirmationEnabled) {
          this.className = "sys-toggle-mini enabled";
          if (iconMini) iconMini.textContent = "🔔";
        } else {
          this.className = "sys-toggle-mini disabled";
          if (iconMini) iconMini.textContent = "🔕";
        }
        const btnToggleHeader = document.getElementById(
          "sys-btn-toggle-confirm",
        );
        if (btnToggleHeader) {
          const icon = document.getElementById("confirm-icon");
          const text = document.getElementById("confirm-text");
          if (confirmationEnabled) {
            btnToggleHeader.className = "sys-btn-toggle-confirm enabled";
            if (icon) icon.textContent = "🔔";
            if (text) text.textContent = "Konfirmasi ON";
          } else {
            btnToggleHeader.className = "sys-btn-toggle-confirm disabled";
            if (icon) icon.textContent = "🔕";
            if (text) text.textContent = "Konfirmasi OFF";
          }
        }
      };
    }

    setupSyncLogic(rightBox);
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
          if (typeof formState !== "undefined") formState.tgl_manual = isoDate;
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
        html += `<option value="${opt.value}" ${isSelected}>${opt.text.trim()}</option>`;
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
    const elDupe = document.querySelector(".alert-danger strong");
    if (elDupe) {
      const snDupe = elDupe.innerText.trim();
      snBox.value = snDupe;
      snReal.value = snDupe;
      formState.sn_manual = snDupe;
      formState.dropdowns["bc_bapp_sn"] = "Tidak sesuai";
      const bcSelect = document.querySelector(
        'select[data-target="bc_bapp_sn"]',
      );
      if (bcSelect) {
        bcSelect.value = "Tidak sesuai";
        bcSelect.dispatchEvent(new Event("change"));
      }
      return;
    }
    if (value === "Ada") {
      if (pageData.snPenyedia !== "-" && !formState.sn_manual) {
        snBox.value = pageData.snPenyedia;
        snReal.value = pageData.snPenyedia;
        formState.sn_manual = pageData.snPenyedia;
      }
    }
  }
})();