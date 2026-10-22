/**
 * dsh-plugin-wallpaper — 浏览器半侧入口。
 *
 * 由 DSH 客户端模块系统以懒 CJS 工厂加载（window.__ModuleLoader__.load），
 * 激活时由浏览器 Cordis Loader 以插件形式实例化：inject ['slots', 'theme']。
 *
 * 装配：
 *  - 全局样式（data-plugin 归属标记，停用时被模块系统回收）
 *  - 壁纸层（fixed z-index:-1，位于 AppFrame 之下）
 *  - 透明化引擎（AppFrame 打标 + body 属性/CSS 变量投影，失败进兜底模式）
 *  - 取色（canvas 均值 → --wp-tint，供界面色调跟随）
 *  - 设置面板（settings.section + plugins.detail.section 双插槽）
 *  - 开屏动画（全屏播一段动画，播完渐隐露出壁纸与聊天）
 * 任一环节失败仅降级该环节，不影响宿主启动。
 */

import type { ClientContext } from './types'
import { PLUGIN_PKG } from './identity'
import * as state from './state'
import { getMedia, takeObjectUrl, releaseObjectUrl } from './storage'
import * as layer from './layer'
import * as surface from './surface'
import * as palette from './palette'
import { injectStyles } from './styles'
import { registerSettingsSlots } from './settings'
import { startIntro, stopIntro } from './intro'
import { attachTheme, detachTheme } from './theme'

export const name = PLUGIN_PKG
export const inject = ['slots', 'theme']

let unsubscribe: (() => void) | null = null
let loadedMediaId: string | null = null
/** 最近一次壁纸主色取样（rgb(r g b) 字符串），供自动字色计算。 */
let lastTint: string | null = null

/** 强调色静态令牌：主色调跟随需要在覆盖它们之前留下原值，否则 color-mix 会形成循环引用。 */
const ACCENT_KEYS = ['--dsw-static-blue-400', '--dsw-static-blue-500', '--dsw-static-blue-600', '--dsw-static-deepseek-450'] as const

function captureAccents(): void {
  if (typeof document === 'undefined') return
  try {
    const body = document.body
    if (!body || typeof body.dataset === 'undefined' || typeof getComputedStyle !== 'function') return
    if (body.dataset.wpAccentCaptured === '1') return
    for (const key of ACCENT_KEYS) {
      const value = getComputedStyle(body).getPropertyValue(key).trim()
      if (value) body.style.setProperty(`${key.replace('--dsw-static-', '--wp-accent-base-')}`, value)
    }
    body.dataset.wpAccentCaptured = '1'
  } catch {
    // 非关键增强（仅主色调跟随需要），环境不支持时静默跳过
  }
}

/** 主题语义字色（primary/secondary/tertiary）的原始值：
 *  自动字色会把"直接透出壁纸的区域"的字涂成壁纸适配色，
 *  卡片/气泡/输入框等自有表面则用这里捕获的主题色还原回来（深色模式也正确）。 */
const THEME_LABEL_KEYS = ['primary', 'secondary', 'tertiary'] as const
let themeLabelsCaptured = false

function captureThemeLabels(): void {
  const body = typeof document !== 'undefined' ? document.body : null
  if (!body || typeof getComputedStyle !== 'function') return
  try {
    const cs = getComputedStyle(body)
    for (const key of THEME_LABEL_KEYS) {
      const value = cs.getPropertyValue(`--dsw-alias-label-${key}`).trim()
      if (value) body.style.setProperty(`--wp-label-theme-${key}`, value)
    }
    themeLabelsCaptured = true
  } catch {
    // 环境不支持时静默跳过（自动字色退化为只覆盖透壁纸区域）
  }
}

/** 最近一次选出的"壁纸上的字色"（true = 深字）。带滞回，避免视频壁纸播放时来回抖动。 */
let lastWallTextDark: boolean | null = null

const lin = (c: number): number => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminanceOf = (rgb: [number, number, number]): number =>
  0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])

/**
 * 字体颜色 = 自动：**不做全局反色**，而是按"文字实际压在什么上面"分开给色：
 *  1. 直接透出壁纸的区域（主内容区 / 低不透明度侧栏 / 右栏）：按壁纸亮度
 *     （含亮度、压暗设置）选深字或浅字 —— 亮壁纸配深字、暗壁纸配浅字；
 *  2. 卡片、气泡、输入框、弹层等**自有表面**：留给 DSH 主题语义色
 *     （深色模式自动是浅字、浅色主题自动是深字，与玻璃底色匹配）。
 *
 * 之前是拿"卡片玻璃"的亮度算一个全局颜色，导致深色模式/暗壁纸下
 * 主聊天区（完全透明）的文字变成深色贴深壁纸，对比度极低。
 */
