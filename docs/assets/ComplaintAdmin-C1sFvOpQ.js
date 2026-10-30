import{$ as e,B as t,F as n,H as r,O as i,T as a,X as o,a as s,at as c,ft as l,i as u,j as d,k as f,m as p,n as m,p as h,t as g,ut as _,w as v,x as y,z as b}from"./index-BIGyryAT.js";var x=e(`Copy`,[[`rect`,{width:`14`,height:`14`,x:`8`,y:`8`,rx:`2`,ry:`2`,key:`17jyea`}],[`path`,{d:`M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`,key:`zix9uf`}]]),S=l(_(),1),C=h();function w({isOpen:e,onClose:t,complaintUrl:n,qrApiUrl:r}){let[i,a]=(0,S.useState)(`light`),[o,s]=(0,S.useState)(`a4`),[c,l]=(0,S.useState)(()=>localStorage.getItem(`cmdigital_poster_hotline`)||`Security & Helpdesk: (021) 5304747 / WhatsApp CMMDIGITAL`),[u,d]=(0,S.useState)(()=>localStorage.getItem(`cmdigital_poster_bldg`)||`CMMDIGITAL BUILDING`);if(!e)return null;let m=()=>{let e=i===`dark`,t=window.open(``,`_blank`,`width=900,height=1200`);if(!t){alert(`Mohon izinkan pop-up di browser untuk mencetak poster.`);return}let n=`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Poster Pengaduan Publik - ${u}</title>
        <style>
          @page {
            size: ${o===`a5`?`A5 portrait`:`A4 portrait`};
            margin: 0;
          }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            background: ${e?`#081021`:`#ffffff`};
            color: ${e?`#f8fafc`:`#0f172a`};
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
          }
          .poster-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 32px 36px;
            background: ${e?`linear-gradient(180deg, #09132b 0%, #060b17 100%)`:`linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)`};
            position: relative;
            border: ${e?`2px solid #1e293b`:`none`};
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid ${e?`#1e3a8a`:`#e2e8f0`};
            padding-bottom: 16px;
          }
          .brand {
            display: flex;
            flex-direction: column;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: 2px;
            color: ${e?`#38bdf8`:`#0369a1`};
            text-transform: uppercase;
            margin: 0;
          }
          .brand-sub {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1.5px;
            color: ${e?`#94a3b8`:`#64748b`};
            margin-top: 2px;
            text-transform: uppercase;
          }
          .badge-live {
            background: ${e?`rgba(56, 189, 248, 0.15)`:`#e0f2fe`};
            border: 1px solid ${e?`#0284c7`:`#bae6fd`};
            color: ${e?`#38bdf8`:`#0369a1`};
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .hero-section {
            text-align: center;
            margin-top: 10px;
          }
          .hero-title {
            font-size: 32px;
            font-weight: 900;
            line-height: 1.15;
            margin: 0 0 8px 0;
            color: ${e?`#ffffff`:`#0f172a`};
            letter-spacing: -0.5px;
          }
          .hero-title span {
            color: ${e?`#38bdf8`:`#0284c7`};
          }
          .hero-desc {
            font-size: 13.5px;
            color: ${e?`#94a3b8`:`#475569`};
            max-width: 80%;
            margin: 0 auto;
            line-height: 1.45;
          }
          .qr-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 16px 0;
          }
          .qr-frame {
            background: #ffffff;
            padding: 16px;
            border-radius: 20px;
            box-shadow: ${e?`0 15px 35px rgba(0,0,0,0.6)`:`0 12px 30px rgba(0,0,0,0.08)`};
            border: 3px solid ${e?`#38bdf8`:`#0284c7`};
            text-align: center;
          }
          .qr-img {
            width: 220px;
            height: 220px;
            display: block;
          }
          .qr-caption {
            margin-top: 10px;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 1.5px;
            color: #0f172a;
            text-transform: uppercase;
          }
          .qr-subtext {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
          }
          .steps-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin: 10px 0;
          }
          .step-card {
            background: ${e?`rgba(255,255,255,0.04)`:`#f8fafc`};
            border: 1px solid ${e?`#1e293b`:`#e2e8f0`};
            border-radius: 12px;
            padding: 12px 10px;
            text-align: center;
          }
          .step-num {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #0284c7;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 6px auto;
          }
          .step-title {
            font-size: 12px;
            font-weight: 800;
            color: ${e?`#f1f5f9`:`#1e293b`};
            margin-bottom: 3px;
          }
          .step-desc {
            font-size: 9.5px;
            color: ${e?`#94a3b8`:`#64748b`};
            line-height: 1.35;
          }
          .category-pills {
            display: flex;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 6px;
          }
          .pill {
            background: ${e?`#0f172a`:`#f1f5f9`};
            border: 1px solid ${e?`#334155`:`#cbd5e1`};
            color: ${e?`#cbd5e1`:`#334155`};
            font-size: 9.5px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
          }
          .footer-section {
            border-top: 2px solid ${e?`#1e3a8a`:`#e2e8f0`};
            padding-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .footer-info {
            font-size: 10px;
            color: ${e?`#94a3b8`:`#64748b`};
            line-height: 1.4;
          }
          .footer-strong {
            font-weight: 800;
            color: ${e?`#f8fafc`:`#0f172a`};
          }
          .footer-badge {
            text-align: right;
            font-size: 9px;
            color: ${e?`#64748b`:`#94a3b8`};
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="poster-container">
          <div class="header">
            <div class="brand">
              <h1 class="brand-title">${u}</h1>
              <div class="brand-sub">Building Management & Security Support</div>
            </div>
            <div class="badge-live">Layanan Pengaduan Cepat</div>
          </div>

          <div class="hero-section">
            <h2 class="hero-title">Ada Masukan & Keluhan? <br><span>Scan & Kami Tuntaskan Segera</span></h2>
            <p class="hero-desc">
              Sampaikan kendala fasilitas, kebersihan, keamanan, atau kenyamanan di lingkungan gedung tanpa perlu login akun.
            </p>
          </div>

          <div class="qr-wrapper">
            <div class="qr-frame">
              <img src="${r}" class="qr-img" alt="QR Code Komplain" />
              <div class="qr-caption">Arahkan Kamera HP di Sini</div>
              <div class="qr-subtext">Otomatis membuka Form Tiket Publik CMMDIGITAL</div>
            </div>
          </div>

          <div class="steps-grid">
            <div class="step-card">
              <div class="step-num">1</div>
              <div class="step-title">Scan Barcode</div>
              <div class="step-desc">Gunakan kamera smartphone tanpa unduh aplikasi baru.</div>
            </div>
            <div class="step-card">
              <div class="step-num">2</div>
              <div class="step-title">Isi Kendala & Foto</div>
              <div class="step-desc">Tulis lokasi lantai & keluhan. Lampirkan foto bila diperlukan.</div>
            </div>
            <div class="step-card">
              <div class="step-num">3</div>
              <div class="step-title">Respon Petugas</div>
              <div class="step-desc">Tim Engineering, Kebersihan, atau Keamanan langsung merapat.</div>
            </div>
          </div>

          <div style="text-align:center;">
            <div style="font-size: 10px; font-weight: 700; color:${e?`#64748b`:`#94a3b8`}; margin-bottom: 4px; text-transform:uppercase; letter-spacing:0.8px;">
              Layanan Penanganan Meliputi:
            </div>
            <div class="category-pills">
              <div class="pill">❄️ AC & Kelistrikan</div>
              <div class="pill">🧹 Kebersihan & Toilet</div>
              <div class="pill">🛡️ Keamanan & Satpam</div>
              <div class="pill">🚗 Parkir & Akses Lift</div>
              <div class="pill">💡 Fasilitas Tenant</div>
              <div class="pill">💬 Kritik & Saran</div>
            </div>
          </div>

          <div class="footer-section">
            <div class="footer-info">
              <div class="footer-strong">${c}</div>
              <div>Gedung CMMDIGITAL • Layanan Siaga 24 Jam</div>
            </div>
            <div class="footer-badge">
              <div>SISTEM TIKET RESMI</div>
              <div>CMD SYSTEM</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        <\/script>
      </body>
      </html>
    `;t.document.open(),t.document.write(n),t.document.close()},h=i===`dark`;return(0,C.jsx)(`div`,{style:{position:`fixed`,inset:0,zIndex:9999,background:`rgba(0,0,0,0.85)`,backdropFilter:`blur(8px)`,display:`flex`,alignItems:`center`,justifyContent:`center`,padding:`1rem`},children:(0,C.jsxs)(`div`,{style:{background:`var(--bg-glass-card, #0f172a)`,border:`1px solid var(--border-glass, rgba(255,255,255,0.1))`,borderRadius:`16px`,width:`100%`,maxWidth:`850px`,maxHeight:`92vh`,display:`flex`,flexDirection:`column`,boxShadow:`0 25px 50px -12px rgba(0,0,0,0.7)`,overflow:`hidden`},children:[(0,C.jsxs)(`div`,{style:{padding:`1rem 1.25rem`,borderBottom:`1px solid var(--border-glass, rgba(255,255,255,0.1))`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,background:`rgba(255,255,255,0.02)`},children:[(0,C.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.6rem`},children:[(0,C.jsx)(`div`,{style:{background:`linear-gradient(135deg, #0284c7, #38bdf8)`,color:`#fff`,padding:`0.45rem`,borderRadius:`8px`,display:`flex`,alignItems:`center`},children:(0,C.jsx)(f,{size:18})}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`h3`,{style:{margin:0,fontSize:`1rem`,fontWeight:800,color:`var(--text-primary)`},children:`Desain Poster & Standee Akrilik Komplain CMMDIGITAL`}),(0,C.jsx)(`p`,{style:{margin:0,fontSize:`0.72rem`,color:`var(--text-muted)`},children:`Siap cetak format A4/A5 untuk dipajang di Lobby, Meja Resepsionis, Koridor Tenant & Area Publik`})]})]}),(0,C.jsx)(`button`,{onClick:t,className:`btn-icon`,style:{borderRadius:`50%`,padding:`0.4rem`},children:(0,C.jsx)(p,{size:18})})]}),(0,C.jsxs)(`div`,{style:{display:`flex`,flex:1,overflow:`hidden`,flexDirection:window.innerWidth<768?`column`:`row`},children:[(0,C.jsxs)(`div`,{style:{width:window.innerWidth<768?`100%`:`300px`,borderRight:`1px solid var(--border-glass, rgba(255,255,255,0.1))`,padding:`1rem`,overflowY:`auto`,background:`rgba(0,0,0,0.15)`},children:[(0,C.jsxs)(`div`,{style:{marginBottom:`1rem`},children:[(0,C.jsx)(`label`,{style:{fontSize:`0.68rem`,fontWeight:800,color:`var(--text-secondary)`,display:`block`,marginBottom:`0.4rem`},children:`PILIH TEMA POSTER`}),(0,C.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`0.4rem`},children:[(0,C.jsx)(`button`,{type:`button`,onClick:()=>a(`light`),style:{padding:`0.5rem`,borderRadius:`8px`,border:i===`light`?`2px solid #0284c7`:`1px solid var(--border-glass)`,background:i===`light`?`#ffffff`:`rgba(255,255,255,0.05)`,color:i===`light`?`#0f172a`:`var(--text-secondary)`,fontWeight:700,fontSize:`0.72rem`,cursor:`pointer`},children:`📄 Light (Kertas/A4)`}),(0,C.jsx)(`button`,{type:`button`,onClick:()=>a(`dark`),style:{padding:`0.5rem`,borderRadius:`8px`,border:i===`dark`?`2px solid #38bdf8`:`1px solid var(--border-glass)`,background:i===`dark`?`#081021`:`rgba(255,255,255,0.05)`,color:i===`dark`?`#38bdf8`:`var(--text-secondary)`,fontWeight:700,fontSize:`0.72rem`,cursor:`pointer`},children:`🌌 Navy Gold (Akrilik)`})]})]}),(0,C.jsxs)(`div`,{style:{marginBottom:`1rem`},children:[(0,C.jsx)(`label`,{style:{fontSize:`0.68rem`,fontWeight:800,color:`var(--text-secondary)`,display:`block`,marginBottom:`0.4rem`},children:`UKURAN KERTAS`}),(0,C.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`0.4rem`},children:[(0,C.jsx)(`button`,{type:`button`,onClick:()=>s(`a4`),style:{padding:`0.45rem`,borderRadius:`8px`,border:o===`a4`?`2px solid #0284c7`:`1px solid var(--border-glass)`,background:o===`a4`?`rgba(2, 132, 199, 0.15)`:`transparent`,color:o===`a4`?`#38bdf8`:`var(--text-secondary)`,fontWeight:700,fontSize:`0.72rem`},children:`A4 (Dinding/Papan)`}),(0,C.jsx)(`button`,{type:`button`,onClick:()=>s(`a5`),style:{padding:`0.45rem`,borderRadius:`8px`,border:o===`a5`?`2px solid #0284c7`:`1px solid var(--border-glass)`,background:o===`a5`?`rgba(2, 132, 199, 0.15)`:`transparent`,color:o===`a5`?`#38bdf8`:`var(--text-secondary)`,fontWeight:700,fontSize:`0.72rem`},children:`A5 (Standee Meja)`})]})]}),(0,C.jsxs)(`div`,{style:{marginBottom:`1rem`},children:[(0,C.jsx)(`label`,{style:{fontSize:`0.68rem`,fontWeight:800,color:`var(--text-secondary)`,display:`block`,marginBottom:`0.35rem`},children:`NAMA GEDUNG`}),(0,C.jsx)(`input`,{type:`text`,value:u,onChange:e=>{d(e.target.value),localStorage.setItem(`cmdigital_poster_bldg`,e.target.value)},className:`modern-input`,style:{fontSize:`0.75rem`,width:`100%`,padding:`0.4rem 0.6rem`}})]}),(0,C.jsxs)(`div`,{style:{marginBottom:`1.25rem`},children:[(0,C.jsx)(`label`,{style:{fontSize:`0.68rem`,fontWeight:800,color:`var(--text-secondary)`,display:`block`,marginBottom:`0.35rem`},children:`INFO KONTAK / HELPDESK FOOTER`}),(0,C.jsx)(`input`,{type:`text`,value:c,onChange:e=>{l(e.target.value),localStorage.setItem(`cmdigital_poster_hotline`,e.target.value)},className:`modern-input`,style:{fontSize:`0.75rem`,width:`100%`,padding:`0.4rem 0.6rem`}})]}),(0,C.jsxs)(`div`,{style:{background:`rgba(56, 189, 248, 0.08)`,border:`1px solid rgba(56, 189, 248, 0.25)`,borderRadius:`8px`,padding:`0.65rem`,fontSize:`0.68rem`,color:`var(--text-secondary)`,lineHeight:`1.45`,marginBottom:`1rem`},children:[`💡 `,(0,C.jsx)(`strong`,{children:`Tips Cetak:`}),` Gunakan opsi kertas tebal / Art Paper 260gr atau masukkan ke dalam bingkai standing akrilik transparan (A4/A5) agar terlihat mewah di meja resepsionis atau lift.`]}),(0,C.jsxs)(`button`,{onClick:m,className:`btn-primary`,style:{width:`100%`,padding:`0.65rem 1rem`,fontSize:`0.82rem`,fontWeight:800,display:`flex`,alignItems:`center`,justifyContent:`center`,gap:`0.4rem`},children:[(0,C.jsx)(f,{size:16}),` Cetak / Unduh PDF Poster`]})]}),(0,C.jsx)(`div`,{style:{flex:1,overflowY:`auto`,padding:`1.25rem`,display:`flex`,justifyContent:`center`,alignItems:`flex-start`,background:`rgba(0,0,0,0.4)`},children:(0,C.jsxs)(`div`,{style:{width:`100%`,maxWidth:`440px`,aspectRatio:`1 / 1.414`,background:h?`linear-gradient(180deg, #09132b 0%, #060b17 100%)`:`#ffffff`,color:h?`#f8fafc`:`#0f172a`,borderRadius:`12px`,boxShadow:`0 20px 40px rgba(0,0,0,0.5)`,padding:`1.25rem`,display:`flex`,flexDirection:`column`,justifyContent:`space-between`,border:h?`2px solid #1e3a8a`:`1px solid #e2e8f0`,position:`relative`},children:[(0,C.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,borderBottom:`2px solid ${h?`#1e3a8a`:`#e2e8f0`}`,paddingBottom:`0.5rem`},children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`h4`,{style:{margin:0,fontSize:`0.95rem`,fontWeight:900,letterSpacing:`1px`,color:h?`#38bdf8`:`#0284c7`},children:u}),(0,C.jsx)(`p`,{style:{margin:0,fontSize:`0.55rem`,fontWeight:700,color:h?`#94a3b8`:`#64748b`},children:`BUILDING MANAGEMENT & SECURITY`})]}),(0,C.jsx)(`div`,{style:{background:h?`rgba(56, 189, 248, 0.15)`:`#e0f2fe`,color:h?`#38bdf8`:`#0369a1`,border:`1px solid ${h?`#0284c7`:`#bae6fd`}`,borderRadius:`999px`,padding:`0.2rem 0.5rem`,fontSize:`0.55rem`,fontWeight:800},children:`Layanan Cepat`})]}),(0,C.jsxs)(`div`,{style:{textAlign:`center`,margin:`0.5rem 0`},children:[(0,C.jsxs)(`h3`,{style:{margin:`0 0 0.2rem 0`,fontSize:`1.05rem`,fontWeight:900,lineHeight:1.2},children:[`Ada Masukan & Keluhan? `,(0,C.jsx)(`br`,{}),(0,C.jsx)(`span`,{style:{color:h?`#38bdf8`:`#0284c7`},children:`Scan & Kami Tuntaskan Segera`})]}),(0,C.jsx)(`p`,{style:{margin:0,fontSize:`0.62rem`,color:h?`#94a3b8`:`#64748b`,lineHeight:1.3},children:`Sampaikan kendala fasilitas, AC, kebersihan, atau keamanan tanpa perlu login akun.`})]}),(0,C.jsx)(`div`,{style:{textAlign:`center`,margin:`0.25rem 0`},children:(0,C.jsxs)(`div`,{style:{background:`#ffffff`,padding:`0.6rem`,borderRadius:`12px`,display:`inline-block`,border:`2px solid ${h?`#38bdf8`:`#0284c7`}`,boxShadow:`0 6px 15px rgba(0,0,0,0.1)`},children:[(0,C.jsx)(`img`,{src:r,alt:`QR Code`,style:{width:`130px`,height:`130px`,display:`block`}}),(0,C.jsx)(`div`,{style:{marginTop:`0.3rem`,fontSize:`0.62rem`,fontWeight:900,color:`#0f172a`,letterSpacing:`0.8px`},children:`ARAHKAN KAMERA HP`}),(0,C.jsx)(`div`,{style:{fontSize:`0.48rem`,color:`#64748b`},children:`Buka Form Pengaduan CMMDIGITAL`})]})}),(0,C.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(3, 1fr)`,gap:`0.4rem`,margin:`0.4rem 0`},children:[(0,C.jsxs)(`div`,{style:{background:h?`rgba(255,255,255,0.03)`:`#f8fafc`,padding:`0.4rem 0.2rem`,borderRadius:`6px`,textAlign:`center`,border:`1px solid ${h?`#1e293b`:`#e2e8f0`}`},children:[(0,C.jsx)(`div`,{style:{width:`18px`,height:`18px`,borderRadius:`50%`,background:`#0284c7`,color:`#fff`,fontSize:`0.55rem`,fontWeight:800,display:`flex`,alignItems:`center`,justifyContent:`center`,margin:`0 auto 0.2rem auto`},children:`1`}),(0,C.jsx)(`div`,{style:{fontSize:`0.55rem`,fontWeight:800},children:`Scan Barcode`}),(0,C.jsx)(`div`,{style:{fontSize:`0.45rem`,color:h?`#94a3b8`:`#64748b`},children:`Buka kamera HP`})]}),(0,C.jsxs)(`div`,{style:{background:h?`rgba(255,255,255,0.03)`:`#f8fafc`,padding:`0.4rem 0.2rem`,borderRadius:`6px`,textAlign:`center`,border:`1px solid ${h?`#1e293b`:`#e2e8f0`}`},children:[(0,C.jsx)(`div`,{style:{width:`18px`,height:`18px`,borderRadius:`50%`,background:`#0284c7`,color:`#fff`,fontSize:`0.55rem`,fontWeight:800,display:`flex`,alignItems:`center`,justifyContent:`center`,margin:`0 auto 0.2rem auto`},children:`2`}),(0,C.jsx)(`div`,{style:{fontSize:`0.55rem`,fontWeight:800},children:`Isi Keluhan`}),(0,C.jsx)(`div`,{style:{fontSize:`0.45rem`,color:h?`#94a3b8`:`#64748b`},children:`Tulis lantai & foto`})]}),(0,C.jsxs)(`div`,{style:{background:h?`rgba(255,255,255,0.03)`:`#f8fafc`,padding:`0.4rem 0.2rem`,borderRadius:`6px`,textAlign:`center`,border:`1px solid ${h?`#1e293b`:`#e2e8f0`}`},children:[(0,C.jsx)(`div`,{style:{width:`18px`,height:`18px`,borderRadius:`50%`,background:`#0284c7`,color:`#fff`,fontSize:`0.55rem`,fontWeight:800,display:`flex`,alignItems:`center`,justifyContent:`center`,margin:`0 auto 0.2rem auto`},children:`3`}),(0,C.jsx)(`div`,{style:{fontSize:`0.55rem`,fontWeight:800},children:`Respon Cepat`}),(0,C.jsx)(`div`,{style:{fontSize:`0.45rem`,color:h?`#94a3b8`:`#64748b`},children:`Tim sigap tangani`})]})]}),(0,C.jsxs)(`div`,{style:{display:`flex`,justifyContent:`center`,gap:`0.25rem`,flexWrap:`wrap`,margin:`0.2rem 0`},children:[(0,C.jsx)(`span`,{style:{fontSize:`0.48rem`,background:h?`#0f172a`:`#f1f5f9`,border:`1px solid ${h?`#334155`:`#cbd5e1`}`,padding:`0.15rem 0.35rem`,borderRadius:`4px`},children:`❄️ AC & Fasilitas`}),(0,C.jsx)(`span`,{style:{fontSize:`0.48rem`,background:h?`#0f172a`:`#f1f5f9`,border:`1px solid ${h?`#334155`:`#cbd5e1`}`,padding:`0.15rem 0.35rem`,borderRadius:`4px`},children:`🧹 Kebersihan`}),(0,C.jsx)(`span`,{style:{fontSize:`0.48rem`,background:h?`#0f172a`:`#f1f5f9`,border:`1px solid ${h?`#334155`:`#cbd5e1`}`,padding:`0.15rem 0.35rem`,borderRadius:`4px`},children:`🛡️ Keamanan`}),(0,C.jsx)(`span`,{style:{fontSize:`0.48rem`,background:h?`#0f172a`:`#f1f5f9`,border:`1px solid ${h?`#334155`:`#cbd5e1`}`,padding:`0.15rem 0.35rem`,borderRadius:`4px`},children:`💬 Kritik & Saran`})]}),(0,C.jsxs)(`div`,{style:{borderTop:`1px solid ${h?`#1e3a8a`:`#e2e8f0`}`,paddingTop:`0.4rem`,display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`div`,{style:{fontSize:`0.55rem`,fontWeight:800},children:c}),(0,C.jsx)(`div`,{style:{fontSize:`0.48rem`,color:h?`#94a3b8`:`#64748b`},children:`Gedung CMMDIGITAL`})]}),(0,C.jsx)(`div`,{style:{fontSize:`0.48rem`,fontWeight:700,color:h?`#38bdf8`:`#0284c7`},children:`SISTEM RESMI CMMDIGITAL`})]})]})})]})]})})}var T=[`Teknisi`,`Cleaning`,`Keamanan`,`Manajemen`],E=[`Baru`,`Diterima`,`Diproses`,`Selesai`],D={all:`Semua`,Baru:`Baru`,Diterima:`Terima`,Diproses:`Proses`,Selesai:`Selesai`};function O({complaints:e=[],onUpdateComplaint:l,onDeleteComplaint:p}){let[h,_]=(0,S.useState)(`all`),[O,k]=(0,S.useState)(``),[A,j]=(0,S.useState)(null),[M,N]=(0,S.useState)(!1),[P,F]=(0,S.useState)(!1),[I,L]=(0,S.useState)(!1),[R,z]=(0,S.useState)(()=>{let e=localStorage.getItem(`cmdigital_custom_complaint_url`);if(e)return e;let t=typeof window<`u`?window.location.origin:``,n=typeof window<`u`?window.location.pathname:``;return t.includes(`localhost`)||t.includes(`127.0.0.1`)||t.includes(`::1`)||t.startsWith(`file:`)?`https://rihard-cyber.github.io/CMMDIGITALS/`:t+n});(0,S.useEffect)(()=>{if(A||M||P)return c(()=>P?(F(!1),!0):M?(N(!1),!0):A?(j(null),!0):!1)},[A,M,P]);let B=R+(R.includes(`?`)?`&`:`?`)+`complaint`,V=`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(B)}`,H=R.includes(`localhost`)||R.includes(`127.0.0.1`)||R.includes(`::1`),U=e=>({Baru:`#3b82f6`,Diterima:`#f59e0b`,Diproses:`#8b5cf6`,Selesai:`#10b981`})[e]||`#6b7280`,W=e.filter(e=>!(h!==`all`&&e.status!==h||O&&!e.ticketId.toLowerCase().includes(O.toLowerCase())&&!e.name.toLowerCase().includes(O.toLowerCase())&&!e.tenant.toLowerCase().includes(O.toLowerCase())&&!(e.location||``).toLowerCase().includes(O.toLowerCase())&&!(e.phone||``).toLowerCase().includes(O.toLowerCase()))).sort((e,t)=>new Date(t.createdAt)-new Date(e.createdAt)),G={all:e.length,Baru:e.filter(e=>e.status===`Baru`).length,Diproses:e.filter(e=>e.status===`Diproses`||e.status===`Diterima`).length,Selesai:e.filter(e=>e.status===`Selesai`).length},K=(t,n)=>{let r=e.find(e=>e.id===t);r&&l(t,{status:n,history:[...r.history||[],{status:n,timestamp:new Date().toISOString(),note:`Status diubah ke ${n}`}],updatedAt:new Date().toISOString()})},q=(t,n)=>{let r=e.find(e=>e.id===t);r&&l(t,{department:n,status:`Diproses`,history:[...r.history||[],{status:`Diproses`,timestamp:new Date().toISOString(),note:`Didisposisikan ke ${n}`}],waStatus:`Terkirim (${n})`,waSentAt:new Date().toLocaleTimeString(`id-ID`,{hour:`2-digit`,minute:`2-digit`})+` WIB`,updatedAt:new Date().toISOString()})};return(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`div`,{className:`complaint-stats-grid`,style:{display:`grid`,gridTemplateColumns:`repeat(4, 1fr)`,gap:`0.75rem`,marginBottom:`1.25rem`},children:[{label:`Total`,value:G.all,color:`#3b82f6`},{label:`Baru`,value:G.Baru,color:`#3b82f6`},{label:`Diproses`,value:G.Diproses,color:`#8b5cf6`},{label:`Selesai`,value:G.Selesai,color:`#10b981`}].map(e=>(0,C.jsxs)(`div`,{className:`glass-panel`,style:{padding:`0.75rem`,textAlign:`center`},children:[(0,C.jsx)(`p`,{style:{fontSize:`0.6rem`,color:`var(--text-secondary)`,fontWeight:600,marginBottom:`0.15rem`},children:e.label}),(0,C.jsx)(`p`,{style:{fontSize:`1.4rem`,fontWeight:800,color:e.color},children:e.value})]},e.label))}),(0,C.jsxs)(`div`,{style:{marginBottom:`1rem`,display:`flex`,gap:`0.5rem`,flexWrap:`wrap`},children:[(0,C.jsxs)(`button`,{onClick:()=>N(!M),className:`btn-secondary`,style:{padding:`0.45rem 0.75rem`,fontSize:`0.75rem`,display:`flex`,alignItems:`center`,gap:`0.35rem`},children:[(0,C.jsx)(i,{size:14}),` `,M?`Tutup Master QR`:`QR Code Form Komplain`]}),(0,C.jsxs)(`button`,{onClick:()=>F(!0),className:`btn-primary`,style:{padding:`0.45rem 0.85rem`,fontSize:`0.75rem`,display:`flex`,alignItems:`center`,gap:`0.4rem`,fontWeight:700},children:[(0,C.jsx)(f,{size:14}),` Desain Poster / Standee Akrilik`]})]}),(0,C.jsx)(`div`,{children:M&&(0,C.jsxs)(`div`,{className:`glass-panel`,style:{marginBottom:`1rem`,padding:`1.25rem`,textAlign:`center`},children:[H&&(0,C.jsxs)(`div`,{style:{background:`rgba(239, 68, 68, 0.1)`,border:`1px dashed rgba(239, 68, 68, 0.4)`,color:`#ef4444`,padding:`0.6rem 0.8rem`,borderRadius:`8px`,fontSize:`0.72rem`,marginBottom:`0.85rem`,textAlign:`left`,lineHeight:`1.4`},children:[(0,C.jsx)(`strong`,{children:`⚠️ Peringatan Host Localhost:`}),` URL komplain saat ini mengarah ke `,(0,C.jsx)(`code`,{children:`localhost`}),` (kemungkinan karena dijalankan di Android/Simulator). Jika dicetak/discan oleh tenant menggunakan handphone mereka, halaman tidak akan bisa dibuka. Silakan sesuaikan `,(0,C.jsx)(`strong`,{children:`URL Base Website Publik`}),` di bawah agar mengarah ke domain hosting online Anda (seperti Github Pages atau Vercel).`]}),(0,C.jsx)(`p`,{style:{fontSize:`0.72rem`,color:`var(--text-secondary)`,marginBottom:`0.75rem`,fontWeight:600},children:`SCAN QR CODE UNTUK MEMBUKA FORM KOMPLAIN`}),(0,C.jsx)(`img`,{src:V,alt:`QR Code Komplain`,style:{width:180,height:180,borderRadius:`8px`,border:`1px solid var(--border-glass)`,marginBottom:`0.75rem`}}),(0,C.jsx)(`div`,{style:{fontSize:`0.7rem`,color:`var(--text-muted)`,wordBreak:`break-all`,marginBottom:`0.5rem`},children:(0,C.jsx)(`code`,{children:B})}),(0,C.jsxs)(`div`,{style:{display:`flex`,gap:`0.5rem`,justifyContent:`center`,marginBottom:`1rem`},children:[(0,C.jsxs)(`button`,{onClick:()=>{navigator.clipboard?.writeText(B),L(!0),setTimeout(()=>L(!1),2e3)},className:`btn-secondary`,style:{padding:`0.35rem 0.65rem`,fontSize:`0.7rem`,display:`flex`,alignItems:`center`,gap:`0.25rem`},children:[(0,C.jsx)(x,{size:12}),` `,I?`Tersalin!`:`Salin Link`]}),(0,C.jsxs)(`a`,{href:V,download:`cmdigital-complaint-qr.png`,className:`btn-secondary`,style:{padding:`0.35rem 0.65rem`,fontSize:`0.7rem`,display:`inline-flex`,alignItems:`center`,gap:`0.25rem`,textDecoration:`none`},children:[(0,C.jsx)(t,{size:12}),` Download QR`]})]}),(0,C.jsxs)(`div`,{style:{padding:`0.75rem`,border:`1px solid var(--border-glass)`,borderRadius:`8px`,background:`rgba(255,255,255,0.02)`,textAlign:`left`},children:[(0,C.jsx)(`label`,{style:{fontSize:`0.68rem`,color:`var(--text-secondary)`,fontWeight:700,display:`block`,marginBottom:`0.35rem`},children:`URL BASE WEBSITE PUBLIK (Untuk QR Code)`}),(0,C.jsxs)(`div`,{style:{display:`flex`,gap:`0.5rem`},children:[(0,C.jsx)(`input`,{type:`text`,value:R,onChange:e=>{let t=e.target.value;z(t),localStorage.setItem(`cmdigital_custom_complaint_url`,t)},placeholder:`https://rihard-cyber.github.io/CMMDIGITALS/`,className:`modern-input`,style:{flex:1,fontSize:`0.75rem`,padding:`0.35rem 0.5rem`}}),(0,C.jsx)(`button`,{type:`button`,onClick:()=>{let e=`https://rihard-cyber.github.io/CMMDIGITALS/`;z(e),localStorage.setItem(`cmdigital_custom_complaint_url`,e)},className:`btn-secondary`,style:{padding:`0.35rem 0.65rem`,fontSize:`0.7rem`,whiteSpace:`nowrap`},children:`Reset Default`})]}),(0,C.jsxs)(`p`,{style:{fontSize:`0.62rem`,color:`var(--text-muted)`,marginTop:`0.35rem`},children:[`* Tautan komplain di atas akan otomatis disesuaikan dan diakhiri dengan `,(0,C.jsx)(`code`,{children:`?complaint`})]})]})]})}),(0,C.jsxs)(`div`,{className:`android-toolbar`,children:[(0,C.jsxs)(`div`,{className:`android-search`,children:[(0,C.jsx)(a,{size:14,style:{position:`absolute`,left:10,top:`50%`,transform:`translateY(-50%)`,color:`var(--text-muted)`}}),(0,C.jsx)(`input`,{type:`text`,value:O,onChange:e=>k(e.target.value),placeholder:`Cari tiket/nama/tenant...`,className:`modern-input`,style:{paddingLeft:`2rem`,fontSize:`0.78rem`}})]}),(0,C.jsx)(`div`,{className:`segmented-filter`,role:`group`,"aria-label":`Filter status komplain`,children:[`all`,`Baru`,`Diterima`,`Diproses`,`Selesai`].map(e=>(0,C.jsxs)(`button`,{type:`button`,onClick:()=>_(e),className:h===e?`active`:``,"aria-pressed":h===e,children:[(0,C.jsx)(`span`,{className:`filter-label-full`,children:e===`all`?`Semua`:e}),(0,C.jsx)(`span`,{className:`filter-label-short`,children:D[e]||e})]},e))}),(0,C.jsx)(`div`,{className:`android-actions`,children:(0,C.jsxs)(`button`,{onClick:()=>{g({title:`Tiketing Komplain / Pengaduan Tenant, Pengunjung`,fileName:`tiket-komplain-cmdigital-${m()}`,meta:[{label:`Filter Status`,value:h===`all`?`Semua`:h},{label:`Pencarian`,value:O||`-`},{label:`Total Data`,value:W.length},{label:`Sumber`,value:`Komplain Tenant`}],columns:[{header:`NO`,width:`4%`},{header:`JAM/TGGL KOMPLEN`,width:`11%`},{header:`NAMA LENGKAP`,width:`9%`},{header:`NO TELEPON`,width:`9%`},{header:`NAMA TENANT/SORUM/PENGUNJUNG`,width:`13%`},{header:`LOKASI`,width:`8%`},{header:`KATEGORI KOMPLAIN`,width:`10%`},{header:`DESKRIPSI KOMPLAIN`,width:`15%`},{header:`FOTO`,width:`9%`},{header:`STATUS (OPOSISI)`,width:`8%`},{header:`KETERANGAN`,width:`8%`}],rows:W.map((e,t)=>[t+1,u(e.createdAt||e.tanggal||new Date),e.name||`-`,e.phone||`-`,e.tenant||`-`,e.location||e.floor||`-`,e.category||`-`,{text:e.description||`-`,className:`text-left`},{image:s(e.photos),text:e.photos?.length?`${e.photos.length} foto`:`-`},e.status===`Selesai`?`SELESAI (${e.department?String(e.department).toUpperCase():`MANAGEMENT`})`:e.status===`Diproses`||e.status===`Diterima`?`DIPROSES (${e.department?String(e.department).toUpperCase():`MANAGEMENT`})`:`DITERIMA (${e.department?String(e.department).toUpperCase():`MANAGEMENT`})`,e.remarks||(e.status===`Selesai`?`DONE`:e.waStatus||`-`)])})||alert(`Popup export PDF diblokir browser. Izinkan popup untuk aplikasi ini.`)},className:`btn-primary`,type:`button`,children:[(0,C.jsx)(f,{size:12}),` Export PDF`]})})]}),W.length===0?(0,C.jsxs)(`div`,{className:`empty-state`,style:{padding:`3rem 1rem`,textAlign:`center`},children:[(0,C.jsx)(b,{size:40,style:{opacity:.2,marginBottom:`0.75rem`,color:`var(--text-muted)`}}),(0,C.jsx)(`p`,{style:{fontSize:`0.85rem`,color:`var(--text-muted)`},children:`Belum ada komplain masuk.`})]}):(0,C.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`0.5rem`},children:W.map(e=>(0,C.jsxs)(`div`,{className:`glass-panel`,style:{padding:`0.75rem`,transition:`var(--transition-smooth)`,borderLeft:`3px solid ${U(e.status)}`,background:A?.id===e.id?`rgba(59,130,246,0.05)`:void 0},children:[(0,C.jsxs)(`div`,{onClick:()=>j(A?.id===e.id?null:e),style:{cursor:`pointer`,display:`flex`,flexDirection:`column`,gap:`0.25rem`},children:[(0,C.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-start`,marginBottom:`0.25rem`},children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{style:{fontSize:`0.8rem`,fontWeight:800,letterSpacing:`0.02em`,color:`var(--color-primary)`},children:e.ticketId}),(0,C.jsx)(`span`,{style:{marginLeft:`0.5rem`,fontSize:`0.7rem`,fontWeight:700},children:e.name})]}),(0,C.jsx)(`span`,{style:{fontSize:`0.6rem`,padding:`0.12rem 0.5rem`,borderRadius:`20px`,fontWeight:700,whiteSpace:`nowrap`,background:`${U(e.status)}20`,color:U(e.status)},children:e.status})]}),(0,C.jsxs)(`div`,{style:{display:`flex`,gap:`0.75rem`,fontSize:`0.68rem`,color:`var(--text-secondary)`,flexWrap:`wrap`},children:[(0,C.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:`0.2rem`},children:[(0,C.jsx)(o,{size:10}),` `,e.tenant]}),(0,C.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:`0.2rem`},children:[(0,C.jsx)(n,{size:10}),` `,e.location||e.floor]}),(0,C.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:`0.2rem`},children:[(0,C.jsx)(y,{size:10}),` `,e.category]}),(0,C.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:`0.2rem`},children:[(0,C.jsx)(r,{size:10}),` `,new Date(e.createdAt).toLocaleDateString(`id-ID`,{dateStyle:`short`})]})]}),(0,C.jsx)(`p`,{style:{fontSize:`0.75rem`,color:`var(--text-primary)`,marginTop:`0.3rem`},children:e.description}),e.department&&(0,C.jsxs)(`div`,{style:{fontSize:`0.65rem`,color:`var(--color-primary)`,fontWeight:600,marginTop:`0.2rem`},children:[`Disposisi: `,e.department]})]}),A?.id===e.id&&(0,C.jsxs)(`div`,{onClick:e=>e.stopPropagation(),style:{marginTop:`0.75rem`,paddingTop:`0.75rem`,borderTop:`1px solid var(--border-glass)`},children:[e.photos?.length>0&&(0,C.jsxs)(`div`,{style:{marginBottom:`0.75rem`},children:[(0,C.jsx)(`p`,{style:{fontSize:`0.65rem`,color:`var(--text-secondary)`,fontWeight:600,marginBottom:`0.3rem`},children:`FOTO BUKTI`}),(0,C.jsx)(`div`,{style:{display:`flex`,gap:`0.4rem`,flexWrap:`wrap`},children:e.photos.map((e,t)=>(0,C.jsx)(`a`,{href:e,target:`_blank`,rel:`noreferrer`,children:(0,C.jsx)(`img`,{src:e,alt:``,style:{width:70,height:70,objectFit:`cover`,borderRadius:`6px`,border:`1px solid var(--border-glass)`}})},t))})]}),e.phone&&(0,C.jsxs)(`div`,{style:{marginBottom:`0.75rem`,display:`flex`,alignItems:`center`,gap:`0.4rem`,fontSize:`0.72rem`},children:[(0,C.jsx)(d,{size:12,style:{color:`var(--color-success)`}}),(0,C.jsx)(`a`,{href:`https://wa.me/${e.phone.replace(/[^0-9]/g,``)}`,target:`_blank`,rel:`noreferrer`,style:{color:`var(--color-success)`,fontWeight:600},children:e.phone})]}),(0,C.jsxs)(`div`,{style:{marginBottom:`0.75rem`},children:[(0,C.jsx)(`p`,{style:{fontSize:`0.65rem`,color:`var(--text-secondary)`,fontWeight:600,marginBottom:`0.3rem`},children:`KETERANGAN ADMIN / HASIL AKHIR`}),(0,C.jsx)(`textarea`,{defaultValue:e.remarks||``,onBlur:t=>{let n=t.target.value.trim();n!==(e.remarks||``)&&l(e.id,{remarks:n,updatedAt:new Date().toISOString()})},placeholder:`Contoh: DONE / Sudah ditindaklanjuti / Menunggu konfirmasi`,className:`modern-input`,style:{minHeight:`58px`,height:`58px`,resize:`vertical`,fontSize:`0.75rem`,padding:`0.5rem`}})]}),e.history?.length>0&&(0,C.jsxs)(`div`,{style:{marginBottom:`0.75rem`},children:[(0,C.jsx)(`p`,{style:{fontSize:`0.65rem`,color:`var(--text-secondary)`,fontWeight:600,marginBottom:`0.3rem`},children:`RIWAYAT STATUS`}),(0,C.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`0.3rem`},children:e.history.map((e,t)=>(0,C.jsxs)(`div`,{style:{display:`flex`,gap:`0.5rem`,alignItems:`flex-start`},children:[(0,C.jsx)(`div`,{style:{width:8,height:8,borderRadius:`50%`,background:U(e.status),marginTop:3,flexShrink:0}}),(0,C.jsxs)(`div`,{style:{fontSize:`0.68rem`},children:[(0,C.jsx)(`span`,{style:{fontWeight:700,color:U(e.status)},children:e.status}),(0,C.jsx)(`span`,{style:{color:`var(--text-muted)`,marginLeft:`0.4rem`},children:new Date(e.timestamp).toLocaleString(`id-ID`,{dateStyle:`short`,timeStyle:`short`})}),e.note&&(0,C.jsx)(`p`,{style:{color:`var(--text-secondary)`,fontSize:`0.65rem`},children:e.note})]})]},t))})]}),(0,C.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`0.5rem`},children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`p`,{style:{fontSize:`0.65rem`,color:`var(--text-secondary)`,fontWeight:600,marginBottom:`0.3rem`},children:`UBAH STATUS`}),(0,C.jsx)(`div`,{style:{display:`flex`,gap:`0.3rem`,flexWrap:`wrap`},children:E.filter(t=>t!==e.status).map(t=>(0,C.jsx)(`button`,{onClick:n=>{n.stopPropagation(),K(e.id,t)},style:{padding:`0.35rem 0.6rem`,borderRadius:`6px`,fontSize:`0.65rem`,fontWeight:700,minHeight:`40px`,border:`1.5px solid ${U(t)}`,background:`${U(t)}15`,color:U(t),cursor:`pointer`,fontFamily:`var(--font-sans)`,touchAction:`manipulation`},children:t},t))})]}),e.status!==`Selesai`&&(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`p`,{style:{fontSize:`0.65rem`,color:`var(--text-secondary)`,fontWeight:600,marginBottom:`0.3rem`},children:`DISPOSISI KE`}),(0,C.jsx)(`div`,{style:{display:`flex`,gap:`0.3rem`,flexWrap:`wrap`},children:T.map(t=>(0,C.jsxs)(`button`,{onClick:n=>{n.stopPropagation(),q(e.id,t)},style:{padding:`0.4rem 0.7rem`,borderRadius:`8px`,fontSize:`0.7rem`,fontWeight:700,minHeight:`44px`,border:`1.5px solid ${e.department===t?`var(--color-success)`:`var(--border-glass)`}`,background:e.department===t?`rgba(16,185,129,0.1)`:`transparent`,color:e.department===t?`var(--color-success)`:`var(--text-secondary)`,cursor:`pointer`,fontFamily:`var(--font-sans)`,display:`flex`,alignItems:`center`,gap:`0.2rem`,touchAction:`manipulation`},children:[(0,C.jsx)(v,{size:12}),` `,t]},t))})]}),p&&(0,C.jsx)(`div`,{style:{marginTop:`0.5rem`,borderTop:`1px solid var(--border-glass)`,paddingTop:`0.5rem`},children:(0,C.jsx)(`button`,{onClick:t=>{t.stopPropagation(),p(e.id)},style:{padding:`0.35rem 0.65rem`,borderRadius:`6px`,fontSize:`0.7rem`,fontWeight:700,border:`1.5px solid rgba(239,68,68,0.3)`,background:`rgba(239,68,68,0.08)`,color:`#ef4444`,cursor:`pointer`,fontFamily:`var(--font-sans)`,display:`flex`,alignItems:`center`,gap:`0.25rem`},children:`Hapus Tiket Komplain`})})]})]})]},e.id))}),(0,C.jsx)(w,{isOpen:P,onClose:()=>F(!1),complaintUrl:B,qrApiUrl:V})]})}export{O as default};