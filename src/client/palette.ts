/**
 * 界面色调跟随背景：对壁纸取样主色，写入 body 上的 --wp-tint 变量，
 * 由 styles.ts 的 color-mix 规则混入透明表面。
 *
 *  - 静态图/动图：加载后取样一次（动图取首帧）
 *  - 视频：loadeddata 首采 + timeupdate 节流采样（默认 ≥2s 一次）
 * 取样在 48x27 的离屏 canvas 上做均值，objectURL 同源无跨域污染。
 */

import { getVideoElement } from './layer'

const SAMPLE_W = 48
const SAMPLE_H = 27
const VIDEO_SAMPLE_INTERVAL_MS = 2000

let canvasCtx: CanvasRenderingContext2D | null = null
let activeUrl: string | null = null
let activeType: 'image' | 'video' | null = null
let imgLoader: HTMLImageElement | null = null
let video: HTMLVideoElement | null = null
let lastSampleAt = 0
let lastColor: string | null = null
let tintSink: ((color: string | null) => void) | null = null

function getCtx(): CanvasRenderingContext2D | null {
  if (canvasCtx) return canvasCtx
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_W
  canvas.height = SAMPLE_H
  canvasCtx = canvas.getContext('2d', { willReadFrequently: true })
  return canvasCtx
}

function emit(color: string | null): void {
  lastColor = color
  tintSink?.(color)
}

/** 注册取色结果接收方；注册时立即补发最近一次结果。 */
export function onTint(sink: (color: string | null) => void): void {
  tintSink = sink
  if (lastColor !== null) sink(lastColor)
}

function computeColor(source: CanvasImageSource): string | null {
  const ctx = getCtx()
  if (!ctx) return null
  try {
    ctx.clearRect(0, 0, SAMPLE_W, SAMPLE_H)
    ctx.drawImage(source, 0, 0, SAMPLE_W, SAMPLE_H)
    const { data } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H)
    let r = 0
    let g = 0
    let b = 0
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]!
      if (a < 128) continue
      r += data[i]!
      g += data[i + 1]!
      b += data[i + 2]!
      count++
    }
    if (count === 0) return null
    return `rgb(${Math.round(r / count)} ${Math.round(g / count)} ${Math.round(b / count)})`
  } catch {
    // 画布被污染等异常时放弃取色，色调跟随保持上次值
    return null
  }
}

function sampleVideo(): void {
  if (!video || video.readyState < 2 || video.videoWidth === 0) return
  emit(computeColor(video))
}

function throttledSampleVideo(): void {
  const now = Date.now()
  if (now - lastSampleAt < VIDEO_SAMPLE_INTERVAL_MS) return
  lastSampleAt = now
  sampleVideo()
}

function detachVideo(): void {
  if (!video) return
  video.removeEventListener('loadeddata', throttledSampleVideo)
  video.removeEventListener('timeupdate', throttledSampleVideo)
  video = null
}

function attachVideo(): void {
  video = getVideoElement()
  if (!video) return
  video.addEventListener('loadeddata', throttledSampleVideo)
  video.addEventListener('timeupdate', throttledSampleVideo)
  if (video.readyState >= 2) sampleVideo()
}

function loadImage(url: string): void {
  if (typeof Image !== 'function') return
  const img = new Image()
  imgLoader = img
  img.onload = () => {
    if (imgLoader === img && activeUrl === url) emit(computeColor(img))
  }
  img.src = url
}

/** 跟随当前媒体切换取样源；url 为空表示清除。 */
export function watch(url: string | null, type: 'image' | 'video' | null): void {
  activeUrl = url
  activeType = type
  imgLoader = null
  detachVideo()
  if (!url || !type) {
    emit(null)
    return
  }
  if (type === 'image') loadImage(url)
  else attachVideo()
}

/** 媒体元素可能晚于 watch 创建（异步加载），由外部在装载完成后重试挂接。 */
export function retryAttach(): void {
  if (activeType === 'video' && activeUrl && !video) attachVideo()
}
