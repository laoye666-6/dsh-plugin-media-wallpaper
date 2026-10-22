/**
 * 开屏动画（移植自 dsh-chat-wallpaper 的核心体验）。
 *
 * 体验目标：启动时先全屏播放一段动画，播完渐隐，露出壁纸与聊天界面。
 *
 * 关键时序（和 dsh-startup-screen 配合）：
 *  1. 等开机动画**开始收场**（根元素出现 dsu-handoff / dsu-gone class）再播，
 *     否则用户在走开机动画时动画已经播完了。
 *  2. 那一刻把自己**满不透明**地垫在开机动画下面（z-index 比它低 10），
 *     它的 620ms 淡出就自动变成叠化，中间不会闪出聊天窗口。
 *  3. 播完 → opacity 渐隐（fadeMs）→ 移除层，露出底下的壁纸/聊天。
 *
 * 安全兜底：
 *  - 2 秒内没能开始播放 → 立刻撤层，绝不把界面永久盖住。
 *  - 视频播完有 ended / timeupdate / 看门狗三重收尾；图片按 holdMs 停留后收。
 *  - 每会话只播一次（sessionStorage），刷新/热重载不重播。
 *  - 层 pointer-events:none，不吞任何点击。
 */

import { getSnapshot, setIntro } from './state'
import type { FillMode, IntroSettings } from './state'
import { getMedia } from './storage'
import type { MediaRecord } from './storage'
import { PLUGIN_PKG } from './identity'

const INTRO_ATTR = 'data-wp-intro'
const SESSION_KEY = 'dsh-plugin-media-wallpaper.intro-shown'
/** 开机动画根元素（与 dsh-startup-screen 约定；换插件时改这里）。 */
const BOOT_SELECTORS = ['#dsh-startup-root']
/** 开机动画"开始离场"的信号 class（dsu-handoff 先出现，dsu-gone 更晚）。 */
const LEAVE_CLASSES = ['dsu-handoff', 'dsu-gone']
const POLL_MS = 50
const GRACE_MS = 3000
const GIVE_UP_MS = 180000
const FADE_IN_MS = 300
const MAX_PLAY_START_MS = 2000

let layer: HTMLDivElement | null = null
let objectUrl: string | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let fadeTimer: ReturnType<typeof setTimeout> | null = null
let watchdog: ReturnType<typeof setTimeout> | null = null
let holdTimer: ReturnType<typeof setTimeout> | null = null
let playStartTimer: ReturnType<typeof setTimeout> | null = null
let started = false
let stopped = false

function log(...args: unknown[]): void {
  try {
    console.info('[dsh-plugin-media-wallpaper][intro]', ...args)
  } catch {
    // 控制台不可用时忽略
  }
}

