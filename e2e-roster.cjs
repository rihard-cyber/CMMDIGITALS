const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const SUPABASE = 'https://kjfpgtrhspvozikzttbe.supabase.co';
const KEY = 'sb_publishable_ijLoQjmjFNU6yC93yj5M8A_x_sFIhG8';
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const OUT = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\e2e-shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getRosters(yearMonth) {
  const res = await fetch(`${SUPABASE}/rest/v1/rosters?year_month=eq.${encodeURIComponent(yearMonth)}&select=*`, { headers: HEADERS });
  if (!res.ok) throw new Error(`REST ${res.status}: ${await res.text()}`);
  return res.json();
}

async function deleteRosters(yearMonth) {
  const res = await fetch(`${SUPABASE}/rest/v1/rosters?year_month=eq.${encodeURIComponent(yearMonth)}`, { method: 'DELETE', headers: HEADERS });
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

async function openRoster(page) {
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.nav-tab-btn')].find(b => /Roster Jadwal Bulanan/i.test(b.innerText));
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!clicked) throw new Error('Menu Roster tidak ditemukan');
  await page.waitForFunction(() => /Simpan Roster/.test(document.body.innerText), { timeout: 20000 });
  await sleep(1200);
}

async function logout(page) {
  await page.evaluate(() => {
    const btn = document.querySelector('.sidebar-logout-btn');
    if (btn) btn.click();
  });
  await sleep(3000);
  await page.waitForSelector('input[placeholder="Masukkan NRP"]', { timeout: 30000 });
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

  let yearMonth = null;
  try {
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });

    await loginAndPick(page, '10001', '10001', 'tnt_astra');
    yearMonth = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    console.log('Year-month under test:', yearMonth);

    await openRoster(page);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Harian');
      if (btn) btn.click();
    });
    await sleep(800);

    const astraRosterText = await page.evaluate(() => document.body.innerText);
    check('Roster Astra menampilkan user TST999', /TST999|Test Tenant Astra/i.test(astraRosterText), astraRosterText.slice(0, 100).replace(/\n+/g, ' '));

    // Klik shift Pagi pada kartu personil pertama
    const clickedShift = await page.evaluate(() => {
      const card = document.querySelector('.android-member-card');
      if (!card) return false;
      const btn = [...card.querySelectorAll('button')].find(b => b.innerText.trim().startsWith('P'));
      if (!btn) return false;
      btn.click();
      return true;
    });
    check('Shift Pagi dipilih pada roster Astra', clickedShift);
    await sleep(500);

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /Simpan Roster/.test(b.innerText));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => /Roster berhasil disimpan/.test(document.body.innerText), { timeout: 20000 });
    await sleep(1500);
    await page.screenshot({ path: `${OUT}\\08-roster-astra.png` });

    const localAstra = await page.evaluate((ym) => {
      const key = `cmdigital_roster_tnt_astra_${ym}`;
      return { key, raw: localStorage.getItem(key) };
    }, yearMonth);
    const astraParsed = localAstra.raw ? JSON.parse(localAstra.raw) : null;
    const tstKey = astraParsed ? Object.keys(astraParsed).find(k => /99999/.test(k)) : null;
    check('localStorage roster Astra memakai key per tenant', !!localAstra.raw && localAstra.key.includes('tnt_astra'), localAstra.key);
    check('localStorage roster Astra menyimpan shift TST999', !!tstKey, tstKey || 'tidak ada');
    if (tstKey) {
      const shifts = astraParsed[tstKey];
      check('Ada minimal 1 shift tersimpan', Object.keys(shifts).length === 1 && Object.values(shifts)[0] === 'P', JSON.stringify(shifts));
    }

    let rows = [];
    for (let i = 0; i < 12; i++) {
      rows = await getRosters(yearMonth);
      if (rows.some(r => r.tenant_id === 'tnt_astra')) break;
      await sleep(1000);
    }
    const astraRow = rows.find(r => r.tenant_id === 'tnt_astra');
    check('Roster Astra tersimpan di database', !!astraRow, astraRow ? astraRow.year_month : 'tidak ditemukan');
    if (astraRow) {
      check('Roster DB Astra terikat tenant tnt_astra', astraRow.tenant_id === 'tnt_astra', astraRow.tenant_id);
      const rk = Object.keys(astraRow.roster_data || {}).find(k => /99999/.test(k));
      check('Roster DB Astra berisi shift TST999', !!rk, rk || JSON.stringify(astraRow.roster_data).slice(0, 80));
      if (rk) {
        check('Shift DB Astra = P', Object.values(astraRow.roster_data[rk])[0] === 'P', JSON.stringify(astraRow.roster_data[rk]));
      }
    }

    // Pindah ke PT. CMM
    await logout(page);
    await loginAndPick(page, '10001', '10001', 'tnt_pt_cmm');
    await openRoster(page);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Harian');
      if (btn) btn.click();
    });
    await sleep(800);

    const ptText = await page.evaluate(() => document.body.innerText);
    check('Roster PT. CMM TIDAK menampilkan user Astra', !/TST999|Test Tenant Astra/i.test(ptText));

    const localPtBefore = await page.evaluate((ym) => localStorage.getItem(`cmdigital_roster_tnt_pt_cmm_${ym}`), yearMonth);
    check('localStorage roster PT. CMM terpisah (kosong sebelum simpan)', !localPtBefore, String(localPtBefore));

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /Simpan Roster/.test(b.innerText));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => /Roster berhasil disimpan/.test(document.body.innerText), { timeout: 20000 });
    await sleep(1500);
    await page.screenshot({ path: `${OUT}\\09-roster-pt-cmm.png` });

    rows = await getRosters(yearMonth);
    const astraRow2 = rows.find(r => r.tenant_id === 'tnt_astra');
    const ptRow = rows.find(r => r.tenant_id === 'tnt_pt_cmm');
    check('DB memiliki roster Astra dan PT. CMM terpisah', !!astraRow2 && !!ptRow, `total=${rows.length}`);
    check('Roster Astra tidak tertimpa oleh PT. CMM', !!astraRow2 && Object.values(astraRow2.roster_data || {}).some(d => Object.values(d).includes('P')), JSON.stringify(astraRow2?.roster_data || {}).slice(0, 100));
    check('Roster PT. CMM tidak memuat data Astra', !!ptRow && !JSON.stringify(ptRow.roster_data).includes('99999'), JSON.stringify(ptRow?.roster_data || {}));

    check('Tidak ada page error', pageErrors.length === 0, pageErrors.slice(0, 5).join(' || '));
    const severe = consoleErrors.filter(t => !/favicon|manifest|DevTools|service worker|Failed to fetch|net::ERR|401|403|404/i.test(t));
    check('Tidak ada console error kritis', severe.length === 0, severe.slice(0, 5).join(' || '));

    fs.writeFileSync(`${OUT}\\roster-results.json`, JSON.stringify({ results, pageErrors, consoleErrors, yearMonth }, null, 2));
  } catch (e) {
    console.error('E2E FATAL:', e);
    try { await page.screenshot({ path: `${OUT}\\roster-fatal.png` }); } catch (_) {}
    console.error('Page errors:', pageErrors);
    console.error('Console errors:', consoleErrors);
    process.exitCode = 1;
  } finally {
    if (yearMonth) {
      try {
        const status = await deleteRosters(yearMonth);
        console.log(`Cleanup rosters ${yearMonth}: ${status}`);
      } catch (e) { console.warn('Cleanup failed:', e.message); }
    }
    await browser.close();
  }
})();
