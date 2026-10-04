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
  /* 逐组件表面不透明度（0–100，surface.ts 按设置内联写入） */
  --wp-op-sidebar: 70;
  --wp-op-topbar: 70;
  --wp-op-main: 0;
  --wp-op-right: 0;
  --wp-op-cards: 70;
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
  --wp-surface-fill: color-mix(in srgb, var(--wp-sidebar-tinted) calc(var(--wp-op-sidebar) * 1%), transparent);
  --wp-topbar-fill: color-mix(in srgb, var(--wp-sidebar-tinted) calc(var(--wp-op-topbar) * 1%), transparent);

  /* ===== 全局语义 token 重定义（核心机制，不依赖 DOM 打标） =====
     在 body 上重定义，所有消费方（AppFrame 各列、SidebarRoot 等）经继承级联
     自动变半透明；即使结构识别失败也保证壁纸可见。
     !important 必须保留：主题包在 body[data-ds-dark-theme]（同特异性）上定义
     暗色值，且 theme-presenter 会内联写 token——不加会被暗色模式压回不透明。 */
  --dsw-specific-sidebar-fill: var(--wp-surface-fill) !important;
  --dsw-alias-bg-base: transparent !important;
  --wp-glass-a: calc(var(--wp-op-cards) * 0.01);
  --wp-glass-mult: 1;
  --wp-floor: 0.2;
  --wp-floor-eff: calc(var(--wp-floor) * var(--wp-op-cards) * 0.01);
  --wp-glass-tint: #ffffff;
}

body[data-wp-active][data-ds-dark-theme] {
  --wp-sidebar-solid: var(--dsw-static-neutral-bluish-900, #1b1c22);
  --wp-base-solid: var(--dsw-static-neutral-bluish-950, #101014);
}

body[data-wp-active] [data-wp-frame] {
  background: transparent !important;
}

/* ===== 表面质感：毛玻璃 / 液态玻璃 =====
   质感作用于前景 UI（输入框卡、新对话 hero、设置面板与卡片、设置页侧边导航按钮），
   不作用于整片背景列。CSS Modules 类名哈希会随壳前端重建失效，但局部名后缀
   （_navCell/_hero/_composerHero）长期稳定，用 [class*=] 后缀匹配；卡片与面板的玻璃感由玻璃配方令牌提供，不逐元素加质感。
   [data-composer-card] 为壳原生属性（构建可存活）；模糊由 ::before 伪元素承载，
   伪元素没有 DOM 后代，不会成为 fixed 后代的包含块。 */
body[data-wp-active][data-wp-finish='frosted'] [data-composer-card],
body[data-wp-active][data-wp-finish='frosted'] [class*="_navCell"],
body[data-wp-active][data-wp-finish='frosted'] [class*="_hero"],
body[data-wp-active][data-wp-finish='frosted'] [class*="_composerHero"] {
  backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.4);
  -webkit-backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.4);
}
/* 液态玻璃：折射感（更高饱和/亮度）+ 白色高光渐变与内描边 */
body[data-wp-active][data-wp-finish='liquid'] [data-composer-card]::before {
  backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.7) brightness(1.05);
  -webkit-backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.7) brightness(1.05);
}
body[data-wp-active][data-wp-finish='liquid'] [data-composer-card],
body[data-wp-active][data-wp-finish='liquid'] [class*="_navCell"],
body[data-wp-active][data-wp-finish='liquid'] [class*="_hero"],
body[data-wp-active][data-wp-finish='liquid'] [class*="_composerHero"] {
  background-image: linear-gradient(
      135deg,
      rgb(255 255 255 / 0.14),
      rgb(255 255 255 / 0.03) 45%,
      rgb(255 255 255 / 0.1)
    ) !important;
  box-shadow:
    inset 0 0 0 0.5px rgb(255 255 255 / 0.2),
    inset 0 1px 0 rgb(255 255 255 / 0.12) !important;
}
body[data-wp-active][data-wp-finish='frosted'] [data-composer-card],
body[data-wp-active][data-wp-finish='liquid'] [data-composer-card] {
  position: relative;
}
body[data-wp-active][data-wp-finish='frosted'] [data-composer-card]::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.3);
  -webkit-backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.3);
}

/* ===== 自定义字体颜色（覆盖官方 label 令牌，压过主题与 presenter 内联写入） ===== */
body[data-wp-active][data-wp-text='1'] {
  --dsw-alias-label-primary: var(--wp-text-color, #ffffff) !important;
  --dsw-alias-label-secondary: color-mix(in srgb, var(--wp-text-color, #ffffff) 78%, transparent) !important;
  --dsw-alias-label-tertiary: color-mix(in srgb, var(--wp-text-color, #ffffff) 58%, transparent) !important;
}

/* ===== 逐组件开关与独立不透明度 =====
   开关开启：该区域按各自不透明度绘制（主内容/右栏为打标元素级重定义，依赖结构识别，
   失败时保持全局透明——宁可可见壁纸）；开关关闭：恢复官方不透明底色。
   token 重定义带 !important：元素级 !important 在级联上仍胜过 body 级 !important。 */
body[data-wp-active]:not([data-wp-t-sidebar='1']) [data-wp-sidebar] {
  --dsw-specific-sidebar-fill: var(--wp-sidebar-solid) !important;
  background: var(--wp-sidebar-solid) !important;
}
body[data-wp-active][data-wp-t-topbar='1'] [data-wp-frame]::before {
  background: var(--wp-topbar-fill) !important;
}
body[data-wp-active]:not([data-wp-t-topbar='1']) [data-wp-frame]::before {
  background: var(--wp-sidebar-solid) !important;
}
body[data-wp-active][data-wp-t-main='1'] [data-wp-center] {
  --dsw-alias-bg-base: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-op-main) * 1%), transparent) !important;
  background: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-op-main) * 1%), transparent) !important;
}
body[data-wp-active]:not([data-wp-t-main='1']) [data-wp-center] {
  --dsw-alias-bg-base: var(--wp-base-solid) !important;
  background: var(--wp-base-solid) !important;
}
/* 右栏有官方稳定属性 data-rightbar-col，无需打标 */
body[data-wp-active][data-wp-t-rightbar='1'] [data-rightbar-col] {
  --dsw-alias-bg-base: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-op-right) * 1%), transparent) !important;
  background: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-op-right) * 1%), transparent) !important;
}
body[data-wp-active]:not([data-wp-t-rightbar='1']) [data-rightbar-col] {
  --dsw-alias-bg-base: var(--wp-base-solid) !important;
  background: var(--wp-base-solid) !important;
}

