/**
 * 全局样式注入。
 *
 * 样式归属约定（0.2.x client-modules，2026-09-30 起）：插件工厂注入的
 * <style> 必须携带 data-plugin="<包名>"，插件停用时由模块系统回收。
 *
 * 透明化只走官方语义 token（web-styling 所有权规则），并全部限定在
 * body[data-wp-active] 作用域内——插件未激活时不产生任何影响。
 * !important 用于压过 theme-presenter 写在 body 上的内联 token。
 */

import { PLUGIN_PKG } from './identity'

export const STYLE_PLUGIN_ID = PLUGIN_PKG

export const GLOBAL_CSS = /* css */ `
/* ===== 壁纸层 ===== */
[data-wp-layer] {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
[data-wp-media] {
  position: absolute;
  inset: 0;
  background-position: center;
  background-repeat: no-repeat;
}
[data-wp-dim] {
  position: absolute;
  inset: 0;
  background: #000;
  opacity: 0;
}

/* ===== 每组件透明化 =====
   AppFrame（packages/client/ui-layout）：
   - .frame / .centerCol / .rightbarCol / .bottomRow 消费 --dsw-alias-bg-base
   - .sidebarCol 与 Windows 标题栏条消费 --dsw-specific-sidebar-fill
   壁纸激活时 frame 永远放行；各列由 data-wp-t-* 开关逐个放行。 */

body[data-wp-active] {
  --wp-op: 70;
  --wp-tint-mix: 0%;
  --wp-tint: transparent;
  /* 侧栏填充与背景基底的原始静态值按主题冻结（design-platform.css）：
     sidebar-fill: light=neutral-bluish-50 / dark=neutral-bluish-900
     bg-base:      light=neutral-bluish-00 / dark=neutral-bluish-950
     不能直接引用被重定义的 token 本身，否则 color-mix 会形成循环。 */
  --wp-sidebar-solid: var(--dsw-static-neutral-bluish-50, #f6f8fa);
  --wp-base-solid: var(--dsw-static-neutral-bluish-00, #fafbfc);
  /* 色调跟随直接烘进填充色（与卡片同法），对内部自绘组件透明生效 */
  --wp-sidebar-tinted: color-mix(in srgb, var(--wp-tint) var(--wp-tint-mix), var(--wp-sidebar-solid));
  --wp-surface-fill: color-mix(in srgb, var(--wp-sidebar-tinted) calc(var(--wp-op) * 1%), transparent);

  /* ===== 全局语义 token 重定义（核心机制，不依赖 DOM 打标） =====
     在 body 上重定义，所有消费方（AppFrame 各列、SidebarRoot 等）经继承级联
     自动变半透明；即使结构识别失败也保证壁纸可见。 */
  --dsw-specific-sidebar-fill: var(--wp-surface-fill);
  --dsw-alias-bg-base: transparent;
}

body[data-wp-active][data-ds-dark-theme] {
  --wp-sidebar-solid: var(--dsw-static-neutral-bluish-900, #1b1c22);
  --wp-base-solid: var(--dsw-static-neutral-bluish-950, #101014);
}

body[data-wp-active] [data-wp-frame] {
  background: transparent !important;
}

/* ===== 逐组件"恢复不透明"（开关关闭时；打标为尽力而为，失败仅该区域保持透明） ===== */
body[data-wp-active]:not([data-wp-t-sidebar='1']) [data-wp-sidebar] {
  --dsw-specific-sidebar-fill: var(--wp-sidebar-solid);
  background: var(--wp-sidebar-solid) !important;
}
body[data-wp-active]:not([data-wp-t-topbar='1']) [data-wp-frame]::before {
  background: var(--wp-sidebar-solid) !important;
}
body[data-wp-active]:not([data-wp-t-main='1']) [data-wp-center] {
  --dsw-alias-bg-base: var(--wp-base-solid);
  background: var(--wp-base-solid) !important;
}
/* 右栏有官方稳定属性 data-rightbar-col，无需打标 */
body[data-wp-active]:not([data-wp-t-rightbar='1']) [data-rightbar-col] {
  --dsw-alias-bg-base: var(--wp-base-solid);
  background: var(--wp-base-solid) !important;
}

/* 卡片面板：改写 layer-1/2/3 语义别名（含暗色分支，基值取自 design-platform.css）。 */
body[data-wp-active]:not([data-ds-dark-theme]) {
  --wp-card-solid-1: var(--dsw-static-neutral-bluish-00, #fafbfc);
  --wp-card-solid-2: var(--dsw-static-neutral-bluish-00, #fafbfc);
  --wp-card-solid-3: var(--dsw-static-neutral-bluish-00, #fafbfc);
}
body[data-wp-active][data-ds-dark-theme] {
  --wp-card-solid-1: var(--dsw-static-neutral-bluish-875, #191a1f);
  --wp-card-solid-2: var(--dsw-static-neutral-bluish-850, #1e1f25);
  --wp-card-solid-3: var(--dsw-static-neutral-bluish-800, #26272e);
}
body[data-wp-active] {
  --wp-card-1: color-mix(in srgb, color-mix(in srgb, var(--wp-tint) var(--wp-tint-mix), var(--wp-card-solid-1)) calc(var(--wp-op) * 1%), transparent);
  --wp-card-2: color-mix(in srgb, color-mix(in srgb, var(--wp-tint) var(--wp-tint-mix), var(--wp-card-solid-2)) calc(var(--wp-op) * 1%), transparent);
  --wp-card-3: color-mix(in srgb, color-mix(in srgb, var(--wp-tint) var(--wp-tint-mix), var(--wp-card-solid-3)) calc(var(--wp-op) * 1%), transparent);
}
body[data-wp-active][data-wp-t-cards='1'] {
  --dsw-alias-bg-layer-1: var(--wp-card-1) !important;
  --dsw-alias-bg-layer-2: var(--wp-card-2) !important;
  --dsw-alias-bg-layer-3: var(--wp-card-3) !important;
}

/* 色调跟随：侧栏/右栏用负 z-index 叠层（画在自身背景之上、内容之下）。 */
body[data-wp-active] [data-wp-sidebar],
body[data-wp-active] [data-wp-center],
body[data-wp-active] [data-wp-right] {
  position: relative;
  isolation: isolate;
}
body[data-wp-active][data-wp-tint='1'] [data-wp-sidebar]::before,
body[data-wp-active][data-wp-tint='1'] [data-wp-right]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: color-mix(in srgb, var(--wp-tint) var(--wp-tint-mix), transparent);
  pointer-events: none;
}

/* 兜底模式：AppFrame 结构识别失败时退化为全局 token 覆盖。 */
body[data-wp-active][data-wp-fallback='1'] {
  --dsw-alias-bg-base: transparent !important;
  --dsw-specific-sidebar-fill: var(--wp-surface-fill) !important;
}

/* ===== 设置面板（自绘，仅消费语义 token，带兜底值） ===== */
.wp-section {
  display: grid;
  gap: 10px;
  color: var(--dsw-alias-label-primary, inherit);
  font-size: var(--dsh-content-font-size, 14px);
  min-width: 0;
}
.wp-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: var(--dsw-radius-md, 12px);
  background: var(--dsw-alias-settings-card-fill, transparent);
  border: 0.5px solid var(--dsw-alias-settings-card-stroke, transparent);
  min-width: 0;
}
.wp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}
.wp-row-main {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.wp-title {
  font-weight: 500;
}
.wp-hint {
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary, gray));
  font-size: 0.88em;
}
.wp-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.82em;
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
  color: var(--dsw-alias-label-secondary, inherit);
  white-space: nowrap;
}
.wp-range {
  width: 100%;
  accent-color: var(--dsw-static-blue-500, #4176e6);
}
.wp-range-row {
  display: grid;
  grid-template-columns: 76px 1fr 48px;
  align-items: center;
  gap: 8px;
}
.wp-range-row .wp-value {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-secondary, inherit);
}
.wp-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.wp-check {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.wp-check input {
  accent-color: var(--dsw-static-blue-500, #4176e6);
}
.wp-btn {
  cursor: pointer;
  padding: 5px 12px;
  border-radius: var(--dsw-radius-sm, 8px);
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
  background: var(--dsw-alias-bg-layer-2, transparent);
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 0.92em;
}
.wp-btn:hover {
  filter: brightness(1.06);
}
.wp-btn-danger {
  color: var(--dsw-static-red-500, #d5445c);
}
.wp-thumb {
  height: 84px;
  border-radius: var(--dsw-radius-sm, 8px);
  background-size: cover;
  background-position: center;
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
}
.wp-error {
  color: var(--dsw-static-red-500, #d5445c);
  font-size: 0.88em;
}
.wp-select {
  max-width: 180px;
  padding: 4px 8px;
  border-radius: var(--dsw-radius-xs, 6px);
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
  background: var(--dsw-alias-bg-layer-2, transparent);
  color: var(--dsw-alias-label-primary, inherit);
}
`

/** 注入全局样式（幂等）。样式标签带 data-plugin 归属标记。 */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-plugin="' + STYLE_PLUGIN_ID + '"][data-wp-global]')) return
  const style = document.createElement('style')
  style.setAttribute('data-plugin', STYLE_PLUGIN_ID)
  style.setAttribute('data-wp-global', '')
  style.textContent = GLOBAL_CSS
  ;(document.head ?? document.documentElement).appendChild(style)
}
