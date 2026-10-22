/**
 * 开屏动画冒烟测试（不启动 DSH）。
 *
 * 覆盖：
 *  1. 启用 + 视频：等开机动画（这里关掉 waitForBoot）→ 建全屏层 → 播放 →
 *     ended 后按 fadeMs 渐隐 → 撤层、释放 objectURL
 *  2. 图片/GIF：按 holdMs 停留后渐隐撤层
 *  3. 未启用 / 本会话已播过：不建层
 *  4. 媒体丢失：回落到「未启用」且不建层
 *
 * 用最小 DOM / IndexedDB / URL 桩跑真实的 lib/client.js。
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const code = readFileSync(join(root, 'lib/client.js'), 'utf8')
const PKG = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name
const SESSION_KEY = 'dsh-plugin-media-wallpaper.intro-shown'
const STORAGE_KEY = `${PKG}.settings.v1`

let fails = 0
const ok = (cond, msg, extra) => {
  if (cond) console.log(`[intro-smoke] ok: ${msg}`)
  else {
    fails++
    console.error(`[intro-smoke] FAIL: ${msg}${extra === undefined ? '' : ' — ' + JSON.stringify(extra)}`)
  }
}

/* ── 最小 DOM 桩 ─────────────────────────────────────────────────────── */
function makeClassList(el) {
  const set = new Set()
  return {
    add(...cs) { cs.forEach((c) => set.add(c)) },
    remove(...cs) { cs.forEach((c) => set.delete(c)) },
    contains(c) { return set.has(c) },
    toggle(c) { set.has(c) ? set.delete(c) : set.add(c) },
  }
}
function makeElement(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    attributes: new Map(),
    children: [],
    parentNode: null,
    style: { setProperty() {}, removeProperty() {} },
    dataset: {},
    classList: makeClassList(),
    _handlers: {},
    src: '',
    paused: true,
    duration: 5,
    currentTime: 0,
    readyState: 4,
    muted: false,
    loop: false,
    autoplay: false,
    playsInline: false,
    preload: '',
    setAttribute(k, v = '') { el.attributes.set(k, String(v)) },
    getAttribute(k) { return el.attributes.get(k) ?? null },
    removeAttribute(k) { el.attributes.delete(k) },
    addEventListener(t, fn) { (el._handlers[t] ||= []).push(fn) },
    dispatch(t) { for (const fn of el._handlers[t] || []) fn({ type: t, target: el }) },
    play() { el.paused = false; return Promise.resolve() },
    pause() { el.paused = true },
    load() {},
    appendChild(c) { c.parentNode = el; el.children.push(c); return c },
    append(...cs) { for (const c of cs) el.appendChild(c) },
    removeChild(c) { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); c.parentNode = null; return c },
    remove() { el.parentNode?.removeChild(el) },
    querySelector() { return null },
    querySelectorAll() { return [] },
  }
  return el
}

function makeDocument() {
  const head = makeElement('head')
  const body = makeElement('body')
  const html = makeElement('html')
  return {
    readyState: 'complete',
    documentElement: html,
    head,
    body,
    createElement: makeElement,
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener() {},
  }
}

/* ── 最小 IndexedDB 桩：只需要 get 一条 intro 媒体记录 ───────────────── */
function makeIndexedDB(record) {
  const store = {
    get() {
      const req = {}
      setTimeout(() => {
        req.result = record
        req.onsuccess?.()
      }, 0)
      return req
    },
    put() {},
    delete() {},
  }
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore() {},
    transaction() { return { objectStore: () => store } },
  }
  return {
    open() {
      const req = {}
      setTimeout(() => {
        req.result = db
        req.onupgradeneeded?.()
        req.onsuccess?.()
      }, 0)
      return req
    },
  }
}

/* ── 一个独立场景：新 document / localStorage / sessionStorage / IDB ── */
function makeScenario({ seed, record, sessionShown = false }) {
  const doc = makeDocument()
  const localStorageMap = new Map([[STORAGE_KEY, JSON.stringify(seed)]])
  const session = new Map()
  if (sessionShown) session.set(SESSION_KEY, '1')

  globalThis.document = doc
  globalThis.localStorage = {
    getItem: (k) => localStorageMap.get(k) ?? null,
    setItem: (k, v) => localStorageMap.set(k, String(v)),
    removeItem: (k) => localStorageMap.delete(k),
  }
  globalThis.sessionStorage = {
    getItem: (k) => session.get(k) ?? null,
    setItem: (k, v) => session.set(k, String(v)),
    removeItem: (k) => session.delete(k),
  }
  globalThis.indexedDB = makeIndexedDB(record)

  const created = []
  const urls = []
  const revoked = []
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL
  URL.createObjectURL = (blob) => {
    const url = 'blob:smoke-intro-' + (urls.length + 1)
    urls.push({ url, blob })
    return url
  }
  URL.revokeObjectURL = (url) => revoked.push(url)

  const registered = []
  const windowStub = { __ModuleLoader__: { load: (reg) => registered.push(reg) } }
  const requireStub = (id) => {
    if (id === 'react') return { useSyncExternalStore: () => ({}), useState: () => [{}, () => {}], useRef: () => ({ current: null }) }
    if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'Fragment' }
    throw new Error('unexpected external require: ' + id)
  }
  new Function('window', 'require', code)(windowStub, requireStub)
  const exportsObj = registered[0].factory(requireStub)

  const disposers = []
  const ctxStub = {
    slots: {
      inject: () => {},
      register: () => ({}),
    },
    effect: (fn) => { disposers.push(fn) },
  }
  exportsObj.apply(ctxStub)

  const cleanup = () => {
    for (const d of disposers) {
      const r = d()
      if (typeof r === 'function') r()
    }
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
    created.length = 0
  }
  return { doc, exportsObj, cleanup, urls, revoked, created }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const introLayerOf = (doc) => doc.body.children.find((c) => c.attributes.has('data-wp-intro'))

