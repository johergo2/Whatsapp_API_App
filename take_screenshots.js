const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3003';
const OUTPUT_DIR = path.join(__dirname, 'docs', 'images');

const USER = { nombre: 'test_manual', password: 'test123' };
const USER_DATA = { id: 4, nombre: 'test_manual', rol: 'superadmin', activo: true, cliente_id: 1, cliente_ids: [1] };

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function takeScreenshot(page, name, fullPage = true) {
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage });
  console.log(`  ✓ ${name}.png`);
  return filePath;
}

async function loginAndCapture(page) {
  console.log('1. Taking login screenshot...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
  await sleep(3000);
  await takeScreenshot(page, '01_login');
}

async function injectSession(page) {
  // Set localStorage to simulate logged in user
  await page.evaluate((userData) => {
    localStorage.setItem('mercurio_user', JSON.stringify(userData));
  }, USER_DATA);
}

async function capturePage(page, label, url, filename, waitSelectors = []) {
  console.log(`${label}...`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 }).catch(() => {});
  await sleep(3000);
  await takeScreenshot(page, filename);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setViewport({ width: 1366, height: 768 });

  // 1. Login page
  await loginAndCapture(page);

  // Inject session for authenticated pages
  await injectSession(page);

  // 2. Dashboard
  await capturePage(page, '2. Dashboard', `${BASE_URL}/`, '02_dashboard');

  // 3. Chat
  await capturePage(page, '3. Chat', `${BASE_URL}/chat`, '03_chat');

  // 4. Prospects
  await capturePage(page, '4. Prospects', `${BASE_URL}/prospects`, '04_prospects');

  // 5. Send (Configurar mensajes)
  await capturePage(page, '5. Send', `${BASE_URL}/send`, '05_send');

  // 6. Templates
  await capturePage(page, '6. Templates', `${BASE_URL}/templates`, '06_templates');

  // 7. Upload
  await capturePage(page, '7. Upload', `${BASE_URL}/upload`, '07_upload');

  // 8. History
  await capturePage(page, '8. History', `${BASE_URL}/history`, '08_history');

  await browser.close();
  console.log('\nAll screenshots taken!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
