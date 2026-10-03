window.__ModuleLoader__.load({ id: 'dsh-plugin-media-wallpaper', factory: (require) => {
var module = { exports: {} };
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// src/client/identity.ts
var PLUGIN_PKG = "dsh-plugin-media-wallpaper";
var PLUGIN_VERSION = "0.1.5";

// src/client/state.ts
var DEFAULT_SETTINGS = {
  enabled: false,
  mediaId: null,
  mediaType: null,
  formatLabel: null,
  mediaName: null,
  fit: "cover",
  blur: 0,
  brightness: 100,
  dim: 25,
  tintFollow: false,
  tintStrength: 18,
  finish: "frosted",
  frostStrength: 14,
  transparent: {
    sidebar: true,
    topbar: true,
    main: true,
    rightbar: true,
    cards: true
  },
  surfaceOpacity: 70
};
var STORAGE_KEY = "dsh-plugin-media-wallpaper.settings.v1";
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function revive(raw) {
  const base = { ...DEFAULT_SETTINGS, transparent: { ...DEFAULT_SETTINGS.transparent } };
  if (!isRecord(raw)) return base;
  const num = (v, fallback2, min, max) => typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback2;
  const bool = (v, fallback2) => typeof v === "boolean" ? v : fallback2;
  const str = (v) => typeof v === "string" && v.length > 0 ? v : null;
  base.enabled = bool(raw.enabled, base.enabled);
  base.mediaId = str(raw.mediaId);
  base.mediaType = raw.mediaType === "image" || raw.mediaType === "video" ? raw.mediaType : null;
  base.formatLabel = str(raw.formatLabel);
  base.mediaName = str(raw.mediaName);
  if (raw.fit === "cover" || raw.fit === "contain" || raw.fit === "fill" || raw.fit === "tile") base.fit = raw.fit;
  base.blur = num(raw.blur, base.blur, 0, 40);
  base.brightness = num(raw.brightness, base.brightness, 20, 200);
  base.dim = num(raw.dim, base.dim, 0, 90);
  base.tintFollow = bool(raw.tintFollow, base.tintFollow);
  base.tintStrength = num(raw.tintStrength, base.tintStrength, 0, 50);
  base.finish = raw.finish === "frosted" || raw.finish === "liquid" || raw.finish === "none" ? raw.finish : base.finish;
  base.frostStrength = num(raw.frostStrength, base.frostStrength, 4, 30);
  if (isRecord(raw.transparent)) {
    base.transparent.sidebar = bool(raw.transparent.sidebar, base.transparent.sidebar);
    base.transparent.topbar = bool(raw.transparent.topbar, base.transparent.topbar);
    base.transparent.main = bool(raw.transparent.main, base.transparent.main);
    base.transparent.rightbar = bool(raw.transparent.rightbar, base.transparent.rightbar);
    base.transparent.cards = bool(raw.transparent.cards, base.transparent.cards);
  }
  base.surfaceOpacity = num(raw.surfaceOpacity, base.surfaceOpacity, 0, 100);
  return base;
}
function load() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return revive(raw ? JSON.parse(raw) : void 0);
  } catch {
    return { ...DEFAULT_SETTINGS, transparent: { ...DEFAULT_SETTINGS.transparent } };
  }
}
var current = null;
var listeners = /* @__PURE__ */ new Set();
function getSnapshot() {
  if (current === null) current = load();
  return current;
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function set(partial) {
  const next = { ...getSnapshot(), ...partial };
  if (!partial.transparent) next.transparent = current?.transparent ?? next.transparent;
  current = next;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
  }
  for (const listener of listeners) listener();
}
function setTransparency(partial) {
  set({ transparent: { ...getSnapshot().transparent, ...partial } });
}
function notify() {
  for (const listener of listeners) listener();
}
function resetAll() {
  set({ ...DEFAULT_SETTINGS, transparent: { ...DEFAULT_SETTINGS.transparent } });
}
function isActive(s = getSnapshot()) {
  return s.enabled && s.mediaId !== null && s.mediaType !== null;
}

// src/client/storage.ts
var DB_NAME = "dsh-plugin-media-wallpaper";
var STORE = "media";
var DB_VERSION = 1;
var memoryFallback = null;
var dbPromise = null;
function hasIndexedDB() {
  return typeof globalThis.indexedDB !== "undefined";
}
function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      if (!hasIndexedDB()) {
        memoryFallback ??= /* @__PURE__ */ new Map();
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          memoryFallback ??= /* @__PURE__ */ new Map();
          resolve(null);
        };
      } catch {
        memoryFallback ??= /* @__PURE__ */ new Map();
        resolve(null);
      }
    });
  }
  return dbPromise;
}
async function putMedia(record) {
  const db = await openDb();
  if (!db) {
    memoryFallback?.set(record.id, record);
    return;
  }
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
async function getMedia(id) {
  const db = await openDb();
  if (!db) return memoryFallback?.get(id) ?? null;
  return await new Promise((resolve) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}
async function deleteMedia(id) {
  const db = await openDb();
  if (!db) {
    memoryFallback?.delete(id);
    return;
  }
  await new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}
var currentUrl = null;
function takeObjectUrl(blob) {
  releaseObjectUrl();
  currentUrl = URL.createObjectURL(blob);
  return currentUrl;
}
function currentObjectUrl() {
  return currentUrl;
}
function releaseObjectUrl() {
  if (currentUrl !== null) {
    try {
      URL.revokeObjectURL(currentUrl);
    } catch {
    }
    currentUrl = null;
  }
}

// src/client/layer.ts
var LAYER_PLUGIN_ID = PLUGIN_PKG;
var layer = null;
var media = null;
var dim = null;
var videoEl = null;
var mediaUrl = null;
var mediaType = null;
function ensureElement(tag, attr) {
  const el = document.createElement(tag);
  el.setAttribute(attr, "");
  el.setAttribute("data-plugin", LAYER_PLUGIN_ID);
  return el;
}
function ensureLayer() {
  if (layer && layer.isConnected) return layer;
  layer = ensureElement("div", "data-wp-layer");
  media = ensureElement("div", "data-wp-media");
  dim = ensureElement("div", "data-wp-dim");
  layer.append(media, dim);
  (document.body ?? document.documentElement).appendChild(layer);
  return layer;
}
function disposeLayer() {
  videoEl = null;
  mediaUrl = null;
  mediaType = null;
  layer?.remove();
  layer = null;
  media = null;
  dim = null;
}
function imageBackgroundStyle(fit) {
  switch (fit) {
    case "contain":
      return "no-repeat center / contain";
    case "fill":
      return "no-repeat center / 100% 100%";
    case "tile":
      return "repeat top left / auto";
    case "cover":
    default:
      return "no-repeat center / cover";
  }
}
function videoObjectFit(fit) {
  return fit === "contain" ? "contain" : fit === "fill" ? "fill" : "cover";
}
function getVideoElement() {
  return videoEl;
}
function setMedia(url, type) {
  ensureLayer();
  if (!media) return;
  videoEl?.remove();
  videoEl = null;
  mediaUrl = url;
  mediaType = type;
  media.style.background = "";
  media.style.filter = "";
  media.style.transform = "";
  if (!url || !type) return;
  if (type === "image") return;
  const video2 = document.createElement("video");
  video2.setAttribute("data-plugin", LAYER_PLUGIN_ID);
  video2.src = url;
  video2.muted = true;
  video2.loop = true;
  video2.autoplay = true;
  video2.setAttribute("playsinline", "");
  video2.setAttribute("aria-hidden", "true");
  video2.style.width = "100%";
  video2.style.height = "100%";
  video2.style.display = "block";
  media.appendChild(video2);
  videoEl = video2;
  void video2.play().catch(() => {
  });
}
function updateLayer(s) {
  const l = ensureLayer();
  if (!media || !dim) return;
  const active = isActive(s);
  l.style.display = active ? "" : "none";
  if (!active || !mediaType) return;
  const blurPx = Math.max(0, Math.min(40, s.blur));
  const brightness = Math.max(0.2, Math.min(2, s.brightness / 100));
  media.style.filter = `blur(${blurPx}px) brightness(${brightness})`;
  const scale = 1 + Math.min(blurPx, 30) / 200;
  media.style.transform = blurPx > 0 ? `scale(${scale.toFixed(3)})` : "";
  dim.style.opacity = String(Math.max(0, Math.min(90, s.dim)) / 100);
  if (mediaType === "image" && mediaUrl) {
    media.style.background = `url("${mediaUrl}") ${imageBackgroundStyle(s.fit)}`;
  }
  if (videoEl) {
    videoEl.style.objectFit = videoObjectFit(s.fit);
  }
}

// src/client/surface.ts
var RETRY_DELAYS_MS = [150, 300, 600, 1200, 2400, 4800];
var observer = null;
var retryTimer = null;
var retryIndex = 0;
var fallback = false;
var rafPending = false;
function safeMatchMedia(query) {
  try {
    return typeof matchMedia === "function" ? matchMedia(query) : null;
  } catch {
    return null;
  }
}
function isElement(v) {
  return typeof v === "object" && v !== null && typeof v.setAttribute === "function" && typeof v.getAttribute === "function";
}
function flowColumns(container, right) {
  const out = [];
  for (const child of container.children) {
    if (!isElement(child)) continue;
    if (child.hasAttribute("data-shell-overlay") || child.hasAttribute("data-shell-bottom") || child.hasAttribute("data-shell-leading") || child === right) {
      continue;
    }
    if (child.offsetWidth < 24 && getComputedStyleSafe(child) === "absolute") continue;
    out.push(child);
  }
  return out;
}
function retag() {
  if (typeof document === "undefined") return false;
  const anchor = document.querySelector("[data-shell-overlay], [data-shell-bottom]");
  const frame = anchor?.parentElement;
  if (!isElement(frame)) return false;
  const right = frame.querySelector(":scope > [data-rightbar-col]");
  let cols = flowColumns(frame, right);
  if (cols.length < 2) {
    for (const wrapper of cols) {
      const sub = flowColumns(wrapper, wrapper.querySelector(":scope > [data-rightbar-col]"));
      if (sub.length >= 2) {
        cols = sub;
        break;
      }
    }
  }
  if (cols.length < 2) return false;
  cols.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  const sidebar = cols[0];
  const center = cols[1];
  clearTags();
  frame.setAttribute("data-wp-frame", "");
  sidebar.setAttribute("data-wp-sidebar", "");
  center.setAttribute("data-wp-center", "");
  return true;
}
function getComputedStyleSafe(el) {
  try {
    return typeof getComputedStyle === "function" ? getComputedStyle(el).position : "";
  } catch {
    return "";
  }
}
function clearTags() {
  for (const el of document.querySelectorAll("[data-wp-frame],[data-wp-sidebar],[data-wp-center]")) {
    el.removeAttribute("data-wp-frame");
    el.removeAttribute("data-wp-sidebar");
    el.removeAttribute("data-wp-center");
  }
}
function tagsValid() {
  const frame = document.querySelector("[data-wp-frame]");
  if (!frame || !frame.isConnected) return false;
  const anchor = document.querySelector("[data-shell-overlay], [data-shell-bottom]");
  if (anchor?.parentElement !== frame) return false;
  const sidebar = document.querySelector("[data-wp-sidebar]");
  const center = document.querySelector("[data-wp-center]");
  return Boolean(sidebar?.isConnected && center?.isConnected);
}
function scheduleRetry(onGiveUp) {
  if (retryIndex >= RETRY_DELAYS_MS.length) {
    onGiveUp();
    return;
  }
  const delay = RETRY_DELAYS_MS[retryIndex++];
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (retag()) return;
    scheduleRetry(onGiveUp);
  }, delay);
}
function giveUpToFallback() {
  fallback = true;
  document.body.setAttribute("data-wp-fallback", "1");
  clearTags();
}
function scheduleRafCheck() {
  if (rafPending || fallback) return;
  rafPending = true;
  const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb) => setTimeout(cb, 32);
  raf(() => {
    rafPending = false;
    if (fallback) return;
    if (!tagsValid() && !retag()) {
      retryIndex = 0;
      scheduleRetry(giveUpToFallback);
    }
  });
}
function start() {
  if (typeof document === "undefined") return;
  if (typeof MutationObserver === "function") {
    observer = new MutationObserver(scheduleRafCheck);
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (retag()) return;
  scheduleRetry(giveUpToFallback);
}
function stop() {
  observer?.disconnect();
  observer = null;
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (typeof document !== "undefined") {
    clearTags();
    const body = document.body;
    body.removeAttribute("data-wp-fallback");
    body.removeAttribute("data-wp-active");
    body.removeAttribute("data-wp-t-sidebar");
    body.removeAttribute("data-wp-t-topbar");
    body.removeAttribute("data-wp-t-main");
    body.removeAttribute("data-wp-t-rightbar");
    body.removeAttribute("data-wp-t-cards");
    body.removeAttribute("data-wp-tint");
  }
  fallback = false;
  retryIndex = 0;
}
function applySettings(s) {
  if (typeof document === "undefined") return;
  const body = document.body;
  if (!isActive(s)) {
    body.removeAttribute("data-wp-active");
    body.removeAttribute("data-wp-finish");
    body.style.removeProperty("--wp-frost");
    return;
  }
  body.setAttribute("data-wp-active", "");
  const t = s.transparent;
  body.setAttribute("data-wp-t-sidebar", t.sidebar ? "1" : "0");
  body.setAttribute("data-wp-t-topbar", t.topbar ? "1" : "0");
  body.setAttribute("data-wp-t-main", t.main ? "1" : "0");
  body.setAttribute("data-wp-t-rightbar", t.rightbar ? "1" : "0");
  body.setAttribute("data-wp-t-cards", t.cards ? "1" : "0");
  body.setAttribute("data-wp-tint", s.tintFollow ? "1" : "0");
  body.setAttribute("data-wp-finish", s.finish);
  body.style.setProperty("--wp-frost", `${Math.round(s.frostStrength)}px`);
  const reduced = safeMatchMedia("(prefers-reduced-transparency: reduce)")?.matches ?? false;
  const op = reduced ? Math.max(s.surfaceOpacity, 90) : s.surfaceOpacity;
  body.style.setProperty("--wp-op", String(op));
  body.style.setProperty("--wp-tint-mix", s.tintFollow ? `${Math.round(s.tintStrength)}%` : "0%");
}

// src/client/palette.ts
var SAMPLE_W = 48;
var SAMPLE_H = 27;
var VIDEO_SAMPLE_INTERVAL_MS = 2e3;
var canvasCtx = null;
var activeUrl = null;
var activeType = null;
var imgLoader = null;
var video = null;
var lastSampleAt = 0;
var lastColor = null;
var tintSink = null;
function getCtx() {
  if (canvasCtx) return canvasCtx;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_W;
  canvas.height = SAMPLE_H;
  canvasCtx = canvas.getContext("2d", { willReadFrequently: true });
  return canvasCtx;
}
function emit(color) {
  lastColor = color;
  tintSink?.(color);
}
function onTint(sink) {
  tintSink = sink;
  if (lastColor !== null) sink(lastColor);
}
function computeColor(source) {
  const ctx = getCtx();
  if (!ctx) return null;
  try {
    ctx.clearRect(0, 0, SAMPLE_W, SAMPLE_H);
    ctx.drawImage(source, 0, 0, SAMPLE_W, SAMPLE_H);
    const { data } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 128) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (count === 0) return null;
    return `rgb(${Math.round(r / count)} ${Math.round(g / count)} ${Math.round(b / count)})`;
  } catch {
    return null;
  }
}
function sampleVideo() {
  if (!video || video.readyState < 2 || video.videoWidth === 0) return;
  emit(computeColor(video));
}
function throttledSampleVideo() {
  const now = Date.now();
  if (now - lastSampleAt < VIDEO_SAMPLE_INTERVAL_MS) return;
  lastSampleAt = now;
  sampleVideo();
}
function detachVideo() {
  if (!video) return;
  video.removeEventListener("loadeddata", throttledSampleVideo);
  video.removeEventListener("timeupdate", throttledSampleVideo);
  video = null;
}
function attachVideo() {
  video = getVideoElement();
  if (!video) return;
  video.addEventListener("loadeddata", throttledSampleVideo);
  video.addEventListener("timeupdate", throttledSampleVideo);
  if (video.readyState >= 2) sampleVideo();
}
function loadImage(url) {
  if (typeof Image !== "function") return;
  const img = new Image();
  imgLoader = img;
  img.onload = () => {
    if (imgLoader === img && activeUrl === url) emit(computeColor(img));
  };
  img.src = url;
}
function watch(url, type) {
  activeUrl = url;
  activeType = type;
  imgLoader = null;
  detachVideo();
  if (!url || !type) {
    emit(null);
    return;
  }
  if (type === "image") loadImage(url);
  else attachVideo();
}
function retryAttach() {
  if (activeType === "video" && activeUrl && !video) attachVideo();
}

