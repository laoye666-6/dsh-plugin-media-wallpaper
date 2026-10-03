/**
 * 界面透明化引擎。
 *
 * 职责：
 *  1. 给 AppFrame 打自有标记（frame / 侧栏 / 主列）。官方 CSS Modules 的类名
 *     在构建期被哈希，插件无法按名定位；但 AppFrame 提供了稳定的结构锚点：
 *     - [data-shell-overlay] / [data-shell-bottom] 的父元素即 frame
 *     - 右栏自带 [data-rightbar-col]，底部行自带 [data-shell-bottom]（无需打标）
 *     - 其余流内子列按几何位置排序：最左为侧栏，其后为主列
 *  2. 把设置投影为 body 属性与 CSS 变量（styles.ts 的规则全部挂在这些钩子上）。
 *  3. 结构识别连续失败时进入兜底模式（全局 token 覆盖），保证功能仍可用。
 */

import type { WallpaperSettings } from './state'
import { isActive } from './state'

const RETRY_DELAYS_MS = [150, 300, 600, 1200, 2400, 4800]

let observer: MutationObserver | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryIndex = 0
let fallback = false
let rafPending = false

function safeMatchMedia(query: string): MediaQueryList | null {
  try {
    return typeof matchMedia === 'function' ? matchMedia(query) : null
  } catch {
    return null
  }
}

/** 宽松元素判断：不依赖 HTMLElement 全局（桩环境/SSR 安全）。 */
function isElement(v: unknown): v is HTMLElement {
  return (
    typeof v === 'object' && v !== null &&
    typeof (v as HTMLElement).setAttribute === 'function' &&
    typeof (v as HTMLElement).getAttribute === 'function'
  )
}

/** 收集容器的"流内子列"：排除官方锚点元素与拖拽手柄等绝对定位小条。 */
function flowColumns(container: HTMLElement, right: Element | null): HTMLElement[] {
  const out: HTMLElement[] = []
  for (const child of container.children) {
    if (!isElement(child)) continue
    if (
      child.hasAttribute('data-shell-overlay') ||
      child.hasAttribute('data-shell-bottom') ||
      child.hasAttribute('data-shell-leading') ||
      child === right
    ) {
      continue
    }
    // 过滤拖拽手柄等 8px 绝对定位小条
    if (child.offsetWidth < 24 && getComputedStyleSafe(child) === 'absolute') continue
    out.push(child)
  }
  return out
}

/** 尝试定位并打标 AppFrame；成功返回 true。 */
function retag(): boolean {
  if (typeof document === 'undefined') return false
  const anchor = document.querySelector('[data-shell-overlay], [data-shell-bottom]')
  const frame = anchor?.parentElement
  if (!isElement(frame)) return false

  const right = frame.querySelector(':scope > [data-rightbar-col]')
  let cols = flowColumns(frame, right)
  if (cols.length < 2) {
    // rc.2 的 AppFrame 为行包装结构：列在下一层容器里，下降一层重找
    for (const wrapper of cols) {
      const sub = flowColumns(wrapper, wrapper.querySelector(':scope > [data-rightbar-col]'))
      if (sub.length >= 2) {
        cols = sub
        break
      }
    }
  }
  if (cols.length < 2) return false

  cols.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
  const sidebar = cols[0]!
  const center = cols[1]!

  clearTags()
  frame.setAttribute('data-wp-frame', '')
  sidebar.setAttribute('data-wp-sidebar', '')
  center.setAttribute('data-wp-center', '')
  return true
}

function getComputedStyleSafe(el: HTMLElement): string {
  try {
    return typeof getComputedStyle === 'function' ? getComputedStyle(el).position : ''
  } catch {
    return ''
  }
}

function clearTags(): void {
  for (const el of document.querySelectorAll('[data-wp-frame],[data-wp-sidebar],[data-wp-center]')) {
    el.removeAttribute('data-wp-frame')
    el.removeAttribute('data-wp-sidebar')
    el.removeAttribute('data-wp-center')
  }
}

