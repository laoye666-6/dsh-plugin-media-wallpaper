/**
 * 冒烟自检：不启动 DSH，在 Node 中用最小 DOM 桩验证
 *  1. lib/client.js 的懒 CJS 工厂包装格式正确（window.__ModuleLoader__.load）
 *  2. require 只请求冻结表内的 external（react / react/jsx-runtime）
 *  3. 工厂导出 name / inject / apply
 *  4. apply(ctx) 能在假环境中完成装配：样式注入、壁纸层挂载、双插槽注册、body 属性投影
 *  5. Host 半侧 lib/index.js 可导入且为空实现
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const assert = (cond, msg) => {
  if (!cond) {
    console.error(`[smoke] FAIL: ${msg}`)
    process.exitCode = 1
  } else {
    console.log(`[smoke] ok: ${msg}`)
  }
}

// ---- 1/2/3: 执行客户端 bundle ----
const code = readFileSync(join(root, 'lib/client.js'), 'utf8')
assert(code.startsWith('window.__ModuleLoader__.load({ id: \'dsh-plugin-wallpaper\', factory: (require) => {'), '客户端 bundle 以官方 __ModuleLoader__ 包装开头')
assert(code.trimEnd().endsWith('return module.exports;\n} });'), '客户端 bundle 以官方包装结尾')

const registrations = []
const windowStub = { __ModuleLoader__: { load: (reg) => registrations.push(reg) } }
const requiredModules = new Set()
const requireStub = (id) => {
  requiredModules.add(id)
  if (id === 'react') {
    return { useSyncExternalStore: () => ({}), useState: () => [{}, () => {}], createElement: () => ({}) }
  }
  if (id === 'react/jsx-runtime') {
    return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'Fragment' }
  }
  throw new Error(`unexpected external require: ${id}`)
}
new Function('window', 'require', code)(windowStub, requireStub)
assert(registrations.length === 1, '工厂恰好注册一次')

const exportsObj = registrations[0].factory(requireStub)
assert(requiredModules.size === 2 && requiredModules.has('react') && requiredModules.has('react/jsx-runtime'), 'external 仅请求冻结表内模块')
assert(exportsObj.name === 'dsh-plugin-wallpaper', '导出 name')
assert(Array.isArray(exportsObj.inject) && exportsObj.inject.includes('slots'), '导出 inject = [slots]')
assert(typeof exportsObj.apply === 'function', '导出 apply')

// ---- 4: 最小 DOM 桩跑 apply ----
function makeElement(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    attributes: new Map(),
    children: [],
    style: { setProperty() {}, removeProperty() {}, },
    isConnected: true,
    setAttribute(k, v = '') { el.attributes.set(k, String(v)) },
    getAttribute(k) { return el.attributes.get(k) ?? null },
    removeAttribute(k) { el.attributes.delete(k) },
    appendChild(c) { el.children.push(c); return c },
    append(...cs) { el.children.push(...cs) },
    remove() {},
    removeEventListener() {},
    addEventListener() {},
    querySelector(sel) {
      const attr = sel.replace(/^\[|\]$/g, '').split('=')[0]
      for (const c of el.children) if (c.attributes?.has(attr)) return c
      for (const c of el.children) { const hit = c.querySelector?.(sel); if (hit) return hit }
      return null
    },
    querySelectorAll(sel) {
      const attr = sel.replace(/^\[|\]$/g, '').split('=')[0].split(',')[0]
      const found = []
      const walk = (n) => { for (const c of n.children) { if (c.attributes?.has(attr)) found.push(c); walk(c) } }
      walk(el)
      return found
    },
  }
  return el
}

const layerEl = makeElement('div')
const body = makeElement('body')
body.appendChild = (c) => { body.children.push(c); return c }
const documentStub = {
  createElement: makeElement,
  head: makeElement('head'),
  documentElement: makeElement('html'),
  body,
  querySelector: () => null,
  querySelectorAll: () => [],
}
const registered = {}
const slotFactories = []
const disposers = []
const ctxStub = {
  slots: {
    inject: (key, factory) => { slotFactories.push([key, factory]) },
    register: (decl, component) => { registered[decl.name] = { decl, component }; return decl },
  },
  effect: (fn) => { disposers.push(fn) },
}
// 预置"已启用壁纸"的持久化设置，驱动真实代码路径（state → surface 投影）
const seed = {
  enabled: true,
  mediaId: 'smoke-media',
  mediaType: 'image',
  formatLabel: 'PNG',
  mediaName: 'smoke.png',
  fit: 'cover',
  blur: 8,
  brightness: 100,
  dim: 25,
  tintFollow: true,
  tintStrength: 18,
  transparent: { sidebar: true, topbar: true, main: false, rightbar: false, cards: true },
  surfaceOpacity: 70,
}
globalThis.document = documentStub
globalThis.localStorage = {
  getItem: (k) => (k === 'dsh-plugin-wallpaper.settings.v1' ? JSON.stringify(seed) : null),
  setItem: () => {},
  removeItem: () => {},
}

exportsObj.apply(ctxStub)

assert(documentStub.head.children.some((c) => c.attributes.get('data-plugin') === 'dsh-plugin-wallpaper'), '样式注入并带 data-plugin 归属标记')
assert(body.children.some((c) => c.attributes.has('data-wp-layer')), '壁纸层挂载到 body')
const wpLayer = body.children.find((c) => c.attributes.has('data-wp-layer'))
assert(!!wpLayer && wpLayer.children.some((c) => c.attributes.has('data-wp-media')) && wpLayer.children.some((c) => c.attributes.has('data-wp-dim')), '壁纸层含媒体/压暗子层')
assert(slotFactories.map(([k]) => k).sort().join(',') === 'plugins.detail.section,settings.section', '双插槽已注册')
assert(body.attributes.get('data-wp-active') === '', '启用后 body 带 data-wp-active')
assert(body.attributes.get('data-wp-t-cards') === '1', '卡片透明开关投影到 data-wp-t-cards')
assert(body.attributes.get('data-wp-t-main') === '0', '未开启的主区开关投影为 0')
assert(body.attributes.get('data-wp-tint') === '1', '色调跟随开关投影到 data-wp-tint')

// 异步装载：桩环境下媒体不存在，应自动回落为未激活（存储清理容错路径）
await new Promise((r) => setTimeout(r, 0))
assert(!body.attributes.has('data-wp-active'), '媒体缺失时自动回落为未激活')

// 卸载清理
for (const d of disposers) { const r = d(); typeof r === 'function' && r() }
assert(!body.attributes.has('data-wp-active'), '卸载后清除激活属性')

// ---- 5: Host 半侧 ----
const host = await import(pathToFileURL(join(root, 'lib/index.js')).href)
assert(host.name === 'dsh-plugin-wallpaper' && typeof host.apply === 'function', 'Host 半侧导出 name/apply')

console.log(process.exitCode ? '[smoke] FAILED' : '[smoke] ALL PASSED')
