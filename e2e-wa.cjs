const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const SUPABASE = 'https://kjfpgtrhspvozikzttbe.supabase.co';
const KEY = 'sb_publishable_ijLoQjmjFNU6yC93yj5M8A_x_sFIhG8';
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const OUT = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\e2e-shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getWAConfigs() {
  const res = await fetch(`${SUPABASE}/rest/v1/config?key=eq.wa_contacts&select=*&order=tenant_id.asc`, { headers: HEADERS });
  if (!res.ok) throw new Error(`REST ${res.status}: ${await res.text()}`);
  return res.json();
}

async function deleteWAConfigs() {
  const res = await fetch(`${SUPABASE}/rest/v1/config?key=eq.wa_contacts`, { method: 'DELETE', headers: HEADERS });
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

async function openUserManagement(page) {
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.nav-tab-btn')].find(b => /Management User/i.test(b.innerText));
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!clicked) throw new Error('Menu Management User tidak ditemukan');
  await page.waitForFunction(() => /Pengaturan Disposisi WhatsApp/.test(document.body.innerText), { timeout: 20000 });
  await sleep(800);
}

async function setWAInputs(page, name, phone) {
  return page.evaluate(({ name, phone }) => {
    const heading = [...document.querySelectorAll('strong')].find(el => el.innerText.trim() === 'Departemen Keamanan');
    const panel = heading ? heading.closest('.glass-panel') : null;
    if (!panel) return false;
    const inputs = [...panel.querySelectorAll('input')];
    if (inputs.length < 2) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inputs[0], name);
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(inputs[1], phone);
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, { name, phone });
}

async function readWAInputs(page) {
  return page.evaluate(() => {
    const heading = [...document.querySelectorAll('strong')].find(el => el.innerText.trim() === 'Departemen Keamanan');
    const panel = heading ? heading.closest('.glass-panel') : null;
    if (!panel) return null;
    const inputs = [...panel.querySelectorAll('input')];
    return inputs.length >= 2 ? { nama: inputs[0].value, nomor: inputs[1].value } : null;
  });
}

