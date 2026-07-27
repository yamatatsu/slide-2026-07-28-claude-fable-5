/**
 * 全スライド・全クリックステップのスクリーンショットを撮る確認用スクリプト。
 * devサーバを起動した状態で実行する: bun scripts/capture.ts [port]
 * 出力: tmp/captures/slide-<n>-click-<c>.png
 */
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const port = process.argv[2] ?? '3030'
const outDir = new URL('../tmp/captures/', import.meta.url).pathname
await mkdir(outDir, { recursive: true })

// スライド番号: クリック数（slides.md の clicks: と揃える）
const slides: Record<number, number> = { 1: 0, 2: 4, 3: 5, 4: 4 }

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

for (const [slide, clicks] of Object.entries(slides)) {
  for (let c = 0; c <= clicks; c++) {
    await page.goto(`http://localhost:${port}/${slide}?clicks=${c}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1600) // iframe読み込みとスクロール完了を待つ
    const file = `${outDir}slide-${slide}-click-${c}.png`
    await page.screenshot({ path: file })
    console.log(file)
  }
}

await browser.close()