function updateAutoText(): void {
  const body = typeof document !== 'undefined' ? document.body : null
  if (!body) return
  const s = state.getSnapshot()
  if (s.textColorMode !== 'auto') {
    body.style.removeProperty('--wp-text-on-wall')
    body.removeAttribute('data-wp-walltext')
    themeLabelsCaptured = false
    return
  }
  if (!themeLabelsCaptured) captureThemeLabels()
  const m = lastTint === null ? null : /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(lastTint)
  if (!m) {
    body.style.removeProperty('--wp-text-on-wall')
    body.removeAttribute('data-wp-walltext')
    return
  }
  // 壁纸真实观感 = 取样主色 × 亮度滤镜，再压一层黑色压暗
  const brightness = Math.max(0.2, Math.min(2, s.brightness / 100))
  const dimAlpha = Math.max(0, Math.min(90, s.dim)) / 100
  const clamp = (v: number): number => Math.max(0, Math.min(255, v))
  const perceived: [number, number, number] = [
    clamp(Number(m[1]) * brightness * (1 - dimAlpha)),
    clamp(Number(m[2]) * brightness * (1 - dimAlpha)),
    clamp(Number(m[3]) * brightness * (1 - dimAlpha)),
  ]
  const lum = luminanceOf(perceived)
  // 黑字/白字对比度相等点约在 luminance=0.2 附近；阈值带滞回
  if (lum >= 0.24) lastWallTextDark = true
  else if (lum <= 0.16) lastWallTextDark = false
  else if (lastWallTextDark === null) lastWallTextDark = lum >= 0.2
  body.style.setProperty('--wp-text-on-wall', lastWallTextDark ? '#1b1c22' : '#f5f6f7')

  // 只有"真的透出壁纸"的区域才用壁纸字色；不透明区域交给主题
  const regions: string[] = []
  if (s.transparent.main && s.opacity.main <= 40) regions.push('main')
  if (s.transparent.sidebar && s.opacity.sidebar <= 40) regions.push('sidebar')
  if (s.transparent.rightbar && s.opacity.rightbar <= 40) regions.push('rightbar')
  if (regions.length > 0) body.setAttribute('data-wp-walltext', regions.join(' '))
  else body.removeAttribute('data-wp-walltext')
}

async function loadMedia(id: string): Promise<void> {
  try {
    const record = await getMedia(id)
    if (!record) {
      // 浏览器存储被清理：回落到无壁纸状态
      state.set({ enabled: false, mediaId: null, mediaType: null, formatLabel: null, mediaName: null })
      layer.setMedia(null, null)
      palette.watch(null, null)
      return
    }
    const url = takeObjectUrl(record.blob)
    const snapshot = state.getSnapshot()
    layer.setMedia(url, snapshot.mediaType)
    palette.watch(url, snapshot.mediaType)
    palette.retryAttach()
    layer.updateLayer(state.getSnapshot())
    state.notify()
  } catch (err) {
    console.warn('[dsh-plugin-wallpaper] media load failed', err)
  }
}

function clearMedia(): void {
  layer.setMedia(null, null)
  palette.watch(null, null)
  releaseObjectUrl()
}

function applyAll(s: state.WallpaperSettings): void {
  surface.applySettings(s)
  updateAutoText()
  if (s.mediaId !== loadedMediaId) {
    loadedMediaId = s.mediaId
    if (s.mediaId !== null) void loadMedia(s.mediaId)
    else clearMedia()
  }
  layer.updateLayer(s)
}

/** 主题切换（深浅色）时重新捕获主题语义色，并让自动字色重算。 */
let themeObserver: MutationObserver | null = null
function watchTheme(): void {
  if (typeof MutationObserver !== 'function' || typeof document === 'undefined') return
  try {
    themeObserver = new MutationObserver(() => {
      if (state.getSnapshot().textColorMode !== 'custom') captureThemeLabels()
      updateAutoText()
    })
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme', 'class'] })
  } catch {
    // 环境不支持时忽略：自动字色仍按启动时的主题色工作
  }
}

export function apply(ctx: ClientContext): void {
  try {
    injectStyles()
    layer.ensureLayer()
    surface.start()
    captureAccents()
    captureThemeLabels()
    watchTheme()
    attachTheme(ctx)

    unsubscribe = state.subscribe(() => applyAll(state.getSnapshot()))

    registerSettingsSlots(ctx)

    palette.onTint((color) => {
      const body = typeof document !== 'undefined' ? document.body : null
      if (!body) return
      lastTint = color
      if (color === null) body.style.removeProperty('--wp-tint')
      else body.style.setProperty('--wp-tint', color)
      updateAutoText()
    })

    // Cordis 效果钩子：返回的清理函数在插件卸载时自动执行
    ctx.effect?.(() => {
      return () => {
        unsubscribe?.()
        unsubscribe = null
        loadedMediaId = null
        lastTint = null
        lastWallTextDark = null
        themeLabelsCaptured = false
        themeObserver?.disconnect()
        themeObserver = null
        detachTheme()
        stopIntro()
        palette.watch(null, null)
        surface.stop()
        layer.disposeLayer()
        releaseObjectUrl()
      }
    })

    applyAll(state.getSnapshot())
    // 开屏动画：读自己的设置，与壁纸是否启用无关（内部会等开机动画收场）
    startIntro()
  } catch (err) {
    console.warn('[dsh-plugin-wallpaper] init failed; wallpaper disabled', err)
  }
}
