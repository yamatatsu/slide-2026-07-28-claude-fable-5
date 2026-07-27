<script setup lang="ts">
/**
 * 公式サイトのスナップショットをiframeで表示し、スライド送り（クリック）に
 * 合わせて該当箇所をハイライト + 和訳ポップオーバーを表示するコンポーネント。
 *
 * スナップショットは同一オリジン（public/配下）から配信されるため、
 * 親からiframe内のDOMを直接操作できる。
 */
import { computed, onMounted, onUnmounted, ref, unref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import { registry } from '../highlights'

const props = defineProps<{ name: string }>()
const { $clicks, $page, $slidev } = useSlideContext()

// メモリ節約: 現在のスライドと前後1枚だけiframeをマウントする
// （フルページのスナップショットを複数同時に生かしておくと
//   メモリの少ないマシンでタブがkillされることがある）
const shouldRender = computed(() => Math.abs(unref($slidev.nav.currentPage) - unref($page)) <= 1)

// プリロードされた非表示スライド（display:none）では座標が取れないため、
// ハイライト処理はアクティブなスライドでのみ行う
const isActive = computed(() => unref($slidev.nav.currentPage) === unref($page))

const cfg = registry[props.name]
if (!cfg) throw new Error(`unknown highlight scenario: ${props.name}`)
const DESIGN_WIDTH = cfg.width ?? 1380

// registry の src は '/snapshots/xxx.html' 形式（先頭スラッシュ）だが、これは
// 動的バインディングのため Vite が base を前置してくれない。GitHub Pages の
// サブパス配信（base=/slide-.../）では base を明示的に付けないと iframe が
// 404 になるため、import.meta.env.BASE_URL を前置して解決する。
// dev では BASE_URL='/' なので従来どおり '/snapshots/xxx.html' になる。
const resolvedSrc = import.meta.env.BASE_URL.replace(/\/$/, '') + cfg.src

const wrapper = ref<HTMLDivElement>()
const frame = ref<HTMLIFrameElement>()
const scale = ref(0.6)
const frameHeight = ref(900)

let resizeObserver: ResizeObserver | undefined

function layout() {
  const el = wrapper.value
  if (!el) return
  scale.value = el.clientWidth / DESIGN_WIDTH
  frameHeight.value = el.clientHeight / scale.value
}

onMounted(() => {
  layout()
  resizeObserver = new ResizeObserver(layout)
  if (wrapper.value) resizeObserver.observe(wrapper.value)
})
onUnmounted(() => resizeObserver?.disconnect())

/** 空白と引用符の揺れを吸収してテキスト比較する */
function normalize(s: string) {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
}

/** query を含む最も内側（テキストが最短）の要素を探す */
function findByText(doc: Document, query: string): HTMLElement | null {
  const q = normalize(query)
  let best: HTMLElement | null = null
  let bestLen = Number.POSITIVE_INFINITY
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
  while (walker.nextNode()) {
    const el = walker.currentNode as HTMLElement
    if (el.closest('.cf5-pop')) continue
    const text = normalize(el.textContent ?? '')
    if (text.includes(q) && text.length < bestLen) {
      best = el
      bestLen = text.length
    }
  }
  return best
}

function injectBaseStyles(doc: Document) {
  if (doc.getElementById('cf5-style')) return
  const style = doc.createElement('style')
  style.id = 'cf5-style'
  const hide = (cfg.hide ?? []).map((sel) => `${sel} { display: none !important; }`).join('\n')
  style.textContent = `
    ${hide}
    /* スナップショット内の無限アニメーション（スケルトン等）は描画負荷になるだけなので止める */
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }
    .cf5-hl {
      background: rgba(217, 119, 87, 0.16) !important;
      box-shadow: 0 0 0 5px rgba(217, 119, 87, 0.16);
      outline: 3px solid #d97757;
      outline-offset: 4px;
      border-radius: 4px;
      transition: background 0.4s ease, outline-color 0.4s ease !important;
    }
    .cf5-pop {
      position: absolute;
      z-index: 2147483647;
      max-width: 520px;
      background: #141413;
      color: #faf9f5;
      font-family: 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif;
      font-size: 22px;
      line-height: 1.7;
      padding: 16px 20px 18px;
      border-radius: 14px;
      border: 1px solid rgba(217, 119, 87, 0.5);
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4);
      animation: cf5-in 0.35s ease both !important;
    }
    .cf5-pop::before {
      content: '';
      position: absolute;
      top: -9px;
      left: 36px;
      width: 16px;
      height: 16px;
      background: #141413;
      border-left: 1px solid rgba(217, 119, 87, 0.5);
      border-top: 1px solid rgba(217, 119, 87, 0.5);
      transform: rotate(45deg);
    }
    .cf5-pop-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 6px;
      color: #d97757;
      font-weight: 700;
      font-size: 20px;
    }
    .cf5-pop-head .cf5-count {
      color: rgba(250, 249, 245, 0.5);
      font-weight: 400;
      font-size: 15px;
      white-space: nowrap;
    }
    @keyframes cf5-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `
  doc.head.appendChild(style)
}

/**
 * 目標位置へスクロールする。距離が大きいときは近くまで一気に飛んでから
 * 滑らかに寄せる（長距離smooth scrollはレンダリング負荷が高い）
 */
function scrollSmart(win: Window, targetTop: number) {
  const JUMP_THRESHOLD = 2500
  if (Math.abs(targetTop - win.scrollY) > JUMP_THRESHOLD) {
    const approach = targetTop > win.scrollY ? targetTop - 1200 : targetTop + 1200
    win.scrollTo({ top: Math.max(0, approach), behavior: 'instant' as ScrollBehavior })
  }
  win.scrollTo({ top: targetTop, behavior: 'smooth' })
}

function clearStep(doc: Document) {
  doc.querySelectorAll('.cf5-hl').forEach((el) => el.classList.remove('cf5-hl'))
  doc.querySelectorAll('.cf5-pop').forEach((el) => el.remove())
}

let applySeq = 0

function applyStep(clicks: number) {
  if (!isActive.value) return
  const seq = ++applySeq

  // スライドに入った直後はまだ display:none が解けておらず座標が取れないことが
  // あるため、iframeが可視になるまで待ってから適用する
  const tryApply = (tries: number) => {
    if (seq !== applySeq) return // 新しいステップ適用が始まったら中断
    if ((frame.value?.getBoundingClientRect().width ?? 0) === 0) {
      if (tries < 120) requestAnimationFrame(() => tryApply(tries + 1))
      return
    }
    doApplyStep(clicks)
  }
  tryApply(0)
}

function doApplyStep(clicks: number) {
  const doc = frame.value?.contentDocument
  const win = frame.value?.contentWindow
  if (!doc?.body || !win) return
  injectBaseStyles(doc)
  clearStep(doc)

  if (clicks < 1) {
    let top = 0
    if (cfg.start) {
      const startEl = findByText(doc, cfg.start)
      if (startEl) top = Math.max(0, startEl.getBoundingClientRect().top + win.scrollY - 80)
    }
    scrollSmart(win, top)
    return
  }

  const index = Math.min(clicks, cfg.steps.length)
  const step = cfg.steps[index - 1]
  const el = findByText(doc, step.find)
  if (!el) {
    console.warn(`[WebHighlight] text not found: "${step.find}"`)
    return
  }

  el.classList.add('cf5-hl')

  // ポップオーバーは対象要素の直下（文書座標）に配置する
  const rect = el.getBoundingClientRect()
  if (rect.width < 2 || rect.height < 2) {
    // カルーセル内の隠れスライドなど、見えない要素を指していたら気付けるようにする
    console.warn(`[WebHighlight] target may be invisible (zero-size rect): "${step.find}"`)
  }
  const top = rect.bottom + win.scrollY + 18
  const left = Math.max(24, Math.min(rect.left + win.scrollX, DESIGN_WIDTH - 560))

  const pop = doc.createElement('div')
  pop.className = 'cf5-pop'
  const head = doc.createElement('div')
  head.className = 'cf5-pop-head'
  const title = doc.createElement('span')
  title.textContent = step.title ?? ''
  const count = doc.createElement('span')
  count.className = 'cf5-count'
  count.textContent = `${index} / ${cfg.steps.length}`
  head.append(title, count)
  const body = doc.createElement('div')
  body.textContent = step.note
  pop.append(head, body)
  pop.style.top = `${top}px`
  pop.style.left = `${left}px`
  doc.body.appendChild(pop)

  // ハイライトとポップオーバーが両方収まる位置へスクロール
  const targetCenter = rect.top + win.scrollY + (rect.height + pop.offsetHeight + 18) / 2
  scrollSmart(win, Math.max(0, targetCenter - frameHeight.value / 2))
}

function onFrameLoad() {
  applyStep($clicks.value)
}

// スライドに入った瞬間（isActive化）にも現在のステップを反映する
watch([$clicks, isActive], ([clicks]) => applyStep(clicks))
</script>

<template>
  <div ref="wrapper" class="cf5-wrapper">
    <iframe
      v-if="shouldRender"
      ref="frame"
      :src="resolvedSrc"
      :style="{
        width: `${DESIGN_WIDTH}px`,
        height: `${frameHeight}px`,
        transform: `scale(${scale})`,
      }"
      class="cf5-frame"
      @load="onFrameLoad"
    />
  </div>
</template>

<style scoped>
.cf5-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  background: #fff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}
.cf5-frame {
  border: 0;
  transform-origin: top left;
  /* クリックはスライド側の操作（ページ送り）に使うため、iframe操作は無効化 */
  pointer-events: none;
}
</style>
