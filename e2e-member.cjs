const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const OUT = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\e2e-shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

  try {
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('input[placeholder="Masukkan NRP"]', { timeout: 30000 });
    await page.type('input[placeholder="Masukkan NRP"]', 'TST999');
    await page.type('input[placeholder="Masukkan PIN"]', 'TST999');
    await page.click('button.login-btn');
    await page.waitForSelector('select.tenant-select', { timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('select.tenant-select option').length >= 2, { timeout: 30000 });
    await sleep(400);

    const options = await page.$$eval('select.tenant-select option', els => els.map(e => ({ value: e.value, text: e.textContent.trim() })));
    console.log('Tenant options (restricted user):', JSON.stringify(options));
    check('User Astra hanya melihat 1 lokasi', options.length === 2 && options[1].value === 'tnt_astra', JSON.stringify(options));

    const autoSelected = await page.$eval('select.tenant-select', el => el.value);
    check('Lokasi Astra otomatis terpilih', autoSelected === 'tnt_astra', autoSelected);

    await page.click('button.login-btn');
    await page.waitForSelector('.sidebar-nav', { timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: `${OUT}\\02-member-astra.png` });

    const navLabels = await page.$$eval('.sidebar-nav .nav-tab-btn', els => els.map(e => e.innerText.trim()));
    console.log('Menu user Astra:', JSON.stringify(navLabels));
    check('Menu Manajemen Tenant disembunyikan', !navLabels.some(t => /Manajemen Tenant/i.test(t)));
    check('Menu Management User disembunyikan', !navLabels.some(t => /Management User/i.test(t)));
    check('Menu Komplain Masuk disembunyikan', !navLabels.some(t => /Komplain Masuk/i.test(t)));
    check('User mendapat menu operasional', navLabels.some(t => /Patroli|Absensi|Dashboard/i.test(t)), navLabels.join(', '));

    const footer = await page.$eval('.sidebar-footer-info', el => el.innerText.trim());
    check('Footer menampilkan Gedung Astra', /Astra/i.test(footer), footer);

    const activeTenant = await page.evaluate(() => localStorage.getItem('cmdigital_active_tenant'));
    check('Tenant aktif = tnt_astra', activeTenant === 'tnt_astra', activeTenant);

    const visibleData = await page.evaluate(() => ({
      areas: JSON.parse(localStorage.getItem('sapujagat_areas') || '[]').map(a => ({ gedung: a.gedung, tenant: a.tenant_id || a.tenantId })),
      users: JSON.parse(localStorage.getItem('sapujagat_users') || '[]').map(u => ({ nrp: u.nrp, tenant: u.tenant_id || u.tenantId })),
      reports: JSON.parse(localStorage.getItem('sapujagat_reports') || '[]').length,
      complaints: JSON.parse(localStorage.getItem('cmdigital_complaints') || '[]').map(c => c.tenant_id)
    }));
    console.log('Visible data snapshot:', JSON.stringify(visibleData));
    check('Tidak ada area PT CMM terlihat di Astra', visibleData.areas.every(a => !/Gedung Pusat|CMMDIGITAL - Gedung/i.test(a.gedung || '')), `areas=${visibleData.areas.length}`);
    check('Tidak ada user PT CMM (10001) di daftar lokal Astra', visibleData.users.every(u => u.nrp !== '10001'), `users=${visibleData.users.length}`);

    const bodyText = await page.evaluate(() => document.body.innerText);
    check('Tidak ada teks Manajemen Tenant di halaman', !/Manajemen Tenant/i.test(bodyText));

    check('Tidak ada page error', pageErrors.length === 0, pageErrors.slice(0, 5).join(' || '));
    const severe = consoleErrors.filter(t => !/favicon|manifest|DevTools|service worker|Failed to fetch|net::ERR|401|403|404/i.test(t));
    check('Tidak ada console error kritis', severe.length === 0, severe.slice(0, 5).join(' || '));

    fs.writeFileSync(`${OUT}\\member-results.json`, JSON.stringify({ results, pageErrors, consoleErrors, navLabels, visibleData }, null, 2));
  } catch (e) {
    console.error('E2E FATAL:', e);
    try { await page.screenshot({ path: `${OUT}\\member-fatal.png` }); } catch (_) {}
    console.error('Page errors:', pageErrors);
    console.error('Console errors:', consoleErrors);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
