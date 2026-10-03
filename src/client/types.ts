/**
 * 与 DSH 客户端服务的结构性类型（刻意不 import @deepseek-ai/cordis，
 * 使本插件可以独立于官方仓库完成类型检查与构建）。
 *
 * 插槽 API 形状依据官方文档 docs/subsystems/slots.md（0.2.x，2026-10 核对）：
 *   ctx.slots.inject(key, factory) / ctx.slots.register(decl, component)
 */

/** 官方插槽声明项（本插件只用到最小字段集）。 */
export interface SlotDeclaration {
  /** 插槽 key，必须与 inject 的 key 一致 */
  name: string
  /** 本插件条目的唯一 id */
  id: string
  /** list 插槽排序，数值小者在前 */
  order?: number
  /** 导航/列表展示文案；支持语言跟随 thunk（resolveSlotLabel 解析，locale 变化时自动重解析） */
  label?: string | (() => string)
}

/** plugins.detail.section 条目渲染时收到的 subject。 */
export interface DetailSubject {
  kind: 'bundle' | 'row' | 'item'
  pkg?: string
  row?: unknown
  id?: string
}

/** 客户端插槽注册表（ui-slots）暴露给插件的最小面。 */
export interface SlotsLike {
  inject?(key: string, factory: () => unknown): unknown
  register?(decl: SlotDeclaration, component: unknown): unknown
}

/** 客户端 Cordis Context 的最小面：只声明本插件实际使用的能力。 */
export interface ClientContext {
  slots?: SlotsLike
  /** Cordis 效果钩子：返回的清理函数在插件卸载时自动执行。 */
  effect?(fn: () => void | (() => void)): unknown
  /** 客户端日志（存在则用，避免插件把宿主控制台刷脏）。 */
  logger?: {
    info?(...args: unknown[]): void
    warn?(...args: unknown[]): void
    error?(...args: unknown[]): void
  }
}

/** 插槽组件收到的 props（本插件刻意不依赖 t 与标准 hooks）。 */
export interface SlotComponentProps {
  subject?: DetailSubject
  [key: string]: unknown
}
