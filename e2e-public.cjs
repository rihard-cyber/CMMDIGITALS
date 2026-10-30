const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const SUPABASE = 'https://kjfpgtrhspvozikzttbe.supabase.co';
const KEY = 'sb_publishable_ijLoQjmjFNU6yC93yj5M8A_x_sFIhG8';
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const OUT = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\e2e-shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function dbGetByTicket(ticket) {
  const res = await fetch(`${SUPABASE}/rest/v1/complaints?ticket_id=eq.${encodeURIComponent(ticket)}&select=*`, { headers: HEADERS });
  if (!res.ok) throw new Error(`REST ${res.status}: ${await res.text()}`);
  return (await res.json())[0] || null;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,1200']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1200 });
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
  };

  let ticket = null;
  try {
    await page.goto(`${BASE}/?complaint&tenant=tnt_astra`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('select.modern-select', { timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('select.modern-select option').length > 1, { timeout: 30000 });
    await sleep(500);

    const tenantSelect = await page.$('select.modern-select');
    const tenantValue = await tenantSelect.evaluate(el => el.value);
    const tenantOptions = await page.$$eval('select.modern-select option', els => els.map(e => ({ value: e.value, text: e.textContent.trim() })));
    console.log('Public tenant options:', JSON.stringify(tenantOptions));
    check('Form publik memuat semua lokasi', tenantOptions.length >= 6, `count=${tenantOptions.length}`);
    check('?tenant=tnt_astra otomatis memilih Gedung Astra', tenantValue === 'tnt_astra', tenantValue);

    const activeBefore = await page.evaluate(() => localStorage.getItem('cmdigital_active_tenant'));
    check('Perangkat publik tidak diberi tenant aktif global', !activeBefore, String(activeBefore));

    await page.screenshot({ path: `${OUT}\\03-public-form.png` });

    await page.type('input[placeholder="Masukkan nama Anda"]', 'E2E Public Tester');
    await page.type('input[placeholder="Cth: 08123456789"]', '081298765432');
    const selects = await page.$$('select.modern-select');
    // index 0 = tenant, index 1 = lantai
    await selects[1].select('Lt.1');
    await page.type('input[placeholder="Cth: Depan Lobby / Koridor Lt. 2"]', 'Lobby Utama Lt. 1');
    await page.type('input[placeholder="Cth: PT Maju Jaya / Ana Sorum Lt. 3"]', 'PT E2E Testing');

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Fasilitas');
      if (btn) btn.click();
    });
    await page.type('textarea', 'AC di lobby tidak dingin dan mengeluarkan suara bising. Mohon segera dicek.');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => /Komplain Terkirim!/.test(document.body.innerText), { timeout: 30000 });
    await sleep(1000);

    const body = await page.evaluate(() => document.body.innerText);
    const m = body.match(/CMP-\d{8}-[A-Z0-9]{6}/);
    ticket = m ? m[0] : null;
    check('Komplain berhasil dikirim dan nomor tiket tampil', !!ticket, ticket || body.slice(0, 200));
    await page.screenshot({ path: `${OUT}\\04-public-success.png` });

    if (ticket) {
      let row = null;
      for (let i = 0; i < 10; i++) {
        row = await dbGetByTicket(ticket);
        if (row) break;
        await sleep(1000);
      }
      check('Baris komplain tersimpan di database', !!row, row ? row.ticket_id : 'tidak ditemukan');
      if (row) {
        check('Database tenant_id = tnt_astra', row.tenant_id === 'tnt_astra', String(row.tenant_id));
        check('Database menyimpan lokasi/gedung Astra', /Astra/i.test(row.tenant || ''), String(row.tenant));
        check('Database menyimpan kategori Fasilitas', row.category === 'Fasilitas', String(row.category));
        check('Database menyimpan deskripsi', /AC di lobby/i.test(row.description || ''), String(row.description).slice(0, 60));
        check('Status awal = Baru', row.status === 'Baru', String(row.status));
      }
    }

    // Fresh browser/device tracking
    const ctx2 = await browser.createBrowserContext();
    const page2 = await ctx2.newPage();
    await page2.goto(`${BASE}/?complaint&tenant=tnt_astra`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page2.waitForSelector('select.modern-select', { timeout: 30000 });
    await page2.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /Lacak Tiket Komplain/.test(b.innerText));
      if (btn) btn.click();
    });
    await page2.waitForSelector('input[placeholder="Cth: CMP-20260605-A1B2C3"]', { timeout: 15000 });
    await page2.type('input[placeholder="Cth: CMP-20260605-A1B2C3"]', ticket || 'CMP-INVALID');
    await page2.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Cari');
      if (btn) btn.click();
    });
    await page2.waitForFunction((t) => {
      const text = document.body.innerText;
      return text.includes(t) || /Tiket tidak ditemukan/.test(text);
    }, { timeout: 30000 }, ticket || 'CMP-INVALID');
    await sleep(500);
    const trackText = await page2.evaluate(() => document.body.innerText);
    check('Tiket dapat dilacak dari perangkat lain', !/Tiket tidak ditemukan/.test(trackText) && trackText.includes(ticket || 'CMP-INVALID'), trackText.slice(0, 160).replace(/\n+/g, ' | '));
    check('Tracking menampilkan status Baru', /Baru/.test(trackText));
    check('Tracking menampilkan deskripsi komplain', /AC di lobby/i.test(trackText));
    await page2.screenshot({ path: `${OUT}\\05-public-tracking.png` });

    check('Tidak ada page error', pageErrors.length === 0, pageErrors.slice(0, 5).join(' || '));
    const severe = consoleErrors.filter(t => !/favicon|manifest|DevTools|service worker|Failed to fetch|net::ERR|401|403|404/i.test(t));
    check('Tidak ada console error kritis', severe.length === 0, severe.slice(0, 5).join(' || '));

    fs.writeFileSync(`${OUT}\\public-results.json`, JSON.stringify({ results, pageErrors, consoleErrors, ticket }, null, 2));
  } catch (e) {
    console.error('E2E FATAL:', e);
    try { await page.screenshot({ path: `${OUT}\\public-fatal.png` }); } catch (_) {}
    console.error('Page errors:', pageErrors);
    console.error('Console errors:', consoleErrors);
    process.exitCode = 1;
  } finally {
    if (ticket) {
      try {
        const res = await fetch(`${SUPABASE}/rest/v1/complaints?ticket_id=eq.${encodeURIComponent(ticket)}`, { method: 'DELETE', headers: HEADERS });
        console.log('Cleanup complaint:', res.status);
      } catch (e) { console.warn('Cleanup failed:', e.message); }
    }
    await browser.close();
  }
})();