const baseSeed = {
  enabled: false,
  intro: {
    enabled: true,
    mediaId: 'smoke-intro',
    mediaType: 'video',
    formatLabel: 'WebM',
    mediaName: 'intro.webm',
    fadeMs: 100,
    holdMs: 500,
    oncePerSession: true,
    waitForBoot: false,
    fit: 'cover',
  },
}
const videoRecord = { id: 'smoke-intro', blob: new Blob(['x'], { type: 'video/webm' }), mime: 'video/webm', name: 'intro.webm', addedAt: 0 }

/* ── 1. 视频：播放 → ended → 渐隐撤层 ───────────────────────────────── */
{
  const s = makeScenario({ seed: baseSeed, record: videoRecord })
  await wait(60)
  const layer = introLayerOf(s.doc)
  ok(!!layer, '视频：启动后创建了开屏动画层（[data-wp-intro]）')
  const video = layer?.children.find((c) => c.tagName === 'VIDEO')
  ok(!!video, '视频：层内有 <video>')
  ok(video && video.src === 'blob:smoke-intro-1', '视频：src 指向 objectURL', video && video.src)
  ok(video && video.paused === false, '视频：已开始播放')
  ok(layer && layer.style.opacity === '1', '视频：已显示（不透明度 1）', layer && layer.style.opacity)
  ok(s.doc.body.children.length >= 1, '视频：层挂在 body 下')
  video?.dispatch('ended')
  await wait(260)
  ok(!introLayerOf(s.doc), '视频：ended 后按 fadeMs 渐隐并撤层')
  ok(s.revoked.length === 1, '视频：objectURL 已释放', s.revoked)
  s.cleanup()
}

/* ── 2. 图片/GIF：按 holdMs 停留后渐隐撤层 ──────────────────────────── */
{
  const seed = JSON.parse(JSON.stringify(baseSeed))
  seed.intro.mediaType = 'image'
  seed.intro.formatLabel = 'GIF'
  seed.intro.mediaName = 'intro.gif'
  seed.intro.holdMs = 500
  const record = { id: 'smoke-intro', blob: new Blob(['x'], { type: 'image/gif' }), mime: 'image/gif', name: 'intro.gif', addedAt: 0 }
  const s = makeScenario({ seed, record })
  await wait(60)
  const layer = introLayerOf(s.doc)
  ok(!!layer, '图片：启动后创建了开屏动画层')
  const img = layer?.children.find((c) => c.tagName === 'IMG')
  ok(!!img, '图片：层内有 <img>')
  await wait(900)
  ok(!introLayerOf(s.doc), '图片：停留 holdMs 后渐隐撤层')
  s.cleanup()
}

/* ── 3. 未启用 / 本会话已播过：不建层 ───────────────────────────────── */
{
  const seed = JSON.parse(JSON.stringify(baseSeed))
  seed.intro.enabled = false
  const s = makeScenario({ seed, record: videoRecord })
  await wait(80)
  ok(!introLayerOf(s.doc), '未启用：不创建开屏动画层')
  s.cleanup()
}
{
  const s = makeScenario({ seed: baseSeed, record: videoRecord, sessionShown: true })
  await wait(80)
  ok(!introLayerOf(s.doc), '本会话已播过：不再创建开屏动画层')
  s.cleanup()
}

/* ── 4. 媒体丢失：回落到未启用，不建层 ─────────────────────────────── */
{
  const s = makeScenario({ seed: baseSeed, record: null })
  await wait(120)
  ok(!introLayerOf(s.doc), '媒体丢失：不创建开屏动画层')
  const stored = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY) || '{}')
  ok(stored.intro && stored.intro.enabled === false, '媒体丢失：设置里回落为未启用', stored.intro && stored.intro.enabled)
  s.cleanup()
}

console.log(fails === 0 ? '[intro-smoke] ALL PASSED' : `[intro-smoke] ${fails} FAILED`)
process.exit(fails === 0 ? 0 : 1)