function sessionShown(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function markShown(): void {
  try {
    globalThis.sessionStorage?.setItem(SESSION_KEY, '1')
  } catch {
    // 隐私模式不可写：退化为每次刷新都播（可接受）
  }
}

/** 清掉"这个会话播过了"标记（手动重播/调试用）。 */
export function clearIntroShown(): void {
  try {
    globalThis.sessionStorage?.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

/** 开机动画还在挡着吗？（只看 class，不看几何尺寸——零尺寸不代表收场） */
function overlayPresent(): boolean {
  for (const sel of BOOT_SELECTORS) {
    let el: Element | null = null
    try {
      el = document.querySelector(sel)
    } catch {
      continue
    }
    if (!el) continue
    let leaving = false
    for (const cls of LEAVE_CLASSES) {
      if (el.classList.contains(cls)) {
        leaving = true
        break
      }
    }
    if (!leaving) return true
  }
  return false
}

function mediaFit(fit: FillMode): string {
  return fit === 'contain' ? 'contain' : fit === 'fill' ? 'fill' : 'cover'
}

function clearTimers(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  for (const t of [fadeTimer, watchdog, holdTimer, playStartTimer]) {
    if (t !== null) clearTimeout(t)
  }
  fadeTimer = null
  watchdog = null
  holdTimer = null
  playStartTimer = null
}

/** 只撤掉旧层/旧定时器，不动 objectURL（用于"换一条媒体重播"）。 */
function removeLayerOnly(): void {
  clearTimers()
  const el = layer
  layer = null
  if (el?.parentNode) el.parentNode.removeChild(el)
}

/** 撤层 + 释放资源（幂等）。 */
function dispose(): void {
  removeLayerOnly()
  if (objectUrl !== null) {
    try {
      URL.revokeObjectURL(objectUrl)
    } catch {
      // ignore
    }
    objectUrl = null
  }
}

/** 播完 → 渐隐 → 撤层。 */
function finish(why: string, fadeMs: number): void {
  if (fadeTimer !== null || layer === null) return
  const ms = Math.max(100, Math.min(5000, Math.round(fadeMs)))
  log('播放结束（' + why + '）→ 渐隐 ' + ms + 'ms')
  layer.style.transition = 'opacity ' + ms + 'ms linear'
  layer.style.opacity = '0'
  fadeTimer = setTimeout(() => {
    fadeTimer = null
    dispose()
  }, ms + 80)
}

function revealLayer(sawOverlay: boolean): void {
  if (!layer) return
  if (sawOverlay) {
    // 交叉叠化：直接满不透明，让开机动画的淡出把我们叠出来
    layer.style.transition = 'none'
    layer.style.opacity = '1'
    return
  }
  layer.style.transition = 'opacity ' + FADE_IN_MS + 'ms linear'
  layer.style.opacity = '0'
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb: () => void) => setTimeout(cb, 16)
  raf(() => {
    if (layer) layer.style.opacity = '1'
  })
}

/** 建层并挂载媒体；返回视频元素（视频时）用于播放控制。 */
function mountMedia(cfg: IntroSettings, url: string): HTMLVideoElement | null {
  // 只清掉旧层，千万别 revoke 当前 objectURL（它马上就要被 <video>/<img> 用）
  removeLayerOnly()
  const el = document.createElement('div')
  el.setAttribute(INTRO_ATTR, '')
  el.setAttribute('data-plugin', PLUGIN_PKG)
  el.setAttribute('aria-hidden', 'true')
  el.style.opacity = '0'
  const fit = mediaFit(cfg.fit)

  let video: HTMLVideoElement | null = null
  if (cfg.mediaType === 'video') {
    video = document.createElement('video')
    video.setAttribute('data-plugin', PLUGIN_PKG)
    video.setAttribute('aria-hidden', 'true')
    video.src = url
    video.muted = true
    video.autoplay = false
    video.loop = false
    video.playsInline = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.preload = 'auto'
    video.style.objectFit = fit
    video.style.width = '100%'
    video.style.height = '100%'
    video.style.display = 'block'
    el.appendChild(video)
  } else {
    const img = document.createElement('img')
    img.setAttribute('data-plugin', PLUGIN_PKG)
    img.setAttribute('aria-hidden', 'true')
    img.alt = ''
    img.src = url
    img.style.objectFit = fit
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.display = 'block'
    el.appendChild(img)
  }

  ;(document.body ?? document.documentElement).appendChild(el)
  layer = el
  return video
}

/** 真正播放（视频/图片两条路径）。 */
function playWith(cfg: IntroSettings, url: string, preview: boolean, sawOverlay: boolean): void {
  const video = mountMedia(cfg, url)
  revealLayer(sawOverlay)

  if (video) {
    let finished = false
    const finishOnce = (why: string): void => {
      if (finished) return
      finished = true
      finish(why, cfg.fadeMs)
    }
    video.addEventListener('error', () => {
      log('动画加载失败 → 撤层')
      dispose()
    })
    video.addEventListener('ended', () => finishOnce('ended'))
    video.addEventListener('timeupdate', () => {
      if (video.duration > 0 && video.currentTime >= video.duration - 0.08) finishOnce('到达结尾')
    })
    if (video.readyState >= 1) {
      try {
        video.currentTime = 0
      } catch {
        // ignore
      }
    }
    void video.play().catch((err: unknown) => {
      log('play() 被拒（autoplay 策略？）', String(err))
    })
    // 看门狗：视频卡住永远不 ended 时的最后兜底
    watchdog = setTimeout(() => {
      finishOnce('看门狗兜底（视频没正常结束）')
    }, ((video.duration > 0 ? video.duration : 12) + 5) * 1000)
    // 硬保证：2 秒还没播起来就撤层，绝不盖住界面
    playStartTimer = setTimeout(() => {
      if (layer === null) return
      if (video.paused) {
        log('⚠️ 2 秒内没能开始播放 → 撤层，宁可没有开屏也不盖住界面')
        dispose()
      }
    }, MAX_PLAY_START_MS)
  } else {
    // 图片 / GIF / APNG / 动图 WebP：没有"播完"信号，按停留时长收
    holdTimer = setTimeout(() => finish('图片停留结束', cfg.fadeMs), Math.max(500, Math.round(cfg.holdMs)))
  }

  if (!preview) markShown()
  log(preview ? '预览播放已开始' : '开屏动画已开始', { type: cfg.mediaType, fit: cfg.fit })
}

function stopPoll(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

/** 等开机动画开始离场；没有开机动画时宽限 GRACE_MS 后自己开始。 */
function waitForBoot(onReady: (sawOverlay: boolean) => void): void {
  let ticks = 0
  let sawOverlay = false
  stopPoll()
  pollTimer = setInterval(() => {
    ticks += 1
    const present = overlayPresent()
    if (present) sawOverlay = true
    const waited = ticks * POLL_MS
    if (waited >= GIVE_UP_MS) {
      stopPoll()
      log('等待开机动画超时 ' + GIVE_UP_MS / 1000 + 's → 直接播')
      onReady(sawOverlay)
      return
    }
    if (!present) {
      if (sawOverlay) {
        stopPoll()
        onReady(true)
        return
      }
      if (waited >= GRACE_MS) {
        stopPoll()
        log('宽限 ' + GRACE_MS / 1000 + 's 内没检测到开机动画 → 直接播')
        onReady(false)
      }
    }
  }, POLL_MS)
}

async function run(cfg: IntroSettings, preview: boolean): Promise<void> {
  let record: MediaRecord | null = null
  try {
    record = cfg.mediaId ? await getMedia(cfg.mediaId) : null
  } catch {
    record = null
  }
  if (stopped) return
  if (!record) {
    log('媒体读取失败（浏览器存储可能已被清理）→ 跳过并回落到未启用')
    if (!preview) setIntro({ enabled: false, mediaId: null, mediaType: null, formatLabel: null, mediaName: null })
    return
  }
  // 先清掉上一轮（层 + 旧 objectURL），再创建新的
  dispose()
  try {
    objectUrl = URL.createObjectURL(record.blob)
  } catch (err) {
    log('创建 objectURL 失败', String(err))
    return
  }
  const go = (sawOverlay: boolean): void => {
    if (stopped || !objectUrl) return
    playWith(cfg, objectUrl, preview, sawOverlay)
  }
  if (preview || !cfg.waitForBoot) go(false)
  else waitForBoot(go)
}

/** 插件启动时调用一次：按设置决定是否播开屏动画。 */
export function startIntro(): void {
  if (started || stopped) return
  started = true
  const cfg = getSnapshot().intro
  if (!cfg.enabled || !cfg.mediaId || !cfg.mediaType) {
    log('未启用开屏动画 → 跳过')
    return
  }
  if (cfg.oncePerSession && sessionShown()) {
    log('本会话已经播过开屏动画 → 跳过（想再看：设置 → 壁纸 → 预览播放）')
    return
  }
  void run(cfg, false)
}

/** 设置页「预览播放」：忽略"每会话一次"和等待开机动画，立刻全屏播一次。 */
export function previewIntro(): void {
  const cfg = getSnapshot().intro
  if (!cfg.enabled || !cfg.mediaId || !cfg.mediaType) {
    log('还没有可预览的开屏动画')
    return
  }
  dispose()
  stopped = false
  started = true
  void run(cfg, true)
}

/** 插件卸载时调用：撤层、清定时器、释放 objectURL。 */
export function stopIntro(): void {
  stopped = true
  dispose()
}
