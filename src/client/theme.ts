/**
 * DSH 全局主题桥（浅色 / 深色 / 跟随主题）。
 *
 * DSH 的 ui-theme 插件通过 `ctx.provide('theme', …)` 暴露主题服务：
 *   - `getTheme()` 返回快照，`snapshot.preference` 是 'light' | 'dark' | 'system'
 *   - `setTheme(id)` 是唯一写入口（会持久化并广播 `theme/change`）
 *
 * 本插件只做转发与订阅，不自己存主题状态 —— 保证和 设置 → 通用设置 → 外观
 * 的按钮完全联动（任一处切换，另一处立即同步）。
 */

import type { ClientContext, ThemeLike } from './types'

export type ThemePreference = 'light' | 'dark' | 'system'

/** 三个选项的展示顺序（与官方外观行一致：浅色 / 深色 / 跟随主题）。 */
export const THEME_OPTIONS: ReadonlyArray<ThemePreference> = ['light', 'dark', 'system']

let themeApi: ThemeLike | null = null
let available = false
let detach: (() => void) | null = null
let current: ThemePreference = 'system'
const listeners = new Set<() => void>()

/** 任意值 → 合法偏好（未知值按“跟随主题”处理）。 */
function normalize(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

/** 直接向主题服务要当前偏好（不依赖事件是否到达）。 */
function readPreference(): ThemePreference {
  try {
    const snapshot = themeApi?.getTheme?.()
    if (snapshot && typeof snapshot === 'object' && 'preference' in snapshot) {
      return normalize((snapshot as { preference?: unknown }).preference)
    }
  } catch {
    // 服务不可用时保持上次值
  }
  return current
}

function notify(): void {
  for (const listener of [...listeners]) {
    try {
      listener()
    } catch {
      // 单个订阅方失败不影响其它 UI
    }
  }
}

/** 插件装配时调用：接上主题服务并订阅 `theme/change`。 */
export function attachTheme(ctx: ClientContext): void {
  const api = ctx.theme
  if (!api || typeof api.setTheme !== 'function') {
    available = false
    themeApi = null
    return
  }
  themeApi = api
  available = true
  current = readPreference()
  try {
    const off = ctx.on?.('theme/change', () => {
      current = readPreference()
      notify()
    })
    if (typeof off === 'function') detach = off as () => void
  } catch {
    // 没有事件能力时退化为：每次读取 getTheme()（setTheme 后本地也会 notify）
  }
}

/** 插件卸载时调用。 */
export function detachTheme(): void {
  detach?.()
  detach = null
  themeApi = null
  available = false
  listeners.clear()
}

/** 主题服务是否可用（不可用时设置页不显示这一行）。 */
export function themeAvailable(): boolean {
  return available
}

/** 当前偏好（useSyncExternalStore 的 getSnapshot）。 */
export function getThemePreference(): ThemePreference {
  if (!available) return current
  current = readPreference()
  return current
}

/** 订阅偏好变化（useSyncExternalStore 的 subscribe）。 */
export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 切换主题（写 DSH 主题服务；失败时静默，UI 仍以服务回读为准）。 */
export function setThemePreference(preference: ThemePreference): void {
  if (!THEME_OPTIONS.includes(preference)) return
  current = preference
  try {
    themeApi?.setTheme?.(preference)
  } catch {
    // 比如服务还没就绪：下次读取会回到真实值
  }
  notify()
}
