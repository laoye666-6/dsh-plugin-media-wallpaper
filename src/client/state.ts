/**
 * 设置状态：订阅式 store + localStorage 持久化。
 * 纯客户端架构（用户已确认）：全部设置保存在浏览器本地。
 */

export type FillMode = 'cover' | 'contain' | 'fill' | 'tile'
export type MediaType = 'image' | 'video'
/** 表面质感：无 / 毛玻璃 / 液态玻璃（作用于侧栏、主内容、右栏的打标列） */
export type SurfaceFinish = 'none' | 'frosted' | 'liquid'

/** 逐组件透明开关（对应 AppFrame 各列与卡片面板 token）。 */
export interface TransparencyToggles {
  /** 侧栏（ui-layout sidebarCol，含折叠后的控制栏） */
  sidebar: boolean
  /** 顶栏（Windows 标题栏拖拽条 / frame chrome 行） */
  topbar: boolean
  /** 主内容列（centerCol，会话区域直接透出壁纸） */
  main: boolean
  /** 右栏（rightbarCol） */
  rightbar: boolean
  /** 卡片面板（--dsw-alias-bg-layer-1/2/3 消费方，含设置卡、输入区等） */
  cards: boolean
  /** 插件卡片（插件管理页的插件卡，独立于卡片面板） */
  plugins: boolean
  /** 输入栏（composer 输入框卡，独立于卡片面板） */
  composer: boolean
}

/** 逐组件表面不透明度（0=完全透明，100=完全不透明），键与 TransparencyToggles 一致。 */
export interface ComponentOpacities {
  sidebar: number
  topbar: number
  main: number
  rightbar: number
  cards: number
  plugins: number
  composer: number
}

export interface WallpaperSettings {
  /** 总开关；无壁纸媒体时整体视为未激活 */
  enabled: boolean
  /** IndexedDB 中的媒体 id */
  mediaId: string | null
  mediaType: MediaType | null
  /** 展示用：格式识别结果（GIF/APNG/动图 WebP/PNG/JPEG/MP4/WebM） */
  formatLabel: string | null
  mediaName: string | null
  fit: FillMode
  /** 高斯模糊半径 px（0–40） */
  blur: number
  /** 亮度百分比（20–200，100 为原亮度） */
  brightness: number
  /** 压暗百分比（0–90） */
  dim: number
  /** 界面色调跟随背景 */
  tintFollow: boolean
  /** 色调混入强度百分比（0–50） */
  tintStrength: number
  /** 表面质感 */
  finish: SurfaceFinish
  /** 玻璃模糊强度 px（4–30，毛玻璃/液态玻璃共用） */
  frostStrength: number
  /** 自定义字体颜色（覆盖官方 label 令牌） */
  /** 字体颜色模式：关 / 自动跟随背景亮度 / 自定义颜色 */
  textColorMode: 'off' | 'auto' | 'custom'
  /** 自定义模式下的字体颜色 */
  textColor: string
  /** 主色调跟随背景（把壁纸主色混入官方强调色） */
  accentAuto: boolean
  /** 逐组件透明开关 */
  transparent: TransparencyToggles
  /** 逐组件表面不透明度（开关开启时生效） */
  opacity: ComponentOpacities
}

export const DEFAULT_SETTINGS: WallpaperSettings = {
  enabled: false,
  mediaId: null,
  mediaType: null,
  formatLabel: null,
  mediaName: null,
  fit: 'cover',
  blur: 0,
  brightness: 100,
  dim: 25,
  tintFollow: false,
  tintStrength: 18,
  finish: 'frosted',
  frostStrength: 14,
  textColorMode: 'off',
  textColor: '#f5f6f7',
  accentAuto: false,
  transparent: {
    sidebar: true,
    topbar: true,
    main: true,
    rightbar: true,
    cards: true,
    plugins: true,
    composer: true,
  },
  opacity: {
    sidebar: 70,
    topbar: 70,
    main: 0,
    rightbar: 0,
    cards: 70,
    plugins: 50,
    composer: 30,
  },
}