// src/client/styles.ts
var STYLE_PLUGIN_ID = PLUGIN_PKG;
var GLOBAL_CSS = (
  /* css */
  `
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
     自动变半透明；即使结构识别失败也保证壁纸可见。
     !important 必须保留：主题包在 body[data-ds-dark-theme]（同特异性）上定义
     暗色值，且 theme-presenter 会内联写 token——不加会被暗色模式压回不透明。 */
  --dsw-specific-sidebar-fill: var(--wp-surface-fill) !important;
  --dsw-alias-bg-base: transparent !important;
}

body[data-wp-active][data-ds-dark-theme] {
  --wp-sidebar-solid: var(--dsw-static-neutral-bluish-900, #1b1c22);
  --wp-base-solid: var(--dsw-static-neutral-bluish-950, #101014);
}

body[data-wp-active] [data-wp-frame] {
  background: transparent !important;
}

/* ===== 表面质感：毛玻璃 / 液态玻璃 =====
   作用于前景 UI 元素（输入框、新对话 hero、设置面板与卡片），
   不作用于整片背景列——背景的模糊由壁纸自身的高斯模糊滑杆负责。
   CSS Modules 类名保留原始局部名作后缀（如 _2WTFBq_bar），用 [class*=] 匹配。 */
body[data-wp-active][data-wp-finish='frosted'] [class*="_composerHero"],
body[data-wp-active][data-wp-finish='frosted'] [class*="_hero"],
body[data-wp-active][data-wp-finish='frosted'] [class*="_bar"],
body[data-wp-active][data-wp-finish='frosted'] [class*="_panel"],
body[data-wp-active][data-wp-finish='frosted'] [class*="_card"] {
  backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.4);
  -webkit-backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.4);
}
/* 液态玻璃：更高饱和与亮度补偿的折射感 + 白色高光渐变与内描边 */
body[data-wp-active][data-wp-finish='liquid'] [class*="_composerHero"],
body[data-wp-active][data-wp-finish='liquid'] [class*="_hero"],
body[data-wp-active][data-wp-finish='liquid'] [class*="_bar"],
body[data-wp-active][data-wp-finish='liquid'] [class*="_panel"],
body[data-wp-active][data-wp-finish='liquid'] [class*="_card"] {
  backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.9) brightness(1.06) contrast(1.04);
  -webkit-backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.9) brightness(1.06) contrast(1.04);
  background-image: linear-gradient(
      135deg,
      rgb(255 255 255 / 0.16),
      rgb(255 255 255 / 0.04) 38%,
      rgb(255 255 255 / 0.02) 62%,
      rgb(255 255 255 / 0.12)
    ) !important;
  box-shadow:
    inset 0 0 0 0.5px rgb(255 255 255 / 0.2),
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    inset 0 -1px 0 rgb(255 255 255 / 0.05) !important;
}

/* ===== 逐组件"恢复不透明"（开关关闭时；打标为尽力而为，失败仅该区域保持透明） =====
   token 重定义同样带 !important：元素级 !important 在级联上仍胜过 body 级 !important。 */
body[data-wp-active]:not([data-wp-t-sidebar='1']) [data-wp-sidebar] {
  --dsw-specific-sidebar-fill: var(--wp-sidebar-solid) !important;
  background: var(--wp-sidebar-solid) !important;
}
body[data-wp-active]:not([data-wp-t-topbar='1']) [data-wp-frame]::before {
  background: var(--wp-sidebar-solid) !important;
}
body[data-wp-active]:not([data-wp-t-main='1']) [data-wp-center] {
  --dsw-alias-bg-base: var(--wp-base-solid) !important;
  background: var(--wp-base-solid) !important;
}
/* 右栏有官方稳定属性 data-rightbar-col，无需打标 */
body[data-wp-active]:not([data-wp-t-rightbar='1']) [data-rightbar-col] {
  --dsw-alias-bg-base: var(--wp-base-solid) !important;
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
);
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-plugin="' + STYLE_PLUGIN_ID + '"][data-wp-global]')) return;
  const style = document.createElement("style");
  style.setAttribute("data-plugin", STYLE_PLUGIN_ID);
  style.setAttribute("data-wp-global", "");
  style.textContent = GLOBAL_CSS;
  (document.head ?? document.documentElement).appendChild(style);
}

// src/client/settings.tsx
var import_react = require("react");

// src/client/format.ts
function ascii(bytes, offset, length) {
  let out = "";
  for (let i = offset; i < Math.min(offset + length, bytes.length); i++) out += String.fromCharCode(bytes[i]);
  return out;
}
function indexOfAscii(bytes, token, from, to) {
  const end = Math.min(to, bytes.length);
  outer: for (let i = from; i <= end - token.length; i++) {
    for (let j = 0; j < token.length; j++) {
      if (bytes[i + j] !== token.charCodeAt(j)) continue outer;
    }
    return i;
  }
  return -1;
}
function detectPng(bytes) {
  const windowEnd = Math.min(bytes.length, 4096);
  const actl = indexOfAscii(bytes, "acTL", 8, windowEnd);
  const idat = indexOfAscii(bytes, "IDAT", 8, windowEnd);
  const animated = actl !== -1 && (idat === -1 || actl < idat);
  return {
    kind: "image",
    animated,
    mime: "image/png",
    label: animated ? "APNG" : "PNG"
  };
}
function detectWebp(bytes) {
  const animated = indexOfAscii(bytes, "ANIM", 12, Math.min(bytes.length, 4096)) !== -1;
  return {
    kind: "image",
    animated,
    mime: "image/webp",
    label: animated ? "动图 WebP" : "静态 WebP"
  };
}
function detectMp4(bytes) {
  return { kind: "video", mime: "video/mp4", label: "MP4" };
}
function isMp4(bytes) {
  return bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp";
}
function detectFormat(bytes) {
  if (bytes.length < 12) return null;
  if (ascii(bytes, 0, 3) === "GIF") {
    return { kind: "image", animated: true, mime: "image/gif", label: "GIF" };
  }
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
    return detectPng(bytes);
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return detectWebp(bytes);
  }
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return { kind: "image", animated: false, mime: "image/jpeg", label: "JPEG" };
  }
  if (isMp4(bytes)) {
    return detectMp4(bytes);
  }
  if (bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163) {
    return { kind: "video", mime: "video/webm", label: "WebM" };
  }
  return null;
}
var ACCEPT_ATTR = "image/gif,image/png,image/apng,image/webp,image/jpeg,video/mp4,video/webm,.gif,.png,.apng,.webp,.jpg,.jpeg,.mp4,.webm,.m4v,.mkv";

// src/client/settings.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var STR = {
  zh: {
    title: "壁纸",
    enabled: "启用壁纸背景",
    pick: "选择图片 / 视频",
    picked: "当前壁纸",
    none: "未设置（支持 GIF / APNG / 动图 WebP / PNG / JPEG / MP4 / WebM）",
    clear: "清除壁纸",
    reset: "恢复默认",
    fill: "填充方式",
    fillCover: "填满（裁剪）",
    fillContain: "适应（完整显示）",
    fillFill: "拉伸",
    fillTile: "平铺",
    blur: "高斯模糊",
    brightness: "亮度",
    dim: "压暗",
    tint: "界面色调跟随背景",
    tintStrength: "色调强度",
    finish: "表面质感",
    finishNone: "无",
    finishFrosted: "毛玻璃",
    finishLiquid: "液态玻璃",
    frostStrength: "玻璃强度",
    finishHint: "作用于输入框、新对话与设置面板等前景 UI；背景模糊请用高斯模糊滑杆",
    transparency: "组件透明化",
    tSidebar: "侧栏",
    tTopbar: "顶栏 / 标题栏",
    tMain: "主内容区",
    tRightbar: "右栏",
    tCards: "卡片与面板",
    surfaceOpacity: "表面不透明度",
    videoTileNote: "视频平铺不支持，将按「填满」处理",
    unsupported: "不支持的文件格式：",
    loadFailed: "壁纸读取失败（浏览器存储可能已被清理）",
    needEnable: "选择壁纸后自动启用"
  },
  en: {
    title: "Wallpaper",
    enabled: "Enable wallpaper background",
    pick: "Choose image / video",
    picked: "Current wallpaper",
    none: "Not set (GIF / APNG / animated WebP / PNG / JPEG / MP4 / WebM)",
    clear: "Clear wallpaper",
    reset: "Reset to defaults",
    fill: "Fill mode",
    fillCover: "Cover (crop)",
    fillContain: "Contain (fit)",
    fillFill: "Stretch",
    fillTile: "Tile",
    blur: "Gaussian blur",
    brightness: "Brightness",
    dim: "Dim",
    tint: "Tint UI with background color",
    tintStrength: "Tint strength",
    finish: "Surface finish",
    finishNone: "None",
    finishFrosted: "Frosted glass",
    finishLiquid: "Liquid glass",
    frostStrength: "Glass strength",
    finishHint: "Applies to composer, hero and settings panels; use Gaussian blur for the background",
    transparency: "Component transparency",
    tSidebar: "Sidebar",
    tTopbar: "Top bar / title bar",
    tMain: "Main content",
    tRightbar: "Right bar",
    tCards: "Cards & panels",
    surfaceOpacity: "Surface opacity",
    videoTileNote: "Tiling is unavailable for video; falls back to cover",
    unsupported: "Unsupported file format: ",
    loadFailed: "Failed to load wallpaper (browser storage may have been cleared)",
    needEnable: "Picking a wallpaper enables it automatically"
  }
};
function useStrings() {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "en";
  return lang.toLowerCase().startsWith("zh") ? STR.zh : STR.en;
}
async function onPickFile(e, onError) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  try {
    const head = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
    const det = detectFormat(head);
    if (!det) {
      onError(file.name);
      return;
    }
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `wp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    const prev = getSnapshot().mediaId;
    await putMedia({ id, blob: file, mime: det.mime, name: file.name, addedAt: Date.now() });
    if (prev && prev !== id) void deleteMedia(prev);
    set({ mediaId: id, mediaType: det.kind, formatLabel: det.label, mediaName: file.name, enabled: true });
  } catch (err) {
    console.warn("[dsh-plugin-wallpaper] pick failed", err);
  }
}
function onClear() {
  const prev = getSnapshot().mediaId;
  if (prev) void deleteMedia(prev);
  set({ enabled: false, mediaId: null, mediaType: null, formatLabel: null, mediaName: null });
}
function Diagnostics() {
  const s = (0, import_react.useSyncExternalStore)(subscribe, getSnapshot);
  const active = isActive(s);
  let diag = "—";
  try {
    const q = (sel) => document.querySelector(sel) !== null;
    const col = document.querySelector("[data-wp-sidebar]") ?? document.querySelector("[data-rightbar-col]");
    const bg = col ? getComputedStyle(col).backgroundColor : "n/a";
    const fill = getComputedStyle(document.body).getPropertyValue("--dsw-specific-sidebar-fill").trim();
    const fallback2 = document.body.hasAttribute("data-wp-fallback");
    diag = `frame:${q("[data-wp-frame]") ? "✓" : "✗"} sidebar:${q("[data-wp-sidebar]") ? "✓" : "✗"} center:${q("[data-wp-center]") ? "✓" : "✗"} fallback:${fallback2 ? "✓" : "✗"} · bg=${bg} · fill=${fill.slice(0, 60) || "∅"}`;
  } catch {
    diag = "unavailable";
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-hint", children: [
    "v",
    PLUGIN_VERSION,
    " · active:",
    active ? "1" : "0",
    " · ",
    diag
  ] });
}
function WallpaperSection() {
  const s = (0, import_react.useSyncExternalStore)(subscribe, getSnapshot);
  const t = useStrings();
  const [error, setError] = (0, import_react.useState)("");
  const hasMedia = s.mediaId !== null;
  const thumb = hasMedia ? currentObjectUrl() : null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "wp-section", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row-main", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wp-title", children: t.title }),
          !hasMedia && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wp-hint", children: t.needEnable })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: s.enabled,
              onChange: (e) => set({ enabled: e.target.checked })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.enabled })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row-main", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.picked }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-hint", children: [
            s.mediaName ?? t.none,
            s.formatLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-badge", children: [
              " ",
              s.formatLabel
            ] }) : null
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-btn", children: [
          t.pick,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "file",
              accept: ACCEPT_ATTR,
              style: { display: "none" },
              onChange: (e) => {
                setError("");
                void onPickFile(e, setError);
              }
            }
          )
        ] })
      ] }),
      thumb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-thumb", style: { backgroundImage: `url("${thumb}")` } }) : null,
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-error", children: [
        t.unsupported,
        error
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.fill }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            className: "wp-select",
            value: s.fit,
            onChange: (e) => set({ fit: e.target.value }),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "cover", children: t.fillCover }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "contain", children: t.fillContain }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "fill", children: t.fillFill }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: "tile", children: [
                t.fillTile,
                s.mediaType === "video" ? " *" : ""
              ] })
            ]
          }
        )
      ] }),
      s.mediaType === "video" && s.fit === "tile" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wp-hint", children: t.videoTileNote }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-range-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.blur }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "wp-range",
            type: "range",
            min: 0,
            max: 40,
            step: 1,
            value: s.blur,
            onChange: (e) => set({ blur: Number(e.target.value) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-value", children: [
          s.blur,
          "px"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-range-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.brightness }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "wp-range",
            type: "range",
            min: 20,
            max: 200,
            step: 5,
            value: s.brightness,
            onChange: (e) => set({ brightness: Number(e.target.value) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-value", children: [
          s.brightness,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-range-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.dim }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "wp-range",
            type: "range",
            min: 0,
            max: 90,
            step: 5,
            value: s.dim,
            onChange: (e) => set({ dim: Number(e.target.value) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-value", children: [
          s.dim,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-row", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-check", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: s.tintFollow,
            onChange: (e) => set({ tintFollow: e.target.checked })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.tint })
      ] }) }),
      s.tintFollow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-range-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.tintStrength }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "wp-range",
            type: "range",
            min: 0,
            max: 50,
            step: 1,
            value: s.tintStrength,
            onChange: (e) => set({ tintStrength: Number(e.target.value) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-value", children: [
          s.tintStrength,
          "%"
        ] })
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.finish }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            className: "wp-select",
            value: s.finish,
            onChange: (e) => set({ finish: e.target.value }),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "none", children: t.finishNone }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "frosted", children: t.finishFrosted }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "liquid", children: t.finishLiquid })
            ]
          }
        )
      ] }),
      s.finish !== "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-range-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.frostStrength }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: "wp-range",
              type: "range",
              min: 4,
              max: 30,
              step: 2,
              value: s.frostStrength,
              onChange: (e) => set({ frostStrength: Number(e.target.value) })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-value", children: [
            s.frostStrength,
            "px"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-hint", children: t.finishHint })
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wp-title", children: t.transparency }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-grid2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: s.transparent.sidebar,
              onChange: (e) => setTransparency({ sidebar: e.target.checked })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.tSidebar })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: s.transparent.topbar,
              onChange: (e) => setTransparency({ topbar: e.target.checked })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.tTopbar })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: s.transparent.main,
              onChange: (e) => setTransparency({ main: e.target.checked })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.tMain })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: s.transparent.rightbar,
              onChange: (e) => setTransparency({ rightbar: e.target.checked })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.tRightbar })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: s.transparent.cards,
              onChange: (e) => setTransparency({ cards: e.target.checked })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.tCards })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-range-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.surfaceOpacity }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "wp-range",
            type: "range",
            min: 0,
            max: 100,
            step: 5,
            value: s.surfaceOpacity,
            onChange: (e) => set({ surfaceOpacity: Number(e.target.value) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-value", children: [
          s.surfaceOpacity,
          "%"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "wp-btn wp-btn-danger", onClick: onClear, children: t.clear }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "wp-btn", onClick: () => resetAll(), children: t.reset })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Diagnostics, {})
  ] });
}
var sectionLabel = () => typeof document !== "undefined" && document.documentElement.lang.toLowerCase().startsWith("zh") ? "壁纸" : "Wallpaper";
function registerSettingsSlots(ctx) {
  const slots = ctx.slots;
  if (!slots?.inject || !slots?.register) {
    console.warn("[dsh-plugin-wallpaper] ctx.slots unavailable; settings UI skipped");
    return;
  }
  try {
    slots.inject(
      "settings.section",
      () => slots.register?.({ name: "settings.section", id: PLUGIN_PKG, order: 860, label: sectionLabel }, WallpaperSection)
    );
  } catch (err) {
    console.warn("[dsh-plugin-wallpaper] settings.section registration failed", err);
  }
  try {
    slots.inject(
      "plugins.detail.section",
      () => slots.register?.(
        { name: "plugins.detail.section", id: PLUGIN_PKG, order: 60, label: sectionLabel },
        (props) => props?.subject?.kind === "bundle" && props.subject.pkg === PLUGIN_PKG ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperSection, {}) : null
      )
    );
  } catch (err) {
    console.warn("[dsh-plugin-wallpaper] plugins.detail.section registration failed", err);
  }
}

