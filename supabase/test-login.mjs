import puppeteer from 'puppeteer-core'

const TARGET = process.env.TARGET || 'https://cdi-system.vercel.app'

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
})
const page = await browser.newPage()

// Intercepta fetch ANTES de tudo para capturar url+headers e erros
await page.evaluateOnNewDocument(() => {
  window.__cap = []
  const orig = window.fetch
  window.fetch = function (input, init) {
    try {
      const url = typeof input === 'string' ? input : (input && input.url)
      if (url && url.includes('/auth/v1/token')) {
        const h = (init && init.headers) || {}
        const hdrs = {}
        for (const k in h) {
          const v = String(h[k])
          const bad = [...v].filter(ch => ch.charCodeAt(0) > 255).map(ch => 'U+' + ch.charCodeAt(0).toString(16))
          hdrs[k] = { len: v.length, bad: bad.length ? bad : 'ok', sample: v.slice(0, 25) }
        }
        window.__cap.push({ url, hdrs })
      }
    } catch (e) { window.__cap.push({ err: String(e) }) }
    return orig.apply(this, arguments)
  }
})

await page.goto(`${TARGET}/login`, { waitUntil: 'networkidle2', timeout: 60000 })
await page.type('input[type="text"]', 'admin')
await page.type('input[type="password"]', 'CdiAdmin2026')
await page.click('button[type="submit"]')
await new Promise(r => setTimeout(r, 4000))

const cap = await page.evaluate(() => window.__cap)
console.log('TARGET:', TARGET)
console.log('CAPTURA:', JSON.stringify(cap, null, 2))
await browser.close()
