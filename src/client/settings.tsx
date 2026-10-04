/**
 * 设置面板：同一组件注册到两个官方插槽——
 *  - settings.section        侧栏 → 设置 → 「壁纸」分区
 *  - plugins.detail.section  插件管理 → 本插件详情页（subject 过滤）
 *
 * 刻意不依赖 locale 服务与标准 hooks（降低 API 差异风险），
 * 文案按 html.lang 内置 zh-CN / en 两套。
 */

import { useState, useSyncExternalStore, useRef } from 'react'
import type { ReactNode, ChangeEvent } from 'react'
import type { SlotComponentProps, ClientContext } from './types'
import { PLUGIN_PKG, PLUGIN_VERSION } from './identity'
import { PRESETS } from './presets-data.gen'
import * as state from './state'
import { ACCEPT_ATTR, detectFormat } from './format'
import { putMedia, deleteMedia, currentObjectUrl } from './storage'
import { fetchPresetMedia } from './presets'
import type { PresetProgress } from './presets'

const STR = {
  zh: {
    title: '壁纸',
    enabled: '启用壁纸背景',
    pick: '选择图片 / 视频',
    presets: '预置壁纸',
    download: '下载',
    copyLink: '复制链接',
    copied: '已复制 ✓',
    presetsHint: '一键应用由插件自动完成下载、合并与解压；也可手动下载留档',
    apply: '一键应用',
    applying: '处理中…',
    manualDownload: '手动下载',
    applyFailed: '应用失败：',
    picked: '当前壁纸',
    none: '未设置（支持 GIF / APNG / 动图 WebP / PNG / JPEG / MP4 / WebM）',
    clear: '清除壁纸',
    reset: '恢复默认',
    fill: '填充方式',
    fillCover: '填满（裁剪）',
    fillContain: '适应（完整显示）',
    fillFill: '拉伸',
    fillTile: '平铺',
    blur: '高斯模糊',
    brightness: '亮度',
    dim: '压暗',
    tint: '界面色调跟随背景',
    tintStrength: '色调强度',
    finish: '表面质感',
    finishNone: '无',
    finishFrosted: '毛玻璃',
    finishLiquid: '液态玻璃',
    frostStrength: '玻璃强度',
    textColor: '字体颜色',
    textModeOff: '关',
    textModeAuto: '自动',
    textModeCustom: '自定义',
    textColorPick: '选择颜色',
    accentAuto: '主色调跟随背景',
    finishHint: '作用于输入框、新对话与设置面板等前景 UI；背景模糊请用高斯模糊滑杆',
    opacityHint: '开关控制该区域是否透出壁纸，滑杆单独调节各自的不透明度',
    opaque: '不透明',
    transparency: '组件透明化',
    tSidebar: '侧栏',
    tTopbar: '顶栏 / 标题栏',
    tMain: '主内容区',
    tRightbar: '右栏',
    tCards: '卡片与面板',
    surfaceOpacity: '表面不透明度',
    videoTileNote: '视频平铺不支持，将按「填满」处理',
    unsupported: '不支持的文件格式：',
    loadFailed: '壁纸读取失败（浏览器存储可能已被清理）',
    needEnable: '选择壁纸后自动启用',
  },
  en: {
    title: 'Wallpaper',
    enabled: 'Enable wallpaper background',
    pick: 'Choose image / video',
    presets: 'Preset wallpapers',
    download: 'Download',
    copyLink: 'Copy link',
    copied: 'Copied ✓',
    presetsHint: 'One-click applies downloads, merges and extracts automatically; manual download is also available',
    apply: 'Apply',
    applying: 'Working…',
    manualDownload: 'Manual download',
    applyFailed: 'Apply failed: ',
    picked: 'Current wallpaper',
    none: 'Not set (GIF / APNG / animated WebP / PNG / JPEG / MP4 / WebM)',
    clear: 'Clear wallpaper',
    reset: 'Reset to defaults',
    fill: 'Fill mode',
    fillCover: 'Cover (crop)',
    fillContain: 'Contain (fit)',
    fillFill: 'Stretch',
    fillTile: 'Tile',
    blur: 'Gaussian blur',
    brightness: 'Brightness',
    dim: 'Dim',
    tint: 'Tint UI with background color',
    tintStrength: 'Tint strength',
    finish: 'Surface finish',
    finishNone: 'None',
    finishFrosted: 'Frosted glass',
    finishLiquid: 'Liquid glass',
    frostStrength: 'Glass strength',
    textColor: 'Text color',
    textModeOff: 'Off',
    textModeAuto: 'Auto',
    textModeCustom: 'Custom',
    textColorPick: 'Pick color',
    accentAuto: 'Accent follows background',
    finishHint: 'Applies to composer, hero and settings panels; use Gaussian blur for the background',
    opacityHint: 'Toggle whether a region shows the wallpaper; each slider adjusts its own opacity',
    opaque: 'Opaque',
    transparency: 'Component transparency',
    tSidebar: 'Sidebar',
    tTopbar: 'Top bar / title bar',
    tMain: 'Main content',
    tRightbar: 'Right bar',
    tCards: 'Cards & panels',
    surfaceOpacity: 'Surface opacity',
    videoTileNote: 'Tiling is unavailable for video; falls back to cover',
    unsupported: 'Unsupported file format: ',
    loadFailed: 'Failed to load wallpaper (browser storage may have been cleared)',
    needEnable: 'Picking a wallpaper enables it automatically',
  },
} as const

