/**
 * dsh-plugin-wallpaper — 浏览器半侧入口。
 *
 * 由 DSH 客户端模块系统以懒 CJS 工厂加载（window.__ModuleLoader__.load），
 * 激活时由浏览器 Cordis Loader 以插件形式实例化：inject ['slots']。
 *
 * 装配：
 *  - 全局样式（data-plugin 归属标记，停用时被模块系统回收）
 *  - 壁纸层（fixed z-index:-1，位于 AppFrame 之下）
 *  - 透明化引擎（AppFrame 打标 + body 属性/CSS 变量投影，失败进兜底模式）
 *  - 取色（canvas 均值 → --wp-tint，供界面色调跟随）
 *  - 设置面板（settings.section + plugins.detail.section 双插槽）
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

export const name = PLUGIN_PKG
export const inject = ['slots']

let unsubscribe: (() => void) | null = null
let loadedMediaId: string | null = null
/** 最近一次壁纸主色取样（rgb(r g b) 字符串），供自动字色计算。 */
let lastTint: string | null = null

/** 强调色静态令牌：主色调跟随需要在覆盖它们之前留下原值，否则 color-mix 会形成循环引用。 */
const ACCENT_KEYS = ['--dsw-static-blue-400', '--dsw-static-blue-500', '--dsw-static-blue-600', '--dsw-static-deepseek-450'] as const

function captureAccents(): void {
  if (typeof document === 'undefined') return
  const body = document.body
  if (!body || body.dataset.wpAccentCaptured === '1') return
  for (const key of ACCENT_KEYS) {
    const value = getComputedStyle(body).getPropertyValue(key).trim()
    if (value) body.style.setProperty(`${key.replace('--dsw-static-', '--wp-accent-base-')}`, value)
  }
  body.dataset.wpAccentCaptured = '1'
}

let lastAutoTextDark = false

/** 由"壁纸主色 + 玻璃叠层"的有效表面亮度选择字体颜色：亮表面配深字，暗表面配浅字。
    带滞回（进入深字/浅字阈值不同），避免视频壁纸播放时文字颜色来回抖动。 */
function updateAutoText(): void {
  const body = typeof document !== 'undefined' ? document.body : null
  if (!body) return
  const s = state.getSnapshot()
  if (s.textColorMode !== 'auto' || lastTint === null) {
    body.style.removeProperty('--wp-text-color-auto')
    return
  }
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(lastTint)
  if (!m) return
  const wall: [number, number, number] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
  // 玻璃色：色调跟随开启时带壁纸色相，否则近白（与 styles.ts 的 --wp-glass-tint 一致）
  const glassTint: [number, number, number] = s.tintFollow ? mix(wall, [255, 255, 255], s.tintStrength / 100) : [255, 255, 255]
  // 面板玻璃复合不透明度（实测：cards 不透明度 × 1.2 ≈ 玻璃釉面 alpha，上限 0.92）
  const glassAlpha = Math.min(0.92, (s.opacity.cards / 100) * 1.2)
  const effective = mix(wall, glassTint, glassAlpha)
  const lin = (c: number): number => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * lin(effective[0]) + 0.7152 * lin(effective[1]) + 0.0722 * lin(effective[2])
  if (luminance > 0.3) lastAutoTextDark = true
  else if (luminance < 0.22) lastAutoTextDark = false
  body.style.setProperty('--wp-text-color-current', lastAutoTextDark ? '#1b1c22' : '#f5f6f7')
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

export function apply(ctx: ClientContext): void {
  try {
    injectStyles()
    layer.ensureLayer()
    surface.start()
    captureAccents()

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
        palette.watch(null, null)
        surface.stop()
        layer.disposeLayer()
        releaseObjectUrl()
      }
    })

    applyAll(state.getSnapshot())
  } catch (err) {
    console.warn('[dsh-plugin-wallpaper] init failed; wallpaper disabled', err)
  }
}
