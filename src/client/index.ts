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

    unsubscribe = state.subscribe(() => applyAll(state.getSnapshot()))

    registerSettingsSlots(ctx)

    palette.onTint((color) => {
      const body = typeof document !== 'undefined' ? document.body : null
      if (!body) return
      if (color === null) body.style.removeProperty('--wp-tint')
      else body.style.setProperty('--wp-tint', color)
    })

    // Cordis 效果钩子：返回的清理函数在插件卸载时自动执行
    ctx.effect?.(() => {
      return () => {
        unsubscribe?.()
        unsubscribe = null
        loadedMediaId = null
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