/* ===== 玻璃配方（令牌源头接管，卡片面板开关联动） =====
   参照通用做法：可读性地板（主题底色按固定权重合成在底层，玻璃色权重再高
   也不会低于地板覆盖，亮/暗极端壁纸像素下文字仍可读；地板随表面不透明度
   缩放，拖到 0 时完全透明）+ 玻璃色按层权重混合：
   面板梯度 layer-1/2/3 = 0.9/1.0/1.1，抬高按钮（新建会话）= 1.15，
   输入框卡（input-major）= 1.1，消息气泡（bubble）= 1.0。
   设置卡 fill 链到 layer-2，自动生效。代码块底刻意不接管（shiki 配色可读性）。
   暗色下玻璃色（白色釉面）权重按主题降档。 */
body[data-wp-active][data-ds-dark-theme] {
  --wp-glass-mult: 0.45;
}
body[data-wp-active][data-wp-finish='liquid'] {
  --wp-floor: 0.1;
  --wp-glass-mult: 1.2;
}
body[data-wp-active][data-wp-finish='liquid'][data-ds-dark-theme] {
  --wp-glass-mult: 0.6;
}
body[data-wp-active][data-wp-tint='1'] {
  --wp-glass-tint: color-mix(in srgb, var(--wp-tint) var(--wp-tint-mix), #ffffff);
}
body[data-wp-active][data-wp-t-cards='1'] {
  --dsw-alias-bg-layer-1: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-floor-eff) * 100%), color-mix(in srgb, var(--wp-glass-tint) calc(var(--wp-glass-a) * 0.9 * var(--wp-glass-mult) * 100%), transparent) calc((1 - var(--wp-floor-eff)) * 100%)) !important;
  --dsw-alias-bg-layer-2: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-floor-eff) * 100%), color-mix(in srgb, var(--wp-glass-tint) calc(var(--wp-glass-a) * 1 * var(--wp-glass-mult) * 100%), transparent) calc((1 - var(--wp-floor-eff)) * 100%)) !important;
  --dsw-alias-bg-layer-3: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-floor-eff) * 100%), color-mix(in srgb, var(--wp-glass-tint) calc(var(--wp-glass-a) * 1.1 * var(--wp-glass-mult) * 100%), transparent) calc((1 - var(--wp-floor-eff)) * 100%)) !important;
  --dsw-alias-button-elevated-fill: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-floor-eff) * 100%), color-mix(in srgb, var(--wp-glass-tint) calc(var(--wp-glass-a) * 1.15 * var(--wp-glass-mult) * 100%), transparent) calc((1 - var(--wp-floor-eff)) * 100%)) !important;
  --dsw-specific-input-major: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-floor-eff) * 100%), color-mix(in srgb, var(--wp-glass-tint) calc(var(--wp-glass-a) * 1.1 * var(--wp-glass-mult) * 100%), transparent) calc((1 - var(--wp-floor-eff)) * 100%)) !important;
  --dsw-specific-bubble: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-floor-eff) * 100%), color-mix(in srgb, var(--wp-glass-tint) calc(var(--wp-glass-a) * 1 * var(--wp-glass-mult) * 100%), transparent) calc((1 - var(--wp-floor-eff)) * 100%)) !important;
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
  border-radius: var(--dsw-radius-md, 12px);
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
  background: var(--dsw-alias-bg-layer-2, transparent);
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 0.92em;
  backdrop-filter: blur(10px) saturate(1.3);
  -webkit-backdrop-filter: blur(10px) saturate(1.3);
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
  padding: 5px 10px;
  border-radius: var(--dsw-radius-md, 12px);
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
  background: var(--dsw-alias-bg-layer-2, transparent);
  color: var(--dsw-alias-label-primary, inherit);
  backdrop-filter: blur(10px) saturate(1.3);
  -webkit-backdrop-filter: blur(10px) saturate(1.3);
}
/* 质感分段选择器：圆角玻璃按钮，与整体 UI 同步 */
.wp-seg {
  display: flex;
  gap: 6px;
  min-width: 0;
}
.wp-seg-btn {
  flex: 1;
  padding: 6px 10px;
  border-radius: var(--dsw-radius-md, 12px);
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
  background: var(--dsw-alias-bg-layer-2, transparent);
  color: var(--dsw-alias-label-secondary, inherit);
  cursor: pointer;
  font-size: 0.92em;
  white-space: nowrap;
  backdrop-filter: blur(10px) saturate(1.3);
  -webkit-backdrop-filter: blur(10px) saturate(1.3);
}
.wp-seg-btn[data-active='1'] {
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-2, transparent));
  border-color: var(--dsw-static-blue-500, #4176e6);
  color: var(--dsw-alias-label-primary, inherit);
}
.wp-color {
  width: 40px;
  height: 26px;
  padding: 0;
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
  border-radius: var(--dsw-radius-sm, 8px);
  background: transparent;
  cursor: pointer;
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
