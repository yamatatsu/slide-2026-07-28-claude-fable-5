/**
 * 公式ページのスナップショットを public/snapshots/ に保存する。
 *
 * - <script> や preload 系 <link>、CSP meta を除去（静的SSR HTMLとして保存）
 * - ルート相対URLを元オリジンの絶対URLに書き換え（画像などはCDNを参照）
 * - CSSとCSS内のフォント等はCORSで弾かれるためローカルにダウンロードして同梱
 *
 * 使い方: bun scripts/snapshot.ts <url> <name>
 * 例:     bun scripts/snapshot.ts https://www.anthropic.com/news/claude-fable-5-mythos-5 news
 */
import { mkdir, rm } from 'node:fs/promises'

const [url, name] = process.argv.slice(2)
if (!url || !name) {
  console.error('usage: bun scripts/snapshot.ts <url> <name>')
  process.exit(1)
}

const origin = new URL(url).origin
const outDir = new URL('../public/snapshots/', import.meta.url).pathname
const assetDirName = `${name}_assets`
const assetDir = `${outDir}${assetDirName}`
await rm(assetDir, { recursive: true, force: true })
await mkdir(assetDir, { recursive: true })

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

async function fetchText(u: string): Promise<string> {
  const res = await fetch(u, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${u}`)
  return res.text()
}

let html = await fetchText(url)

// scriptタグ・preload系link・CSP metaを除去
html = html
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  .replace(/<link\b[^>]*rel="(?:preload|modulepreload|prefetch|preconnect|dns-prefetch)"[^>]*>/gi, '')
  .replace(/<meta\b[^>]*http-equiv="[Cc]ontent-[Ss]ecurity-[Pp]olicy"[^>]*>/gi, '')

// JSハイドレーション待ちで隠されている本文を表示する（hidden属性のみ除去。
// class="hidden" などCSSによる装飾的な非表示はそのまま）
html = html.replace(/<div hidden(\s|>)/g, '<div$1')

// ルート相対URLを絶対URLへ（プロトコル相対 // は除外）
html = html.replace(/(href|src|content|poster|action)="\/(?!\/)/gi, `$1="${origin}/`)
html = html.replace(/srcset="([^"]*)"/gi, (_m, v: string) => {
  const items = v.split(',').map((s) => {
    const t = s.trim()
    return t.startsWith('/') && !t.startsWith('//') ? `${origin}${t}` : t
  })
  return `srcset="${items.join(', ')}"`
})

// アセット（フォント・画像等）をダウンロードしてローカルファイル名を返す
const downloaded = new Map<string, string>() // 元URL -> ローカルファイル名
let mediaCount = 0

const EXT_BY_TYPE: Record<string, string> = {
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
}

async function localizeMedia(absUrl: string): Promise<string> {
  const cached = downloaded.get(absUrl)
  if (cached) return cached
  const u = new URL(absUrl)
  // next/imageの最適化URLは中身のURLからファイル名を取る
  const inner = u.searchParams.get('url')
  const basePath = inner ? new URL(inner, u.origin).pathname : u.pathname
  let base = (basePath.split('/').pop() || 'asset').replace(/[^\w.~-]/g, '_')
  const res = await fetch(absUrl, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${absUrl}`)
  const ext = EXT_BY_TYPE[res.headers.get('content-type')?.split(';')[0] ?? '']
  if (ext && !base.toLowerCase().endsWith(ext)) base += ext
  const fileName = `${mediaCount++}-${base}`
  await Bun.write(`${assetDir}/${fileName}`, await res.arrayBuffer())
  downloaded.set(absUrl, fileName)
  return fileName
}

const linkRe = /<link\b[^>]*rel="stylesheet"[^>]*>/gi
const links = [...html.matchAll(linkRe)]
let cssCount = 0
for (const m of links) {
  const tag = m[0]
  const href = tag.match(/href="([^"]+)"/)?.[1]
  if (!href) continue
  const cssUrl = new URL(href, url).href
  let css = await fetchText(cssUrl)

  const refs = [...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)]
  for (const r of refs) {
    const raw = r[2]
    if (raw.startsWith('data:')) continue
    const abs = new URL(raw, cssUrl).href
    if (abs.startsWith(origin)) {
      const local = await localizeMedia(abs)
      css = css.replaceAll(r[0], `url(./${local})`)
    } else {
      css = css.replaceAll(r[0], `url(${abs})`)
    }
  }

  const cssName = `style-${cssCount++}.css`
  await Bun.write(`${assetDir}/${cssName}`, css)
  html = html.replace(tag, tag.replace(/href="[^"]+"/, `href="./${assetDirName}/${cssName}"`))
}

// <img>の画像をダウンロードして同梱する。srcsetからは表示に十分な解像度
// （2000w以下で最大、なければ最小）を1つ選び、srcに一本化してサイズ肥大を防ぐ
function pickFromSrcset(srcset: string): string | null {
  const candidates = srcset
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((c) => {
      const m = c.match(/^(\S+)(?:\s+(\d+(?:\.\d+)?)[wx])?$/)
      return m ? { url: m[1], size: m[2] ? Number(m[2]) : 0 } : null
    })
    .filter((c): c is { url: string; size: number } => c !== null)
    .sort((a, b) => a.size - b.size)
  if (candidates.length === 0) return null
  const fit = candidates.filter((c) => c.size <= 2000).pop()
  return (fit ?? candidates[0]).url
}

// 属性値内のHTMLエンティティを実体に戻す（URLの &amp; など）
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#x26;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)]
let imgFailed = 0
for (const m of imgTags) {
  const tag = m[0]
  const srcset = tag.match(/\ssrcset="([^"]*)"/i)?.[1]
  const src = tag.match(/\ssrc="([^"]*)"/i)?.[1]
  const picked = (srcset && pickFromSrcset(decodeEntities(srcset))) || (src && decodeEntities(src))
  if (!picked || picked.startsWith('data:')) continue
  try {
    const local = await localizeMedia(new URL(picked, url).href)
    const newTag = tag
      .replace(/\s(srcset|sizes|src)="[^"]*"/gi, '')
      .replace(/^<img/i, `<img src="./${assetDirName}/${local}"`)
    html = html.replaceAll(tag, newTag)
  } catch (e) {
    imgFailed++
    console.warn(`  skip img: ${picked.slice(0, 100)} (${e})`)
  }
}

await Bun.write(`${outDir}${name}.html`, html)
console.log(
  `saved ${name}.html (${(html.length / 1024).toFixed(0)} KB), ` +
    `${cssCount} css, ${downloaded.size} media files` +
    (imgFailed ? `, ${imgFailed} img failed` : ''),
)
