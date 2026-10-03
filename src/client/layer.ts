/**
 * 壁纸层：一个 z-index:-1 的 fixed 容器，位于 body 直接子级、AppFrame 之下。
 *
 *   <div data-wp-layer>            position:fixed; inset:0; z-index:-1; pointer-events:none
 *     <div data-wp-media>          承载背景图（CSS background）或 <video>；blur/brightness 作用于此
 *     <div data-wp-dim>            压暗叠层（rgba 黑，opacity 由设置驱动）
 *   </div>
 *
 * 层内元素均带 data-plugin 标记（与客户端模块系统的样式/资源归属约定一致）。
 */

import type { FillMode, WallpaperSettings } from './state'
import { isActive } from './state'
import { PLUGIN_PKG } from './identity'

export const LAYER_PLUGIN_ID = PLUGIN_PKG

let layer: HTMLDivElement | null = null
let media: HTMLDivElement | null = null
let dim: HTMLDivElement | null = null
let videoEl: HTMLVideoElement | null = null
let mediaUrl: string | null = null
let mediaType: 'image' | 'video' | null = null

function ensureElement(tag: string, attr: string): HTMLElement {
  const el = document.createElement(tag)
  el.setAttribute(attr, '')
  el.setAttribute('data-plugin', LAYER_PLUGIN_ID)
  return el
}

export function ensureLayer(): HTMLDivElement {
  if (layer && layer.isConnected) return layer
  layer = ensureElement('div', 'data-wp-layer') as HTMLDivElement
  media = ensureElement('div', 'data-wp-media') as HTMLDivElement
  dim = ensureElement('div', 'data-wp-dim') as HTMLDivElement
  layer.append(media, dim)
  ;(document.body ?? document.documentElement).appendChild(layer)
  return layer
}

export function disposeLayer(): void {
  videoEl = null
  mediaUrl = null
  mediaType = null
  layer?.remove()
  layer = null
  media = null
  dim = null
}

function imageBackgroundStyle(fit: FillMode): string {
  switch (fit) {
    case 'contain':
      return 'no-repeat center / contain'
    case 'fill':
      return 'no-repeat center / 100% 100%'
    case 'tile':
      return 'repeat top left / auto'
    case 'cover':
    default:
      return 'no-repeat center / cover'
  }
}

function videoObjectFit(fit: FillMode): string {
  // <video> 无法平铺，tile 按 cover 处理
  return fit === 'contain' ? 'contain' : fit === 'fill' ? 'fill' : 'cover'
}

/** 当前媒体为视频时返回元素（供取色模块采样）。 */
export function getVideoElement(): HTMLVideoElement | null {
  return videoEl
}

/** 替换媒体内容：图片走 CSS background（GIF/APNG/动图 WebP 原生播放），视频走 <video>。 */
export function setMedia(url: string | null, type: 'image' | 'video' | null): void {
  ensureLayer()
  if (!media) return
  videoEl?.remove()
  videoEl = null
  mediaUrl = url
  mediaType = type
  media.style.background = ''
  media.style.filter = ''
  media.style.transform = ''
  if (!url || !type) return

  if (type === 'image') return
  const video = document.createElement('video')
  video.setAttribute('data-plugin', LAYER_PLUGIN_ID)
  video.src = url
  video.muted = true
  video.loop = true
  video.autoplay = true
  video.setAttribute('playsinline', '')
  video.setAttribute('aria-hidden', 'true')
  video.style.width = '100%'
  video.style.height = '100%'
  video.style.display = 'block'
  media.appendChild(video)
  videoEl = video
  void video.play().catch(() => {
    // 自动播放被拒绝时静默：用户交互后 <video> 仍可播放并驱动取色采样
  })
}

/** 把设置投影到层上。 */
export function updateLayer(s: WallpaperSettings): void {
  const l = ensureLayer()
  if (!media || !dim) return
  const active = isActive(s)

  l.style.display = active ? '' : 'none'
  if (!active || !mediaType) return

  // 模糊 + 亮度只作用于媒体层，与界面 token 完全解耦；模糊时轻微放大避免边缘露底
  const blurPx = Math.max(0, Math.min(40, s.blur))
  const brightness = Math.max(0.2, Math.min(2, s.brightness / 100))
  media.style.filter = `blur(${blurPx}px) brightness(${brightness})`
  const scale = 1 + Math.min(blurPx, 30) / 200
  media.style.transform = blurPx > 0 ? `scale(${scale.toFixed(3)})` : ''

  dim.style.opacity = String(Math.max(0, Math.min(90, s.dim)) / 100)

  if (mediaType === 'image' && mediaUrl) {
    media.style.background = `url("${mediaUrl}") ${imageBackgroundStyle(s.fit)}`
  }
  if (videoEl) {
    videoEl.style.objectFit = videoObjectFit(s.fit)
  }
}