async function clickWASave(page) {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /Simpan Pengaturan WA/i.test(b.innerText));
    if (btn) btn.click();
  });
  await page.waitForFunction(() => /Pengaturan nomor WhatsApp berhasil disimpan/.test(document.body.innerText), { timeout: 20000 });
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

  try {
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });

    await loginAndPick(page, '10001', '10001', 'tnt_astra');
    await openUserManagement(page);

    const astraInitial = await readWAInputs(page);
    check('Form WA Astra menampilkan nilai default', !!astraInitial && astraInitial.nama === 'Kepala Security / Danru', JSON.stringify(astraInitial));

    const setAstra = await setWAInputs(page, 'E2E Security Astra', '6281200000011');
    check('Input WA Astra dapat diubah', setAstra);
    await clickWASave(page);
    await page.screenshot({ path: `${OUT}\\10-wa-astra.png` });

    const localAstra = await page.evaluate(() => {
      const key = 'cmdigital_wa_contacts_tnt_astra';
      const raw = localStorage.getItem(key);
      return { key, data: raw ? JSON.parse(raw) : null };
    });
    check('localStorage WA memakai key per tenant Astra', !!localAstra.data && localAstra.key === 'cmdigital_wa_contacts_tnt_astra', localAstra.key);
    check('localStorage WA Astra berisi nilai baru', localAstra.data?.Keamanan?.nama === 'E2E Security Astra' && localAstra.data?.Keamanan?.nomor === '6281200000011', JSON.stringify(localAstra.data?.Keamanan));

    let configs = [];
    for (let i = 0; i < 12; i++) {
      configs = await getWAConfigs();
      if (configs.some(c => c.tenant_id === 'tnt_astra')) break;
      await sleep(1000);
    }
    const astraConfig = configs.find(c => c.tenant_id === 'tnt_astra');
    check('Config WA Astra tersimpan di database', !!astraConfig, astraConfig ? astraConfig.key : 'tidak ditemukan');
    if (astraConfig) {
      check('Config WA Astra terikat tenant tnt_astra', astraConfig.tenant_id === 'tnt_astra', astraConfig.tenant_id);
      check('Config WA Astra berisi nilai baru', astraConfig.data?.Keamanan?.nama === 'E2E Security Astra' && astraConfig.data?.Keamanan?.nomor === '6281200000011', JSON.stringify(astraConfig.data?.Keamanan));
    }

    // Pindah ke PT. CMM
    await logout(page);
    await loginAndPick(page, '10001', '10001', 'tnt_pt_cmm');
    await openUserManagement(page);

    const ptInitial = await readWAInputs(page);
    check('Form WA PT. CMM TIDAK memakai nilai Astra', !!ptInitial && ptInitial.nama !== 'E2E Security Astra' && ptInitial.nomor !== '6281200000011', JSON.stringify(ptInitial));
    check('Form WA PT. CMM memakai default sendiri', ptInitial?.nama === 'Kepala Security / Danru', JSON.stringify(ptInitial));

    const setPt = await setWAInputs(page, 'E2E Security CMM', '6281200000022');
    check('Input WA PT. CMM dapat diubah', setPt);
    await clickWASave(page);
    await page.screenshot({ path: `${OUT}\\11-wa-pt-cmm.png` });

    const localPt = await page.evaluate(() => {
      const raw = localStorage.getItem('cmdigital_wa_contacts_tnt_pt_cmm');
      return raw ? JSON.parse(raw) : null;
    });
    check('localStorage WA PT. CMM terpisah', localPt?.Keamanan?.nama === 'E2E Security CMM' && localPt?.Keamanan?.nomor === '6281200000022', JSON.stringify(localPt?.Keamanan));

    for (let i = 0; i < 12; i++) {
      configs = await getWAConfigs();
      if (configs.some(c => c.tenant_id === 'tnt_pt_cmm')) break;
      await sleep(1000);
    }
    const ptConfig = configs.find(c => c.tenant_id === 'tnt_pt_cmm');
    const astraConfig2 = configs.find(c => c.tenant_id === 'tnt_astra');
    check('Database memiliki 2 config WA terpisah', configs.length === 2, `count=${configs.length}`);
    check('Config WA PT. CMM berisi nilai sendiri', ptConfig?.data?.Keamanan?.nama === 'E2E Security CMM' && ptConfig?.data?.Keamanan?.nomor === '6281200000022', JSON.stringify(ptConfig?.data?.Keamanan));
    check('Config WA Astra tidak tertimpa PT. CMM', astraConfig2?.data?.Keamanan?.nama === 'E2E Security Astra' && astraConfig2?.data?.Keamanan?.nomor === '6281200000011', JSON.stringify(astraConfig2?.data?.Keamanan));

    // Kembali ke Astra untuk memastikan nilai tersimpan terbaca lagi
    await logout(page);
    await loginAndPick(page, '10001', '10001', 'tnt_astra');
    await openUserManagement(page);
    const astraAgain = await readWAInputs(page);
    check('Form WA Astra memuat kembali nilai tersimpan', astraAgain?.nama === 'E2E Security Astra' && astraAgain?.nomor === '6281200000011', JSON.stringify(astraAgain));

    check('Tidak ada page error', pageErrors.length === 0, pageErrors.slice(0, 5).join(' || '));
    const severe = consoleErrors.filter(t => !/favicon|manifest|DevTools|service worker|Failed to fetch|net::ERR|401|403|404/i.test(t));
    check('Tidak ada console error kritis', severe.length === 0, severe.slice(0, 5).join(' || '));

    fs.writeFileSync(`${OUT}\\wa-results.json`, JSON.stringify({ results, pageErrors, consoleErrors }, null, 2));
  } catch (e) {
    console.error('E2E FATAL:', e);
    try { await page.screenshot({ path: `${OUT}\\wa-fatal.png` }); } catch (_) {}
    console.error('Page errors:', pageErrors);
    console.error('Console errors:', consoleErrors);
    process.exitCode = 1;
  } finally {
    try {
      const status = await deleteWAConfigs();
      console.log(`Cleanup WA configs: ${status}`);
    } catch (e) { console.warn('Cleanup failed:', e.message); }
    await browser.close();
  }
})();
