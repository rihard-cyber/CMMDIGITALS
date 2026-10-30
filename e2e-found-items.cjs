const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const SUPABASE = 'https://kjfpgtrhspvozikzttbe.supabase.co';
const KEY = 'sb_publishable_ijLoQjmjFNU6yC93yj5M8A_x_sFIhG8';
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const OUT = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\e2e-shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function dbFoundItemsByTenant(tenantId) {
  const res = await fetch(`${SUPABASE}/rest/v1/found_items?tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=created_at.desc`, { headers: HEADERS });
  if (!res.ok) throw new Error(`REST ${res.status}: ${await res.text()}`);
  return res.json();
}

async function deleteFoundItemByCode(code) {
  const res = await fetch(`${SUPABASE}/rest/v1/found_items?item_code=eq.${encodeURIComponent(code)}`, { method: 'DELETE', headers: HEADERS });
  return res.status;
}

async function loginAndPick(page, nrp, pin, tenantId) {
  await page.waitForSelector('input[placeholder="Masukkan NRP"]', { timeout: 30000 });
  await page.type('input[placeholder="Masukkan NRP"]', nrp);
  await page.type('input[placeholder="Masukkan PIN"]', pin);
  await page.click('button.login-btn');
  await page.waitForSelector('select.tenant-select', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('select.tenant-select option').length > 1, { timeout: 30000 });
  await page.select('select.tenant-select', tenantId);
  await page.waitForFunction(() => {
    const b = document.querySelector('button.login-btn');
    return b && !b.disabled && /Masuk ke Lokasi/.test(b.textContent);
  }, { timeout: 10000 });
  await page.click('button.login-btn');
  await page.waitForSelector('.sidebar-nav', { timeout: 30000 });
  await sleep(2500);
}

async function openFoundItems(page) {
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.nav-tab-btn')].find(b => /Penemuan Barang/i.test(b.innerText));
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!clicked) throw new Error('Menu Penemuan Barang tidak ditemukan');
  await page.waitForFunction(() => /Catat Barang/.test(document.body.innerText), { timeout: 20000 });
  await sleep(800);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,1000']
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
  };

  let createdCode = null;
  try {
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });

    await loginAndPick(page, '10001', '10001', 'tnt_astra');
    const footer = await page.$eval('.sidebar-footer-info', el => el.innerText.trim());
    check('Admin aktif di tenant Astra', /Astra/i.test(footer), footer);

    await openFoundItems(page);
    const emptyBefore = await page.evaluate(() => /Belum ada barang temuan/.test(document.body.innerText));
    check('Tenant Astra mulai tanpa barang temuan (tidak ada seeding)', emptyBefore);

    // Buka form
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /Catat Barang/.test(b.innerText));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => /Catat Barang Temuan/.test(document.body.innerText), { timeout: 15000 });
    await sleep(400);

    await page.type('input[placeholder="Contoh: iPhone 13, Tas Hitam, Kunci Motor"]', 'E2E Laptop Uji Tenant');
    // Pilih jenis barang
    await page.evaluate(() => {
      const sel = [...document.querySelectorAll('.modal-panel select.modern-select')][0];
      if (sel) {
        sel.value = 'Elektronik';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.type('input[placeholder="Contoh: Lantai 1 dekat tangga darurat B"]', 'Lobby Astra Lt. 1');
    await page.type('input[placeholder="Nama yang menemukan"]', 'Petugas E2E');
    await page.type('input[placeholder="08xxxxxxxxxx"]', '081200000001');
    await page.type('input[placeholder="Kondisi barang saat ditemukan"]', 'Unit uji isolasi tenant');

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button[type="submit"]')].find(b => /Simpan Barang Temuan/.test(b.innerText));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => !/Catat Barang Temuan/.test(document.body.innerText), { timeout: 20000 });
    await sleep(2500);

    const listText = await page.evaluate(() => document.body.innerText);
    const m = listText.match(/FND-\d{8}-\d{3}/);
    createdCode = m ? m[0] : null;
    check('Barang temuan tampil di daftar Astra', /E2E Laptop Uji Tenant/.test(listText) && !!createdCode, createdCode || 'kode tidak ditemukan');
    await page.screenshot({ path: `${OUT}\\06-found-item-astra.png` });

    if (createdCode) {
      const rows = await dbFoundItemsByTenant('tnt_astra');
      const row = rows.find(r => r.item_code === createdCode);
      check('Baris found_items tersimpan di database', !!row, createdCode);
      if (row) {
        check('Database tenant_id = tnt_astra', row.tenant_id === 'tnt_astra', String(row.tenant_id));
        check('Database nama barang sesuai', row.nama_barang === 'E2E Laptop Uji Tenant', String(row.nama_barang));
        check('Database jenis barang = Elektronik', row.jenis_barang === 'Elektronik', String(row.jenis_barang));
        check('Database lokasi = Lobby Astra Lt. 1', row.lokasi_penemuan === 'Lobby Astra Lt. 1', String(row.lokasi_penemuan));
        check('Status awal = Ditemukan', row.status === 'Ditemukan', String(row.status));
      }
      const astraRowsForCode = (await dbFoundItemsByTenant('tnt_astra')).filter(r => r.item_code === createdCode);
      check('Query tenant Astra menemukan barang', astraRowsForCode.length === 1, `count=${astraRowsForCode.length}`);
    }

    // Logout lalu masuk sebagai PT CMM
    await page.evaluate(() => {
      const btn = document.querySelector('.sidebar-logout-btn');
      if (btn) btn.click();
    });
    await sleep(3000);
    await page.waitForSelector('input[placeholder="Masukkan NRP"]', { timeout: 30000 });
    await loginAndPick(page, '10001', '10001', 'tnt_pt_cmm');
    const footer2 = await page.$eval('.sidebar-footer-info', el => el.innerText.trim());
    check('Admin aktif di tenant PT. CMM', /CMM/i.test(footer2), footer2);

    await openFoundItems(page);
    const ptcmmText = await page.evaluate(() => document.body.innerText);
    check('Barang Astra TIDAK terlihat di tenant PT. CMM', !/E2E Laptop Uji Tenant/.test(ptcmmText));
    if (createdCode) {
      check('Kode barang Astra TIDAK terlihat di PT. CMM', !ptcmmText.includes(createdCode), createdCode);
    }
    await page.screenshot({ path: `${OUT}\\07-found-item-pt-cmm.png` });

    check('Tidak ada page error', pageErrors.length === 0, pageErrors.slice(0, 5).join(' || '));
    const severe = consoleErrors.filter(t => !/favicon|manifest|DevTools|service worker|Failed to fetch|net::ERR|401|403|404/i.test(t));
    check('Tidak ada console error kritis', severe.length === 0, severe.slice(0, 5).join(' || '));

    fs.writeFileSync(`${OUT}\\found-items-results.json`, JSON.stringify({ results, pageErrors, consoleErrors, createdCode }, null, 2));
  } catch (e) {
    console.error('E2E FATAL:', e);
    try { await page.screenshot({ path: `${OUT}\\found-items-fatal.png` }); } catch (_) {}
    console.error('Page errors:', pageErrors);
    console.error('Console errors:', consoleErrors);
    process.exitCode = 1;
  } finally {
    if (createdCode) {
      try {
        const status = await deleteFoundItemByCode(createdCode);
        console.log(`Cleanup found_items ${createdCode}: ${status}`);
        const remaining = await dbFoundItemsByTenant('tnt_astra');
        console.log(`Astra found_items remaining: ${remaining.length}`);
      } catch (e) { console.warn('Cleanup failed:', e.message); }
    }
    await browser.close();
  }
})();