// src/client/index.ts
var name = PLUGIN_PKG;
var inject = ["slots"];
var unsubscribe = null;
var loadedMediaId = null;
async function loadMedia(id) {
  try {
    const record = await getMedia(id);
    if (!record) {
      set({ enabled: false, mediaId: null, mediaType: null, formatLabel: null, mediaName: null });
      setMedia(null, null);
      watch(null, null);
      return;
    }
    const url = takeObjectUrl(record.blob);
    const snapshot = getSnapshot();
    setMedia(url, snapshot.mediaType);
    watch(url, snapshot.mediaType);
    retryAttach();
    updateLayer(getSnapshot());
    notify();
  } catch (err) {
    console.warn("[dsh-plugin-wallpaper] media load failed", err);
  }
}
function clearMedia() {
  setMedia(null, null);
  watch(null, null);
  releaseObjectUrl();
}
function applyAll(s) {
  applySettings(s);
  if (s.mediaId !== loadedMediaId) {
    loadedMediaId = s.mediaId;
    if (s.mediaId !== null) void loadMedia(s.mediaId);
    else clearMedia();
  }
  updateLayer(s);
}
function apply(ctx) {
  try {
    injectStyles();
    ensureLayer();
    start();
    unsubscribe = subscribe(() => applyAll(getSnapshot()));
    registerSettingsSlots(ctx);
    onTint((color) => {
      const body = typeof document !== "undefined" ? document.body : null;
      if (!body) return;
      if (color === null) body.style.removeProperty("--wp-tint");
      else body.style.setProperty("--wp-tint", color);
    });
    ctx.effect?.(() => {
      return () => {
        unsubscribe?.();
        unsubscribe = null;
        loadedMediaId = null;
        watch(null, null);
        stop();
        disposeLayer();
        releaseObjectUrl();
      };
    });
    applyAll(getSnapshot());
  } catch (err) {
    console.warn("[dsh-plugin-wallpaper] init failed; wallpaper disabled", err);
  }
}

return module.exports;
} });