type Strings = Record<keyof (typeof STR)['zh'], string>

function useStrings(): Strings {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'en'
  return lang.toLowerCase().startsWith('zh') ? STR.zh : STR.en
}

async function onPickFile(e: ChangeEvent<HTMLInputElement>, onError: (msg: string) => void): Promise<void> {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  try {
    const head = new Uint8Array(await file.slice(0, 65536).arrayBuffer())
    const det = detectFormat(head)
    if (!det) {
      onError(file.name)
      return
    }
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `wp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    const prev = state.getSnapshot().mediaId
    await putMedia({ id, blob: file, mime: det.mime, name: file.name, addedAt: Date.now() })
    if (prev && prev !== id) void deleteMedia(prev)
    state.set({ mediaId: id, mediaType: det.kind, formatLabel: det.label, mediaName: file.name, enabled: true })
  } catch (err) {
    console.warn('[dsh-plugin-wallpaper] pick failed', err)
  }
}

function onClear(): void {
  const prev = state.getSnapshot().mediaId
  if (prev) void deleteMedia(prev)
  state.set({ enabled: false, mediaId: null, mediaType: null, formatLabel: null, mediaName: null })
}

/** 诊断行：截图排查用。展示打标状态、实际解析出的列背景与全局填充值。 */
function Diagnostics(): ReactNode {
  const s = useSyncExternalStore(state.subscribe, state.getSnapshot)
  const active = state.isActive(s)
  let diag = '—'
  try {
    const q = (sel: string): boolean => document.querySelector(sel) !== null
    const col = document.querySelector('[data-wp-sidebar]') ?? document.querySelector('[data-rightbar-col]')
    const bg = col ? getComputedStyle(col).backgroundColor : 'n/a'
    const fill = getComputedStyle(document.body).getPropertyValue('--dsw-specific-sidebar-fill').trim()
    const fallback = document.body.hasAttribute('data-wp-fallback')
    diag = `frame:${q('[data-wp-frame]') ? '✓' : '✗'} sidebar:${q('[data-wp-sidebar]') ? '✓' : '✗'} center:${q('[data-wp-center]') ? '✓' : '✗'} fallback:${fallback ? '✓' : '✗'} · bg=${bg} · fill=${fill.slice(0, 60) || '∅'}`
  } catch {
    diag = 'unavailable'
  }
  return <div className="wp-hint">v{PLUGIN_VERSION} · active:{active ? '1' : '0'} · {diag}</div>
}

export function WallpaperSection(): ReactNode {
  const s = useSyncExternalStore(state.subscribe, state.getSnapshot)
  const t = useStrings()
  const [error, setError] = useState('')
  const [applying, setApplying] = useState('')
  const [progress, setProgress] = useState<PresetProgress | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const hasMedia = s.mediaId !== null
  const thumb = hasMedia ? currentObjectUrl() : null

  /** 一键应用：下载 → 合并分卷 → 解压 → 写入媒体库 → 立即生效。 */
  async function applyPreset(p: (typeof PRESETS)[number]): Promise<void> {
    if (applying) return
    setError('')
    setApplying(p.id)
    setProgress({ phase: 'downloading', ratio: 0 })
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const { blob, fileName } = await fetchPresetMedia(p, setProgress, controller.signal)
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `wp-${Date.now().toString(36)}`
      const prev = state.getSnapshot().mediaId
      await putMedia({ id, blob, mime: p.mime, name: fileName, addedAt: Date.now() })
      if (prev && prev !== id) void deleteMedia(prev)
      state.set({
        mediaId: id,
        mediaType: p.kind,
        formatLabel: p.mime === 'image/jpeg' ? 'JPEG' : 'MP4',
        mediaName: p.name,
        enabled: true,
      })
      setProgress({ phase: 'done', ratio: 1 })
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(String(err instanceof Error ? err.message : err))
      }
    } finally {
      setApplying('')
      abortRef.current = null
      setTimeout(() => setProgress(null), 1200)
    }
  }

  return (
    <section className="wp-section">
      <div className="wp-card">
        <div className="wp-row">
          <div className="wp-row-main">
            <span className="wp-title">{t.title}</span>
            {!hasMedia && <span className="wp-hint">{t.needEnable}</span>}
          </div>
          <label className="wp-check">
            <input
              type="checkbox"
              checked={s.enabled}
              onChange={(e) => state.set({ enabled: e.target.checked })}
            />
            <span>{t.enabled}</span>
          </label>
        </div>

        <div className="wp-row">
          <div className="wp-row-main">
            <span>{t.picked}</span>
            <span className="wp-hint">
              {s.mediaName ?? t.none}
              {s.formatLabel ? <span className="wp-badge"> {s.formatLabel}</span> : null}
            </span>
          </div>
          <label className="wp-btn">
            {t.pick}
            <input
              type="file"
              accept={ACCEPT_ATTR}
              style={{ display: 'none' }}
              onChange={(e) => {
                setError('')
                void onPickFile(e, setError)
              }}
            />
          </label>
        </div>

        {thumb ? <div className="wp-thumb" style={{ backgroundImage: `url("${thumb}")` }} /> : null}
        {error ? <span className="wp-error">{t.unsupported}{error}</span> : null}

        {PRESETS.length > 0 ? (
          <div className="wp-card">
            <span className="wp-title">{t.presets}</span>
            <div className="wp-presets">
              {PRESETS.map((p) => (
                <div className="wp-preset" key={p.id}>
                  <img className="wp-preset-thumb" src={p.thumb} alt={p.name} />
                  <span className="wp-preset-name" title={p.name}>{p.name}</span>
                  <span className="wp-preset-size">{p.kind === 'video' ? '▶ ' : ''}{p.sizeLabel}</span>
                  <button
                    type="button"
                    className="wp-btn wp-preset-apply"
                    disabled={applying !== ''}
                    onClick={() => void applyPreset(p)}
                  >
                    {applying === p.id ? t.applying : t.apply}
                  </button>
                  {applying === p.id && progress ? (
                    <div className="wp-progress">
                      <div className="wp-progress-bar" style={{ width: `${Math.round(progress.ratio * 100)}%` }} />
                      <span className="wp-progress-text">
                        {progress.phase === 'downloading' ? `${Math.round(progress.ratio * 100)}%` : ''}
                        {progress.detail ? ` ${progress.detail}` : ''}
                      </span>
                    </div>
                  ) : null}
                  <details className="wp-preset-manual">
                    <summary className="wp-preset-manual-summary">{t.manualDownload}</summary>
                    <div className="wp-preset-actions">
                      {p.downloads.map((d) => (
                        <div className="wp-preset-dl" key={d.label}>
                          <span className="wp-preset-dl-label">{d.label}</span>
                          <button type="button" className="wp-mini-btn" onClick={() => window.open(d.github, '_blank')}>
                            GitHub
                          </button>
                          <button type="button" className="wp-mini-btn" onClick={() => window.open(d.cdn, '_blank')}>
                            国内
                          </button>
                        </div>
                      ))}
                    </div>
                    {p.hint ? <div className="wp-hint">{p.hint}</div> : null}
                  </details>
                </div>
              ))}
            </div>
            <div className="wp-hint">{t.presetsHint}</div>
          </div>
        ) : null}

        <div className="wp-row">
          <span>{t.fill}</span>
          <select
            className="wp-select"
            value={s.fit}
            onChange={(e) => state.set({ fit: e.target.value as state.FillMode })}
          >
            <option value="cover">{t.fillCover}</option>
            <option value="contain">{t.fillContain}</option>
            <option value="fill">{t.fillFill}</option>
            <option value="tile">{t.fillTile}{s.mediaType === 'video' ? ' *' : ''}</option>
          </select>
        </div>
        {s.mediaType === 'video' && s.fit === 'tile' ? <span className="wp-hint">{t.videoTileNote}</span> : null}

        <div className="wp-range-row">
          <span>{t.blur}</span>
          <input
            className="wp-range"
            type="range"
            min={0}
            max={40}
            step={1}
            value={s.blur}
            onChange={(e) => state.set({ blur: Number(e.target.value) })}
          />
          <span className="wp-value">{s.blur}px</span>
        </div>

        <div className="wp-range-row">
          <span>{t.brightness}</span>
          <input
            className="wp-range"
            type="range"
            min={20}
            max={200}
            step={5}
            value={s.brightness}
            onChange={(e) => state.set({ brightness: Number(e.target.value) })}
          />
          <span className="wp-value">{s.brightness}%</span>
        </div>

        <div className="wp-range-row">
          <span>{t.dim}</span>
          <input
            className="wp-range"
            type="range"
            min={0}
            max={90}
            step={5}
            value={s.dim}
            onChange={(e) => state.set({ dim: Number(e.target.value) })}
          />
          <span className="wp-value">{s.dim}%</span>
        </div>

        <div className="wp-row">
          <label className="wp-check">
            <input
              type="checkbox"
              checked={s.tintFollow}
              onChange={(e) => state.set({ tintFollow: e.target.checked })}
            />
            <span>{t.tint}</span>
          </label>
        </div>
        {s.tintFollow ? (
          <div className="wp-range-row">
            <span>{t.tintStrength}</span>
            <input
              className="wp-range"
              type="range"
              min={0}
              max={50}
              step={1}
              value={s.tintStrength}
              onChange={(e) => state.set({ tintStrength: Number(e.target.value) })}
            />
            <span className="wp-value">{s.tintStrength}%</span>
          </div>
        ) : null}

        <div className="wp-row">
          <span>{t.finish}</span>
          <div className="wp-seg" role="radiogroup" aria-label={t.finish}>
            {(
              [
                ['none', t.finishNone],
                ['frosted', t.finishFrosted],
                ['liquid', t.finishLiquid],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                className="wp-seg-btn"
                data-active={s.finish === v ? '1' : '0'}
                onClick={() => state.set({ finish: v })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {s.finish !== 'none' ? (
          <>
            <div className="wp-range-row">
              <span>{t.frostStrength}</span>
              <input
                className="wp-range"
                type="range"
                min={4}
                max={30}
                step={2}
                value={s.frostStrength}
                onChange={(e) => state.set({ frostStrength: Number(e.target.value) })}
              />
              <span className="wp-value">{s.frostStrength}px</span>
            </div>
            <div className="wp-hint">{t.finishHint}</div>
          </>
        ) : null}

        <div className="wp-row">
          <span>{t.textColor}</span>
          <div className="wp-seg" role="radiogroup" aria-label={t.textColor}>
            {(
              [
                ['off', t.textModeOff],
                ['auto', t.textModeAuto],
                ['custom', t.textModeCustom],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                className="wp-seg-btn"
                data-active={s.textColorMode === m ? '1' : '0'}
                onClick={() => state.set({ textColorMode: m })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {s.textColorMode === 'custom' ? (
          <div className="wp-row">
            <span>{t.textColorPick}</span>
            <input
              type="color"
              className="wp-color"
              value={s.textColor}
              onChange={(e) => state.set({ textColor: e.target.value })}
            />
          </div>
        ) : null}
        <div className="wp-row">
          <label className="wp-check">
            <input
              type="checkbox"
              checked={s.accentAuto}
              onChange={(e) => state.set({ accentAuto: e.target.checked })}
            />
            <span>{t.accentAuto}</span>
          </label>
        </div>
      </div>

      <div className="wp-card">
        <span className="wp-title">{t.transparency}</span>
        <div className="wp-hint">{t.opacityHint}</div>
        {(
          [
            ['sidebar', t.tSidebar],
            ['topbar', t.tTopbar],
            ['main', t.tMain],
            ['rightbar', t.tRightbar],
            ['cards', t.tCards],
          ] as const
        ).map(([key, label]) => (
          <div className="wp-row" key={key}>
            <label className="wp-check">
              <input
                type="checkbox"
                checked={s.transparent[key]}
                onChange={(e) => state.setTransparency({ [key]: e.target.checked })}
              />
              <span>{label}</span>
            </label>
            <input
              className="wp-range"
              style={{ maxWidth: 150 }}
              type="range"
              min={0}
              max={100}
              step={5}
              value={s.opacity[key]}
              onChange={(e) => state.setOpacity({ [key]: Number(e.target.value) })}
            />
            <span className="wp-value" style={{ width: 40, textAlign: 'right' }}>
              {s.transparent[key] ? `${s.opacity[key]}%` : t.opaque}
            </span>
          </div>
        ))}
      </div>

      <div className="wp-row">
        <button type="button" className="wp-btn wp-btn-danger" onClick={onClear}>
          {t.clear}
        </button>
        <button type="button" className="wp-btn" onClick={() => state.resetAll()}>
          {t.reset}
        </button>
      </div>

      <Diagnostics />
    </section>
  )
}

/** 导航标签：语言跟随 thunk（设置外壳经 resolveSlotLabel 解析）。 */
const sectionLabel = (): string =>
  typeof document !== 'undefined' && document.documentElement.lang.toLowerCase().startsWith('zh')
    ? '壁纸'
    : 'Wallpaper'

/** 注册双插槽入口；任一失败不影响另一处与壁纸主功能。 */
export function registerSettingsSlots(ctx: ClientContext): void {
  const slots = ctx.slots
  if (!slots?.inject || !slots?.register) {
    console.warn('[dsh-plugin-wallpaper] ctx.slots unavailable; settings UI skipped')
    return
  }
  try {
    slots.inject('settings.section', () =>
      slots.register?.({ name: 'settings.section', id: PLUGIN_PKG, order: 860, label: sectionLabel }, WallpaperSection),
    )
  } catch (err) {
    console.warn('[dsh-plugin-wallpaper] settings.section registration failed', err)
  }
  try {
    slots.inject('plugins.detail.section', () =>
      slots.register?.(
        { name: 'plugins.detail.section', id: PLUGIN_PKG, order: 60, label: sectionLabel },
        (props: SlotComponentProps) =>
          props?.subject?.kind === 'bundle' && props.subject.pkg === PLUGIN_PKG ? (
            <WallpaperSection />
          ) : null,
      ),
    )
  } catch (err) {
    console.warn('[dsh-plugin-wallpaper] plugins.detail.section registration failed', err)
  }
}