function tagsValid(): boolean {
  const frame = document.querySelector('[data-wp-frame]')
  if (!frame || !frame.isConnected) return false
  const anchor = document.querySelector('[data-shell-overlay], [data-shell-bottom]')
  if (anchor?.parentElement !== frame) return false
  const sidebar = document.querySelector('[data-wp-sidebar]')
  const center = document.querySelector('[data-wp-center]')
  return Boolean(sidebar?.isConnected && center?.isConnected)
}

function scheduleRetry(onGiveUp: () => void): void {
  if (retryIndex >= RETRY_DELAYS_MS.length) {
    onGiveUp()
    return
  }
  const delay = RETRY_DELAYS_MS[retryIndex++]!
  retryTimer = setTimeout(() => {
    retryTimer = null
    if (retag()) return
    scheduleRetry(onGiveUp)
  }, delay)
}

function giveUpToFallback(): void {
  fallback = true
  document.body.setAttribute('data-wp-fallback', '1')
  clearTags()
}

function scheduleRafCheck(): void {
  if (rafPending || fallback) return
  rafPending = true
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb: () => void) => setTimeout(cb, 32)
  raf(() => {
    rafPending = false
    if (fallback) return
    if (!tagsValid() && !retag()) {
      retryIndex = 0
      scheduleRetry(giveUpToFallback)
    }
  })
}

/** 启动打标与结构观察（幂等）。 */
export function start(): void {
  if (typeof document === 'undefined') return
  if (typeof MutationObserver === 'function') {
    observer = new MutationObserver(scheduleRafCheck)
    observer.observe(document.body, { childList: true, subtree: true })
  }
  if (retag()) return
  scheduleRetry(giveUpToFallback)
}

export function stop(): void {
  observer?.disconnect()
  observer = null
  if (retryTimer !== null) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  if (typeof document !== 'undefined') {
    clearTags()
    const body = document.body
    body.removeAttribute('data-wp-fallback')
    body.removeAttribute('data-wp-active')
    body.removeAttribute('data-wp-t-sidebar')
    body.removeAttribute('data-wp-t-topbar')
    body.removeAttribute('data-wp-t-main')
    body.removeAttribute('data-wp-t-rightbar')
    body.removeAttribute('data-wp-t-cards')
    body.removeAttribute('data-wp-tint')
  }
  fallback = false
  retryIndex = 0
}

/** 把设置投影为 body 属性与变量（styles.ts 的规则全部挂在这些钩子上）。 */
export function applySettings(s: WallpaperSettings): void {
  if (typeof document === 'undefined') return
  const body = document.body
  if (!isActive(s)) {
    body.removeAttribute('data-wp-active')
    body.removeAttribute('data-wp-finish')
    body.style.removeProperty('--wp-frost')
    return
  }
  body.setAttribute('data-wp-active', '')
  const t = s.transparent
  body.setAttribute('data-wp-t-sidebar', t.sidebar ? '1' : '0')
  body.setAttribute('data-wp-t-topbar', t.topbar ? '1' : '0')
  body.setAttribute('data-wp-t-main', t.main ? '1' : '0')
  body.setAttribute('data-wp-t-rightbar', t.rightbar ? '1' : '0')
  body.setAttribute('data-wp-t-cards', t.cards ? '1' : '0')
  body.setAttribute('data-wp-tint', s.tintFollow ? '1' : '0')
  body.setAttribute('data-wp-finish', s.finish)
  body.style.setProperty('--wp-frost', `${Math.round(s.frostStrength)}px`)

  // 系统级"减弱透明度"偏好：把不透明度抬到 90 以上，尊重可达性设置
  const reduced = safeMatchMedia('(prefers-reduced-transparency: reduce)')?.matches ?? false
  const op = reduced ? Math.max(s.surfaceOpacity, 90) : s.surfaceOpacity
  body.style.setProperty('--wp-op', String(op))
  body.style.setProperty('--wp-tint-mix', s.tintFollow ? `${Math.round(s.tintStrength)}%` : '0%')
}