const STORAGE_KEY = 'dsh-plugin-media-wallpaper.settings.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** 宽松合并：容忍旧版本/损坏数据，缺失字段回落默认值。 */
function revive(raw: unknown): WallpaperSettings {
  const base: WallpaperSettings = { ...DEFAULT_SETTINGS, transparent: { ...DEFAULT_SETTINGS.transparent } }
  if (!isRecord(raw)) return base
  const num = (v: unknown, fallback: number, min: number, max: number): number =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
  const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)
  const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null)

  base.enabled = bool(raw.enabled, base.enabled)
  base.mediaId = str(raw.mediaId)
  base.mediaType = raw.mediaType === 'image' || raw.mediaType === 'video' ? raw.mediaType : null
  base.formatLabel = str(raw.formatLabel)
  base.mediaName = str(raw.mediaName)
  if (raw.fit === 'cover' || raw.fit === 'contain' || raw.fit === 'fill' || raw.fit === 'tile') base.fit = raw.fit
  base.blur = num(raw.blur, base.blur, 0, 40)
  base.brightness = num(raw.brightness, base.brightness, 20, 200)
  base.dim = num(raw.dim, base.dim, 0, 90)
  base.tintFollow = bool(raw.tintFollow, base.tintFollow)
  base.tintStrength = num(raw.tintStrength, base.tintStrength, 0, 50)
  base.finish = raw.finish === 'frosted' || raw.finish === 'liquid' || raw.finish === 'none' ? raw.finish : base.finish
  base.frostStrength = num(raw.frostStrength, base.frostStrength, 4, 30)
  base.textColorMode =
    raw.textColorMode === 'off' || raw.textColorMode === 'auto' || raw.textColorMode === 'custom'
      ? raw.textColorMode
      : bool(raw.textColorOn, false)
        ? 'auto'
        : 'off'
  base.textColor = typeof raw.textColor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(raw.textColor) ? raw.textColor : base.textColor
  base.accentAuto = bool(raw.accentAuto, base.accentAuto)
  if (isRecord(raw.transparent)) {
    base.transparent.sidebar = bool(raw.transparent.sidebar, base.transparent.sidebar)
    base.transparent.topbar = bool(raw.transparent.topbar, base.transparent.topbar)
    base.transparent.main = bool(raw.transparent.main, base.transparent.main)
    base.transparent.rightbar = bool(raw.transparent.rightbar, base.transparent.rightbar)
    base.transparent.cards = bool(raw.transparent.cards, base.transparent.cards)
    base.transparent.plugins = bool(raw.transparent.plugins, base.transparent.plugins)
    base.transparent.composer = bool(raw.transparent.composer, base.transparent.composer)
  }
  if (isRecord(raw.opacity)) {
    base.opacity.sidebar = num(raw.opacity.sidebar, base.opacity.sidebar, 0, 100)
    base.opacity.topbar = num(raw.opacity.topbar, base.opacity.topbar, 0, 100)
    base.opacity.main = num(raw.opacity.main, base.opacity.main, 0, 100)
    base.opacity.rightbar = num(raw.opacity.rightbar, base.opacity.rightbar, 0, 100)
    base.opacity.cards = num(raw.opacity.cards, base.opacity.cards, 0, 100)
    base.opacity.plugins = num(raw.opacity.plugins, base.opacity.plugins, 0, 100)
    base.opacity.composer = num(raw.opacity.composer, base.opacity.composer, 0, 100)
  } else if (typeof raw.surfaceOpacity === 'number') {
    // 旧版迁移：单一表面不透明度 → 各组件各自继承
    const legacy = num(raw.surfaceOpacity, 70, 0, 100)
    base.opacity = { sidebar: legacy, topbar: legacy, main: legacy, rightbar: legacy, cards: legacy, plugins: legacy, composer: legacy }
  }
  return base
}

function load(): WallpaperSettings {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    return revive(raw ? JSON.parse(raw) : undefined)
  } catch {
    return { ...DEFAULT_SETTINGS, transparent: { ...DEFAULT_SETTINGS.transparent } }
  }
}

type Listener = () => void

let current: WallpaperSettings | null = null
const listeners = new Set<Listener>()

/** 订阅式快照（配 React useSyncExternalStore）。 */
export function getSnapshot(): WallpaperSettings {
  if (current === null) current = load()
  return current
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function set(partial: Partial<WallpaperSettings>): void {
  const next = { ...getSnapshot(), ...partial }
  // 引用稳定：transparent 未变时保留原引用，避免无谓的重渲染
  if (!partial.transparent) next.transparent = current?.transparent ?? next.transparent
  current = next
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 存储不可用（隐私模式等）时设置仍在本会话内生效
  }
  for (const listener of listeners) listener()
}

export function setTransparency(partial: Partial<TransparencyToggles>): void {
  set({ transparent: { ...getSnapshot().transparent, ...partial } })
}

/** 不变更数据、仅触发一次订阅通知（异步装载媒体后刷新 UI 用）。 */
export function notify(): void {
  for (const listener of listeners) listener()
}

/** 修改某几个组件的表面不透明度。 */
export function setOpacity(partial: Partial<ComponentOpacities>): void {
  set({ opacity: { ...getSnapshot().opacity, ...partial } })
}

export function resetAll(): void {
  set({ ...DEFAULT_SETTINGS, transparent: { ...DEFAULT_SETTINGS.transparent } })
}

/** 无媒体时整体视为未激活。 */
export function isActive(s: WallpaperSettings = getSnapshot()): boolean {
  return s.enabled && s.mediaId !== null && s.mediaType !== null
}
