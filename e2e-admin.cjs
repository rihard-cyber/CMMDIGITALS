const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const OUT = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\e2e-shots';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,1000']
  });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
  };

  try {
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });

    // Tunggu form login (sinkronisasi user cloud bisa beberapa detik)
    await page.waitForSelector('input[placeholder="Masukkan NRP"]', { timeout: 30000 });
    check('Login form tampil', true);

    await page.type('input[placeholder="Masukkan NRP"]', '10001');
    await page.type('input[placeholder="Masukkan PIN"]', '10001');
    await page.click('button.login-btn');
    await page.waitForSelector('select.tenant-select', { timeout: 30000 });
    await page.waitForFunction(() =>
      document.querySelectorAll('select.tenant-select option').length > 1,
      { timeout: 30000 });
    await sleep(500);

    const options = await page.$$eval('select.tenant-select option', els =>
      els.map(e => ({ value: e.value, text: e.textContent.trim() })));
    console.log('Tenant options:', JSON.stringify(options));
    check('Admin melihat semua tenant (6 opsi termasuk placeholder)', options.length === 6, `count=${options.length}`);

    // Pilih Astra untuk menguji data tenant terisolasi
    await page.select('select.tenant-select', 'tnt_astra');
    await page.waitForFunction(() => {
      const b = document.querySelector('button.login-btn');
      return b && !b.disabled && /Masuk ke Lokasi/.test(b.textContent);
    }, { timeout: 10000 });
    await page.click('button.login-btn');
    await page.waitForSelector('.sidebar-nav', { timeout: 30000 });
    await sleep(2000);
    check('Masuk dashboard tenant Astra', true);
    await page.screenshot({ path: `${OUT}\\01-dashboard-astra.png` });

    const bodyText = await page.evaluate(() => document.body.innerText);
    check('Dashboard menampilkan Gedung Astra', /Astra/i.test(bodyText), bodyText.slice(0, 120).replace(/\n/g, ' '));

    const menus = [
      'Dashboard Utama',
      'Absensi & Plotting',
      'Dashboard Target',
      'Master & Barcode QR',
      'Mutasi Penjagaan',
      'Laporan & Export',
      'Management User',
      'Roster Jadwal Bulanan',
      'Backup & Restore',
      'Manajemen Tenant',
      'Komplain Masuk',
      'Penemuan Barang',
      'Simulasi HP Petugas'
    ];

    for (let i = 0; i < menus.length; i++) {
      const label = menus[i];
      const clicked = await page.evaluate((text) => {
        const buttons = [...document.querySelectorAll('.nav-tab-btn')];
        const btn = buttons.find(b => b.innerText.trim().includes(text));
        if (!btn) return false;
        btn.click();
        return true;
      }, label);
      if (!clicked) {
        check(`Menu ${label}`, false, 'tombol tidak ditemukan');
        continue;
      }
      await sleep(1000);
      const info = await page.evaluate(() => {
        const heading = document.querySelector('h1, h2, .page-title, .section-title');
        return {
          heading: heading ? heading.innerText.trim().slice(0, 80) : '',
          screenshotText: document.body.innerText.slice(0, 160).replace(/\n+/g, ' | ')
        };
      });
      check(`Menu ${label}`, true, info.heading || info.screenshotText);
      await page.screenshot({ path: `${OUT}\\menu-${String(i + 2).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`, fullPage: false });
    }

    // Kembali ke dashboard
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.nav-tab-btn')].find(b => b.innerText.includes('Dashboard Utama'));
      if (btn) btn.click();
    });
    await sleep(1000);

    check('Tidak ada page error', pageErrors.length === 0, pageErrors.slice(0, 5).join(' || '));
    const severeConsole = consoleErrors.filter(t =>
      !/favicon|manifest|Download the React DevTools|service worker|Failed to fetch|net::ERR|401|403|404/i.test(t));
    check('Tidak ada console error kritis', severeConsole.length === 0, severeConsole.slice(0, 5).join(' || '));

    fs.writeFileSync(`${OUT}\\admin-results.json`, JSON.stringify({ results, pageErrors, consoleErrors, options }, null, 2));
  } catch (e) {
    console.error('E2E FATAL:', e);
    try { await page.screenshot({ path: `${OUT}\\fatal.png` }); } catch (_) {}
    console.error('Page errors:', pageErrors);
    console.error('Console errors:', consoleErrors);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
