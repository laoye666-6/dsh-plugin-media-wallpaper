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
var PLUGIN_VERSION = "0.2.4";

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
  textColorMode: "off",
  textColor: "#f5f6f7",
  accentAuto: false,
  transparent: {
    sidebar: true,
    topbar: true,
    main: true,
    rightbar: true,
    cards: true
  },
  opacity: {
    sidebar: 70,
    topbar: 70,
    main: 0,
    rightbar: 0,
    cards: 70
  }
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
  base.textColorMode = raw.textColorMode === "off" || raw.textColorMode === "auto" || raw.textColorMode === "custom" ? raw.textColorMode : bool(raw.textColorOn, false) ? "auto" : "off";
  base.textColor = typeof raw.textColor === "string" && /^#[0-9a-fA-F]{3,8}$/.test(raw.textColor) ? raw.textColor : base.textColor;
  base.accentAuto = bool(raw.accentAuto, base.accentAuto);
  if (isRecord(raw.transparent)) {
    base.transparent.sidebar = bool(raw.transparent.sidebar, base.transparent.sidebar);
    base.transparent.topbar = bool(raw.transparent.topbar, base.transparent.topbar);
    base.transparent.main = bool(raw.transparent.main, base.transparent.main);
    base.transparent.rightbar = bool(raw.transparent.rightbar, base.transparent.rightbar);
    base.transparent.cards = bool(raw.transparent.cards, base.transparent.cards);
  }
  if (isRecord(raw.opacity)) {
    base.opacity.sidebar = num(raw.opacity.sidebar, base.opacity.sidebar, 0, 100);
    base.opacity.topbar = num(raw.opacity.topbar, base.opacity.topbar, 0, 100);
    base.opacity.main = num(raw.opacity.main, base.opacity.main, 0, 100);
    base.opacity.rightbar = num(raw.opacity.rightbar, base.opacity.rightbar, 0, 100);
    base.opacity.cards = num(raw.opacity.cards, base.opacity.cards, 0, 100);
  } else if (typeof raw.surfaceOpacity === "number") {
    const legacy = num(raw.surfaceOpacity, 70, 0, 100);
    base.opacity = { sidebar: legacy, topbar: legacy, main: legacy, rightbar: legacy, cards: legacy };
  }
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
function setOpacity(partial) {
  set({ opacity: { ...getSnapshot().opacity, ...partial } });
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
    body.removeAttribute("data-wp-text");
    body.removeAttribute("data-wp-accent");
    body.style.removeProperty("--wp-frost");
    body.style.removeProperty("--wp-text-color-current");
    for (const k of ["sidebar", "topbar", "main", "right", "cards"]) body.style.removeProperty(`--wp-op-${k}`);
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
  body.setAttribute("data-wp-text", s.textColorMode);
  body.setAttribute("data-wp-accent", s.accentAuto ? "1" : "0");
  body.style.setProperty("--wp-frost", `${Math.round(s.frostStrength)}px`);
  if (s.textColorMode === "custom") body.style.setProperty("--wp-text-color-current", s.textColor);
  else body.style.removeProperty("--wp-text-color-current");
  body.style.setProperty("--wp-op-sidebar", String(Math.round(s.opacity.sidebar)));
  body.style.setProperty("--wp-op-topbar", String(Math.round(s.opacity.topbar)));
  body.style.setProperty("--wp-op-main", String(Math.round(s.opacity.main)));
  body.style.setProperty("--wp-op-right", String(Math.round(s.opacity.rightbar)));
  body.style.setProperty("--wp-op-cards", String(Math.round(s.opacity.cards)));
  const reduced = safeMatchMedia("(prefers-reduced-transparency: reduce)")?.matches ?? false;
  const lift = (v) => reduced ? Math.max(v, 90) : v;
  body.style.setProperty("--wp-op-sidebar", String(lift(Math.round(s.opacity.sidebar))));
  body.style.setProperty("--wp-op-topbar", String(lift(Math.round(s.opacity.topbar))));
  body.style.setProperty("--wp-op-main", String(lift(Math.round(s.opacity.main))));
  body.style.setProperty("--wp-op-right", String(lift(Math.round(s.opacity.rightbar))));
  body.style.setProperty("--wp-op-cards", String(lift(Math.round(s.opacity.cards))));
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
body[data-wp-active][data-wp-finish='frosted'] [class*="_navCell"] {
  backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.4);
  -webkit-backdrop-filter: blur(var(--wp-frost, 14px)) saturate(1.4);
}
/* 液态玻璃：折射感（更高饱和/亮度）+ 白色高光渐变 */
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
}
/* 玻璃态下输入框卡自身填充透明（只留磨砂/高光）——消除亮色填充形成的"异常边界" */
body[data-wp-active][data-wp-finish='frosted'] [data-composer-card],
body[data-wp-active][data-wp-finish='liquid'] [data-composer-card] {
  border-color: transparent !important;
  box-shadow: none !important;
  background: transparent !important;
}
body[data-wp-active][data-wp-finish='frosted'] [data-composer-card] *,
body[data-wp-active][data-wp-finish='liquid'] [data-composer-card] * {
  border-color: transparent !important;
  outline: none !important;
}

/* ===== 设置模态面板整体玻璃化 =====
   面板壳本身透明（诊断实测 bg=rgba(0,0,0,0)），只有内部卡片亮——
   面板顶栏区域会透出暗壁纸，与卡片明暗不一致。用 :has(_navList) 精确锁定
   设置模态根面板（插件页卡片不含导航列表，不受影响），铺一层玻璃底。 */
body[data-wp-active][data-wp-t-cards='1'][data-wp-finish='frosted'] [class*="_panel"]:has([class*="_navList"]),
body[data-wp-active][data-wp-t-cards='1'][data-wp-finish='liquid'] [class*="_panel"]:has([class*="_navList"]) {
  backdrop-filter: blur(calc(var(--wp-frost, 14px) + 6px)) saturate(1.25);
  -webkit-backdrop-filter: blur(calc(var(--wp-frost, 14px) + 6px)) saturate(1.25);
  background-color: color-mix(in srgb, var(--wp-glass-tint) calc(var(--wp-glass-a) * 85%), transparent) !important;
}
body[data-wp-active][data-wp-t-cards='1']:not([data-wp-finish='none']) [class*="_panel"]:has([class*="_navList"]) {
  background-color: color-mix(in srgb, var(--wp-base-solid) calc(var(--wp-floor-eff) * 100%), color-mix(in srgb, var(--wp-glass-tint) calc(var(--wp-glass-a) * 85%), transparent) calc((1 - var(--wp-floor-eff)) * 100%)) !important;
}

/* ===== 字体颜色（覆盖官方 label 令牌，压过主题与 presenter 内联写入） =====
   auto：--wp-text-color-current 由取色亮度自动计算（亮壁纸配深字/暗壁纸配浅字）；
   custom：使用用户选的颜色。 */
body[data-wp-active][data-wp-text='auto'],
body[data-wp-active][data-wp-text='custom'] {
  --dsw-alias-label-primary: var(--wp-text-color-current, #f5f6f7) !important;
  --dsw-alias-label-secondary: color-mix(in srgb, var(--wp-text-color-current, #f5f6f7) 78%, transparent) !important;
  --dsw-alias-label-tertiary: color-mix(in srgb, var(--wp-text-color-current, #f5f6f7) 58%, transparent) !important;
}

/* ===== 主色调跟随背景：把壁纸主色混入官方强调色静态令牌 =====
   静态令牌是别名层的引用源，覆盖它即全局生效（按钮/滑杆/链接/选中态）。
   基值来自 --wp-accent-base-*（初始化时捕获的原令牌值，见 index.ts），
   避免引用被覆盖的令牌自身造成循环。--wp-tint 缺省 transparent 时短暂
   退化为原色 58% 不透明，取色完成后恢复。 */
body[data-wp-active][data-wp-accent='1'] {
  --dsw-static-blue-400: color-mix(in srgb, var(--wp-tint) 42%, var(--wp-accent-base-blue-400, #7aa5e8)) !important;
  --dsw-static-blue-500: color-mix(in srgb, var(--wp-tint) 42%, var(--wp-accent-base-blue-500, #4176e6)) !important;
  --dsw-static-blue-600: color-mix(in srgb, var(--wp-tint) 42%, var(--wp-accent-base-blue-600, #3b63d6)) !important;
  --dsw-static-deepseek-450: color-mix(in srgb, var(--wp-tint) 42%, var(--wp-accent-base-deepseek-450, #6f9fe8)) !important;
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
/* 预置壁纸：横向滚动的缩略图卡片 */
.wp-presets {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  align-items: flex-start;
}
.wp-preset {
  flex: 0 0 152px;
  display: grid;
  gap: 6px;
  padding: 8px;
  border-radius: var(--dsw-radius-md, 12px);
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
  background: var(--dsw-alias-bg-layer-2, transparent);
  backdrop-filter: blur(10px) saturate(1.3);
  -webkit-backdrop-filter: blur(10px) saturate(1.3);
  min-width: 0;
  align-content: start;
}
.wp-preset-thumb {
  width: 100%;
  height: 78px;
  object-fit: cover;
  border-radius: var(--dsw-radius-sm, 8px);
  display: block;
}
.wp-preset-name {
  font-size: 0.88em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wp-preset-size {
  color: var(--dsw-alias-label-tertiary, inherit);
  font-size: 0.8em;
  white-space: nowrap;
}
.wp-preset-actions {
  display: grid;
  gap: 4px;
}
.wp-preset-dl {
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  align-items: center;
  gap: 4px;
}
.wp-preset-dl-label {
  color: var(--dsw-alias-label-tertiary, inherit);
  font-size: 0.74em;
  white-space: nowrap;
}
.wp-mini-btn {
  cursor: pointer;
  padding: 3px 6px;
  border-radius: var(--dsw-radius-sm, 8px);
  border: 0.5px solid var(--dsw-alias-border-l2, transparent);
  background: var(--dsw-alias-bg-layer-3, transparent);
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 0.78em;
  white-space: nowrap;
}
.wp-mini-btn:hover {
  filter: brightness(1.1);
}
/* 一键应用按钮与进度条 */
.wp-preset-apply {
  width: 100%;
  padding: 5px 8px;
  font-size: 0.86em;
}
.wp-preset-apply:disabled {
  opacity: 0.6;
  cursor: default;
}
.wp-progress {
  position: relative;
  height: 16px;
  border-radius: var(--dsw-radius-sm, 8px);
  background: var(--dsw-alias-bg-mask-2, rgba(0, 0, 0, 0.12));
  overflow: hidden;
}
.wp-progress-bar {
  height: 100%;
  background: var(--dsw-static-blue-500, #4176e6);
  opacity: 0.75;
  transition: width 0.15s ease;
}
.wp-progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72em;
  color: var(--dsw-alias-label-primary, inherit);
  font-variant-numeric: tabular-nums;
}
/* 手动下载折叠区 */
.wp-preset-manual {
  font-size: 0.86em;
}
.wp-preset-manual-summary {
  cursor: pointer;
  color: var(--dsw-alias-label-secondary, inherit);
  padding: 2px 0;
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

// src/client/presets-data.gen.ts
var PRESETS = [
  {
    "id": "miku-city",
    "name": "初音ミク · 都市夜景",
    "kind": "image",
    "mime": "image/jpeg",
    "sizeLabel": "4.2MB",
    "hint": "",
    "thumb": "data:image/jpeg;base64,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",
    "downloads": [
      {
        "label": "下载",
        "github": "https://raw.githubusercontent.com/laoye666-6/dsh-plugin-media-wallpaper/main/presets/miku-city.jpg",
        "cdn": "https://cdn.jsdelivr.net/gh/laoye666-6/dsh-plugin-media-wallpaper@v0.2.4/presets/miku-city.jpg"
      }
    ]
  },
  {
    "id": "mizu-mirror",
    "name": "水镜初音 · 视频",
    "kind": "video",
    "mime": "video/mp4",
    "sizeLabel": "8.6MB（压缩包）",
    "hint": "下载后解压出 1080P 视频，再用「选择图片 / 视频」选用",
    "thumb": "data:image/jpeg;base64,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",
    "downloads": [
      {
        "label": "下载",
        "github": "https://raw.githubusercontent.com/laoye666-6/dsh-plugin-media-wallpaper/main/presets/parts/mizu-1080p.zip.001",
        "cdn": "https://cdn.jsdelivr.net/gh/laoye666-6/dsh-plugin-media-wallpaper@v0.2.4/presets/parts/mizu-1080p.zip.001"
      }
    ]
  },
  {
    "id": "hatsune",
    "name": "初音 · 视频",
    "kind": "video",
    "mime": "video/mp4",
    "sizeLabel": "49.3MB · 3 卷",
    "hint": "2K 分卷：全部下载后用命令合并再解压 —— copy /b hatsune-2k.zip.001+hatsune-2k.zip.002+hatsune-2k.zip.003 hatsune-2k.zip",
    "thumb": "data:image/jpeg;base64,/9j//gAPTGF2YzYzLjEuMTAxAP/bAEMACAoKCwoLDQ0NDQ0NEA8QEBAQEBAQEBAQEBISEhUVFRISEhAQEhIUFBUVFxcXFRUVFRcXGRkZHh4cHCMjJCsrM//EALwAAAEFAQEBAAAAAAAAAAAAAAUGBAMCBwEACAEAAgMBAQAAAAAAAAAAAAAABAMCAQAFBhAAAgAEAwQGCAMFBQYFBQEBAQIDABEEITESBUFRYXGBEyIykaGxUsEGQtFiFHIjM4LwkuEkQxWiU8Ky8dJUY5M0g1UW4rMlB0SjcxEAAQMCBAMGBAQFAwMFAQAAAQIAEQMhEjEEQVFhcZEigROhsTJCBdHB8BRiUuEzI5LxgnJTotKjwiREY5P/wAARCAEOAeADASIAAhEAAxEA/9oADAMBAAIRAxEAPwBJ1nlZrMkOE8ZgiKWY5AT3H5awEmABuXSs+ksdmlMIse3hN7JepHTSYI1hHgpr7sRPbhkOvXTLrnNI1FFRACxfLMA9CRB8GPn08n05kMhZxlhuUifs4o0vy4N0gy3jwmgRWht8p8xuPWJbSVj/ANotYUb5oZ7J+YzQ+WE5oPcqBWy+6rr8p/DsZPYd12UbSTgcJIbbgaIgiDIykrZ9ERTznQrxRdWAfeBNvk6ofp9ZSqjJfdU0MmJpxmuRmoOlugy5jLpidIBmb7O0uons8mpMsa3dYjQ2qJeFYdyKqaNv/qPfIwmbLUGowMxUibixfS0uq8lKqdRIqUlZoOx4pOxc7QYiZjrGImOsvUuXHiAb0H0T1rlN8P1fSa74zTPQtxoaKpdGpNP9tRBJHinNjqE5Anolwluxxc6B6f6TZrwjwoB0/wBKSyeNEfNvpMe+f2+pc0o0FC5UvUq2SBgR4k3LexIohpph93nvPv6zL7Yu0Y2zbtbhAzJ4Yq+2hz6xmOcttnWyXLOYlSFpvls8Xs3ZRkCQJmmkkghWRz5vn1vqNTUVilNjSAhIshIOyR7v6RgR4dzCSLCYOjgMpG8H+MZmnFfhvbzWMUwY5Jtohz/0WPzD7T8w652cOpAYEEEVBGIIO8Txa9FVFUZg/CeP8326FYVkzbEPiHD+TsQDmAZga2t28UGE3Sin1iZNU1NSCZQJ6N7bHZ9kf/5bY/8ApQ/+WYzsywbO1gdSAeqXcN6mh6plZwszlYMYldpcCKcSoJjmA09cbOt7BfxNrD7JlIL0LUK78CSMM+ism7eOseGHHWOB4TxomsFSoIIIIO8GR9vbC1aqOxGRU0NeHXLZxohZOIfCTeRwP4NAq00nu5bwI8WZMj7xWaCWXxQyHXqz9FZd6w03C8ZSk4CC3yF5GW2to6x4YfL2hwMgbxIjO0Rl7rZchurwl1boIMeLDLUoaBfaGYPlJPOSgRSWSm4OXQsRayRh4Z9XgVxGudn38VoMR4ZVyQRwONDuI5GdA2T8UwbrTCu9MGLkHyhv0+yfRLjbHw6t0WjWxCRCMYbeB+g/KfR0TlUW1jwYrQosMw3XNSKU/pwM9P8AtahI4/8AcHzDiSo7D0L17be1LG1hdlFCR2iUpDzAB+diMgMxTE7pT0SBb3sIeGIhHdYbug7pRlvs+7vIohwYbRW5ZKPuJwA6Z0zZXw1EtQGuLjPOFC8P7zNmegDpmgqnphBVf17NnvKVVun+TGJANFRATQAAAVOHRPLrYt5dQlCoE7wNYh0+jFj0ATpEKCkEUQKByGPnMukVrv8AV0SOvXqMhKQBzuyUaSLqVfk8rh/B96fFcwU/dY/Sev8ABVxuu4bH8jD3zorJfM1ViQIa7l0M56zqX0S5QRh+0MNuahl9B1euUHUVf4k9IbRST/Crq8gi/CG0E8DwX6WK+safTIe52RtW0WsS1iFfaQCIvmlfTO+zGy4HSdJ4inqOE2nV1BmEl40Uxu/mw2sYrrKELxMwLWG3eE7ve7MN2pWMLaJXJuzaE388Nzj0gyh1+FdF4PxkSJDtvbWj47lZwKKPuKiTkalBF8x4z0YuBcwYubbdty0VrEXBR1yShWjFanuidQb4Q2eEBt3iI1Kgs3aKenI9YMoraUG62bFWDGh4udMMjFHxpgfWMxORXTWMAxyNi31cWjpg06eNZtizA+wdbKx/ExRChJqbMs2SjieUrgWFvsyFqS2e8jbu7UA9GIUebSUsLGHYQRDXFjQxH3s30G4TJdX1vZrWK4B3KMXPQPflIa6xWqEgkcN1dYYo80gmpUOI9iegyefXlxe3DER0MMex2ehR5ip6zKcunSBTAGuYOI+olb3PxFFiVWDCRV4xO+T1eEemUVeQfxjmISEY+yoVT+6tPRJ1OYugI6FioFSlUxecaid0qGfjPtDbI1vHFP2ZO6uHVultEsoiYjvDln5fSewLfsolIow3cG6D7jJEv2PFk471+omc4SzFKTWkIJlIkoUZj/io3IafroOUxE6jgJU8WBCuFrhXcw/jESn7i3eAceo7jLJY4bYgrmJbxihyGMzF2Oc1aFVagialsFs2zDMowmnjOLTbtSooQJhClsZhLdHhzZNVLkKMSTQDmZNRIhtB+Ft/2hH60QZ13qDuUb5abOosR4xygw2cfmyX0y1diIdfmiEljyr7zI75ix5lTCbpRFtis3vxCReOJfCIYzdmO8qMPMnGZ4MaLantIL6h8y7iODrw5yOrN0co1fMcRwnN6kYkkHv8UqiDyysyd3Dhsi3MEURzRk/033joOYkXJe0oWj23yxoZZPzKNS/SQtZzhRkYkGThgpJzKFZTzFx4O0k7A9oI8A/3kMkfmTEe+RWckLAOt1BbQ9NYB7pyOB3TcFzrJmkvjEjqLj1DhWdF2a3bWLKdwlGPZx1iuohRDRiPA3HolZbDt7gI6tCcYbxSZ4TEvm/UUGppwpIJIKVCM2h4y6YrDnJCOKwYD8QQeqXN7s66/EPSHv4r9Z7GgPBsoYcAERDvrhSZYVWMW+76dNC/JxFKgCgGSGLIIAPGYSZIXH7GCeRkWxmxcOEQX6uMvFiDsuz0LXUG1/MBQjT0HPpEj5cCWhtyblRU0kptHZcbZ6QjFMOsQalVW1GnE03HdIYPQ1mS4uotwQYjs5ACiprQAUA6BOMyIiLzx5Q5JwwZF9uTZmYpsTMRMxLzf273CBjB103lQSOuWj6q1IOPESptj3MCDaxQ8RVYkkAmm6Xu040FtnkKyMaIMCCcxMxk+IrVrRqTT8ixqBGO4kcTbZotGIylebB+I4lhSBcViW5OG94PNeK8V8pz9ZcgzFdNNROFQke3R9lNQ01Yk2L+mILw7hFiwnWIjCqspqDLmcA2Ttu62TEqh1wmPfgse63Mey3Mdc7Xb3qXttCjQ1dFiLqo4ow/jjkRPDraddJXFJyP35vs09WhaCTZQzTx6OUijVrlkZ9NGYKKn+OjiZbukSKviMLgBQn9/kd6jzmLRC6pt/IP0e7hW4qxJ3UUVNfV5mQsTbD/AN3CH7xqacgKCvXI27uHjxMQulO6ujBaDeFOVc85aIGc0VWY8ACfVJyKKQJUL9bOikDm1HCvbqM0PsuxYMce62C7z493CTP4z8OaR1Kqcog7yfvb166jnIvZlv2KsWVkdzkwphy6d8mSK4HEHdI1TBijCIHDNxCikym3s2ZAubkxBTs1AFfbIxB6MfVJCYURYahUUKoyAymUmgJ4SpRmAMhYO8WIknPdh9q7Rh7NtzEahdqiGntNz+0b5zHZ2z7zb148RnIXVWNGONPtUbzTIZATq8WwtLtq3UCHGOnDVU6K/KMaDql9aWkCzhLBgIERa4Z55kk4k8zLk1hSQQkd4/Nt4OSaJWZJtwcdraW9hBEOCgRRmfmY8WOZP8CXQBOJ6hw6efqmzYsBuXE9O76z4yJJNzmd2VhCbDIPs+n0+mnb9Pp7PJzz5Pp7NTNuJcZFcJYRzHgKXhJ2yjxQq0en2Hf+U9Rl+DMbtpxOW/lz6JmnPixyxVrfwtOuGsUQzmmgsEO+mjVpPFTTqktFS1vkCt2cWjK65Eq6moYDMEH6GQV5aRYcQ3dn3Yv95D+WMOY9r19MiXuIN4puIPciL+3hZMPvHGnzcs8pf5SVkKBKeecHn93JFUp7ioP4u+29tts5vw6Qm7YrXWR3ADvWvi9Q3znD3sWK5dlLscyWJJ/yyqtpBrmGGb9VoQOnVj3d4FfMdEptYqth4eU9GlT8tO07niwawhXLZw/iCM4bjox+kyCPDOZ0/mFP6TPWfagcJax/B8wYbiD1iYtFOa8MyOjj0TJ2aH5R1YH0TXsyPC7Dke8PTj6ZzWtCViD/AKdGPgxmhRuypqRsRTMdHvElWVIilWAYGWjI4cRNALDeu/pBx6xWaQ7xWjGGymHXKvH+u6bd3BSLqGG6uYP4hi7qB2G6qnwn3HnIzEyt2RYilWFQcxKTuITWsQqcVOKniPqN85tSZYmiVxlux0numXcQF8hLMqYZxFZgWQn8hqK1P9lvPyw/96WcY+D8gl3s/vmNB/1YTBfzLiJZt3oYO9O6ejd9JU+em1Vf/JJ8FIgeohwSUt7y2hACJYwI1N5aIrH/ADEeiRM+znMhSAoQcupHsQ9Dsdo7JaLAH4EQnbwkAOBnvwPol8l5sV2IT8Mhrk0MIf8AMoHplE2dBc6vlt4TMTzA+pkGWqSeMyCoL5yNMlVRUKWISn5icySM+Udr2VexYfp9mR9ukj0TZcCOkTjSuyGqsVPIkeqTNrtG9V0UR3ILAUbvb/urLxUHBkGgUAnFPV6ncftX6Zf7P+fqnP7jbUdLmKrIjgMRvU4eYlUbG2mkcPWGy9YI90xWQaUbwHS6iU6bEowMKbnwcl9+2aQW01/sKnhG9Yl9d39q9ww7VQa5NVfXhLW9pF2fECkNQ6xQg5dEkATSSOj7aIqaSAQe5seAaZuP2EHoMiGMlLo0hQR9shmMijLt93zSL+A9nIszzAkyEy8ZOi/EzGTPCZjrOcneswEzast2MwLkA1Ha7JiXVr+IWIoGPdIO40zmR9gXikAGG1eDU9Ynllttbe0W3MEtT5g33VypJsfEVq7oTDirSvA5jpmYyfnatT6oiqvDTxIxLw2Se78uRBYD/B75TTsq04FT75YOjQ2KMKMpoQd0ruHtuxZmJZlqFpVTurwlF3UQRrmK64hnJHOpwmQb9JX1VVahXpYAEgg4SJJ2uSGY2Fs07TvAjD9KHR4p5bl6WOHRWdouI8GzgNFiEJDhj/gqjjuAkNsTZ67KsB2lFdx2sdjuNPCTwQYdNZZXFwt+5HddAaQ0wbdnT2j6J5ip1NX9id/zxfQ1GpToqQUQVKVkkZ/6Bvtk7atNpsU/ZR6nSjkYr/2zkTTxDPqk/cQ4nZOFK6ipC47zv6pTNvsO2IR40JQRQhV7pBHFlofKVRItUISvuGR29hfT0uqqqoDHS8s7SRMcSBkWEg7LhwlBiHtG4ZKPeZLIBDFAAByAHmB65swOBGNN01rNFRXcmXBSiC5sxPMV5j0/1mGunLy+nCRMTbEOC5SJAjIRx0+YxxE0EKVkJeC0ndna1mKNHS3TU3eJqFXjxJ5SwhbQtY/gcq2ZBFDpGLHhgAcjI1Wa+uhXInL2UG7y9MzTSknFICbn7MhFu9Y7BqK01smt6DViqgUCj6nnJJcpb5TeuEiq7xOzKpqwuRMRXjj/AB1TwjvdXrm4ymvzN0D3yviySJAfJ9N5rNuGF8mle8BxB9FJkljeO0KGIq4mGwYjipwYeRr1TYu4lvJoZpDiLFQOpqGH8DpG+bVm2suNsO959H9J8cec2mEYHT1jo/pMw0lwp3D2Z3YoeK8OlcuikpTbViYZ/GQKqR+1C4fv+5vOVZEBIqPEp1D3jrGE9OmIuNCrjI5EEZeUvQooM9vNwUmRDze2i9omlsSvpG76Smo0FViMmK95gtcVbH18pPXUL/Drx0xKr3l4tDbLpIy6RKEuNpXEWI2AClyQKZCuFZ6oIUAeOTHWKq6coTiKFQvpGbNBmhYPivHOkucGG4iR1rcGKNMSmr0N/WXdOyxGK7xw5j3iZZMf0LkoRkeo4j6+me6iMxTmMR9Z6CCKibTnF9BrPHhpEFGUH3dBzE80jMYHl75rqK+LLiMuvhNPdHbS65HUOBwPnkevzmCOiXSGGcGzFcCDx5jjSXams9KhhQis500NFhmGSDgRgRwljEER9xPQJW8eyWI4ieIgUod/Xx6ZFxYzQyVWDQjcRj/HRhMFE8GRTOI5pSBmVH2AuWGhRWhRFiKaFSCOqSt0n/8AXBGqFF8a+wx8StwxyMg5eWt5FtGJShVsGRhVGHAiYMepTUYWiCoCCDYLSflJ2O4OxdCITYq+nkwOHWAaz1SqHuViOcBQYDoGZMvzF2XF7zQo8E7xDZWXq1Yiffjre2H9kglX/wBWKQzj8oyHTOasdQiBSrE8FYUp/wBywTI6SS+x/wCxW3YV/WjUaL9ijJOneZCT1mLksxJJxJOZmk5k0qeBNziUoyo5SeXIZDk7SW2emu5gj7gT1YyJEn9n/prHj/6cMgfmfAe+bcNQYpq4kQOqrD3cMd9cWI3FmPpla7CXTAiOZQIxIE6NaL+H2cTlUGbOT5H1Pu6dFMfMpKQ0ddtrjuec+Y0hoo3y1c6nJ4mXUMa40NefqlmQ6PqU0wlKeQDtfmhReCiQ8v719UZuWHlLBc5inIN6sy3C4TwmfTQy+XAOpM0n01JmEuT4TLVjhMhMtiZptSHpVrsqziWdszQhqfs6mpBNc98um2FYmIAFde6Tgx4jjKIgbRv1RAsR9K0092ow6pJptq/DVLKTSmKD+ksGT8pU0evC1FGoGazHmKtJtaNmof8AALYlqRIgoaDI7hylp8O7OF1tTvDVDtiYjV3kGiDrbHqlmu3rpa1WEamuRHqMrTYoibP2O1ykJo1xeRCYcNRVmxKr0KBqck4SmsoppmM1d0eL6GgpatK1/qF40gApvOWewzZPbf4m+pZWxA1H9U+1T5MNwzYy82TsaDsxKmkSMR3onD7UG4c8zL+yt3hQw0RQIrDv46qVxKg+s757H2jaW5o8VdXsr3m8lrTrpPNUo4fLp5DOPmPHo+pQRVM1K0BSj3UWimnYTueJZCfeiUpG2+B+xg15xGp6Fr65ExNs375PDh/lT3sSZoUKh2jqy8SeIHb+Aa+7Nd9T0kn0VpMSigH8ZznBu7yKQGjuammbAY/vUl1AvbqxiFHqwr3obYdYO71GWjTqjMOFXCRZcnhhI9S1/LePbwrldMRa8DvHQZb293Cul1Q26VPiXpHvylrtS+/AWUePvVaLzZsF9JmAQrEALGWDivEMVHsfwTLEWJqV9a5Y7uGEm9kQ+68U7zpXoGfp9U4zs3aDi7HaudMSoOJoGORp6K853i1h9jAhJvCgnpOJ9Jl+olCMJMknOIs+nT+EN9WbTFWfE4p0/wCyZ5sNwblWpNEiJEiRUBBKhdXKtZiiRBDRnOSqWPUJA7MeIsaI7g/qrWvFg1cOOZmOGxLKQTB4BqWE2uGjcQK9O/0zcyOtYlGjQjmkQsB9sTvD0ky9rNRBeKpDvWYogERGQ4hgVPXhPZj1Uah35fSdDjMtN28c2sQw3HcBIfMkEYa+jiAMsZUlFIqKEHI5gyDvU7K4SMBgxFfzL/zL6pm1mwYYFrZ8UIxMOuNPy8vKWG8cS3FGJIUPEMrQDKo65hauedMfrMgYOAykMDiCMQZ9ODGIfJaMGVH0ipXvKOO+nrEuF3jh6t09mbWQ0Tt5Uj29vew8QO63HQ2OPNSPOUW0BCFKlK1xBAlbsKLtGxO7VGgj/MQPX5zlu0YEZ3h9mGNAVw4Zr6Kjqnp0h3cOcZdDcMKolZUMFQ01cR2EEM3oUVDsgFBkMeqYYUZYuoA1KGh+vXKa/B3HsxK9P9ZvarcW8QPocrk3R/SXxDQKdQkldRVQxAER2NTquNBhXw8CfZP+yeqb9OBGYmuBHEGXIHbruERMOTDdXkeO4ysnD0PozqNMapJQLVUiU/8A6JGx/cNjuHDPZoPIjAg5gzcTNgkEEgiCMw49BGKGh4fKfpN0ignSe63A+7jMgmrorihH1HROdTxcs0ZFfxAH3dB3S21vBwfvL7W8dMuwQRUGonOiIebzyeTyUsl2rPKzWeTnbtWeVms+m3nMkqKP/Z7WFA+Z/wBWJyr4V8sZH7PgqSY8X9lCxP3tuQdO/lPo0Vo0RnbNjX+k2GIv+5VCflp3V/y2HhmfBuLOEY0dFHGV3taILe0WEOFJFbAtMTGYYCWe2Lrto5UHBZ2ZfHqf/K16EC6aN1dWFTOSNoKF4h+USNGAklE/RtlTe+J6JkrKONn6BAkzwYiIaknjNVE9OJmQCZOeB+mIzKZ8kNojaVH0E3LtNJSlBKQVE2AGZLgoTMotYrfLTpwl60WHbDSgDtvbcJGRY0R/Ex6Mh6JXKjlbr9n0k6XT0P66lVF/9OkRCeSql78k9rkazf20rLN7SOu4N0TCZssWInhYj1emdKx8w7GSkaBVjp6iP3JqYj2KEPsG4uLZwUdkKnL+hwlc7L2ytzFEO5hKXeiqypWp5qATU8pb7M2Lc7Wh9rGRbaAM7iJ3QR9gNC3+7zlVwrnZmxVKbOgCLFpRrmLiT0ZGnIaR0zDzVTAEn08S+J9R+m6OrZKguRZYSU1EcjtPaGahbIgFGe6hwoMOpJ1BQ1DzOC+vlPI237KzQQbOGY2kBFOKwwBgBU95uoSj40e72g9YsRn6cEXoUYD1zNCgLDxzPH6TRpmpeoZ/aLJDFoaelpU4aYN81KJKlfboG8jX1/e/tophof7uH3AekjHzMtQoUUApM08pLAAnIR0bTJcU8m80mTp9BoayoFube+UQ7gBH+Vxh5Hd0HCU9LeJEx0Ji58lHE/ScQC6iWWuYFzYMHhknHuxBkPz8OjIyH2zfXm0LEQzB09m/aRGDDS6gd06a1BxqRJKHtT/D4QFwTFhVCmuLDVw4j7eGUhdqbTslaPDgnWsSGpUpiuK5cujdMkAE94XGRaV45ThAN7u2y9nwYz2VEBZ3QscchifQJ2mvePR75yr4KgxorRriIW0QlEKEDlqbEkdC4dc6h/efu+o/1kDUqlccB7sjSUlU0rKlYipRIzMDYXc80Y0Kfmp5gz2WV9X8NEZc0o46UIPukUCSAzuL5tCNog0AB1MFxy49eUtbaA5hfiySXVtQHFBUP5gmnRMF7FEeFalMn1NTnQCnUSZVcNBDhog+VQPKVLVgEc2fRANOePswlw34e5hXA8Dr2cQjKmat7+gSXrWWUWANLQTgjfsz7Jz0/unFeIw3SztYrwwYD4FMBXIcAftPytwwM6xEuGHtHtxZmYoi61p5THDjrEJXwuviQ+IcxxHAjCZprJxY4OtyjwIlQwqK76jJh9wzI902to6GGbWMNURO6UClqruYUBovAmnnNriAXqyHSxGk0pWm5lr865rKTv75HaNaw40W0EMCGb2hXvPj2bU7xJ3lRXMignEY7dnJvRYSMt+XNqN7d7RibeLDocTAiuBXoNcDz86zJDvYbEJEDW8Q5JEwDfkfwP1GvKc3tdg7NurjsYl5cvGYVDqiPCbodWif59Mkbj4W2ls9S9jdNGUZwvCSPyEtDfoPlLYCbKVfmIdlKKlwfF6GcGHPD3j3zYyhdj7V/EnsYyvCjJ3l7Mt2UTRiVaGdQhmgPh0jolbEltemncFSTllWmG+nlMZjNoVSUlUeLSG1W/D7QhRhvQauYxVh/LKNjlIRWIxooNCeA3E/xvlZbe8duftb1iUlFQRIbKd4M9al8APKOx8yp3V9CxhvbXtG/VWlB75pDuIHZ+MZn/ekkmylOTQ8gcuMtItiAhOtCMqUPGkyxF5FeulYKdMT/uDqkWE7MsN1YDHDcDu85kLtD/UXErmPaXePeOciIOz4llH1hwUoajGunD1ZybmXxCC6qY6VUVAMBnEOTmBh3aCLCIrl/wDS3uPumMGvqI3g8DI2DAjQLhnguoBIqhrQg47udaHdJhh2nfUUcYMp38jz9k5GVDuW29n0qlP9fSFVKcNYC4GVQcRzdJtNAazeXPhdX3OWRR4J1Q8V3p9Jez6c9LQFzaNAo6ntITeGIuR5HgeRkfLq3vI1tXSQVbxQ2GpG6R75ef8A4+5xq1m/AgxIXUR3llLljqUrVElY2WgSf9yReeaZHRiZ9JT/AA2I37ONbRBxEVR6GoZ5/hsUftItvDHFoq+oVM25fqaH/UT6z2RLFy+trRo9XY9nCXxxDkOQ4twAmemz7bEs12/sqCkLrY949UtLi8i3JAaiovhhqNKL0D35zTrHUq2pgoG9RYj/AASbk8zA6t/GuRECw4Q0QYfgXeeLNxYzJaW7XEVVUVqZZ20F4rAAVrOl7Psoez4JixaaqeUymHz9XqEaKnhRdZslOZJO548y73Dps2y0DxETnjOYjljvkhtO+a6jHHujKRizaXWg0xoUypd6lTvKPXZzKwUgnEDdMseP2zashkBKm2F8PDbcKO/4jsTCZVUaNdaitT3hQdEw7Q+GNp2BLGF28Mf3kGrfzLTWPIjnMPNp48OIYhaC+4iksICoseDSomWY982lzaA+gFjQZmXUVhBXs1zPjb3TyDRFaKflwHTLOjxW7oZyfZBJ9ExzPIe76iB+noBQ/qVgYO6aeVuaj6OEmYDJddl7Qi00Wd0a5foxKeZWkmYOxIdsQ19qdv8AQSqj9+LT0Q6/mmJUNjJ5MLDhuWmrLZ13tGJot4RemLN4UQcXc91R0mVra7O2ZsujRdO0bkbsRawz14xSP5ZmiXDmGIKBYMEZQoY0J0kZsebEmWgFTQTWEn4j4D8S4FRLd3V7cXhrFeoHhQd1F6FGHvmOFbl8WwX0mXEK3AxbE8OEvJaAAIFmsugUKKAUE8mSambayl0nk2nk044XQiYyJlOAlqaxcjpTe2RPRwHOc9gcMSLmE3Ztw5Di3Lzm8GF2Yx8TYsc+rqlq8K4MeAezaHAFSpy1nSTWmePOVJY2ES9f2Ya+N+HIc/VMSQkYjk4qTHixJsoV7RYoJQMMK0xoeHAeuWN3sSyhwLl1VwYa1XvGldNcZY7QjbT/ABcU2sOPDgayIIC1BUCgbLEsBUnnImNdbY7OKsTttLCkSsPdTedOGEzEwNpcYeqbIcWlhseFUBrp9ZG8jQxH+zKueIEjwV9vtB5AGUBtK1uFvdjvC0iHZw4AoTQ1w1bvZEqvarmC1rGHyRTXoI+gM89acRSf48XbePwcaVRH9xKVAmmUgj+H83Z+axF7RGT2lK+YpPgQQCMQcRN5ClnBoSwd2uYEBsgzGnA6k1eqdIiOIaliQAN7EKB0k4Ccy2ncLsfaAudOoHU6JlqLZiu4ahjylI3F1e7WrdXsV+y1aUhrgtc9KLlgM2NTLatM1lgiwIHazNP3aXethKnrMbalrEJhjaNih9n9p/n1qPICXogPFhw31o7gYRYeKnlQnvKd+M5xsWBZ3UXsW2WYopVoixnLIOLAlFp0Y8AZ0W02Smz4oNq7rCbxwWYlfzLvBHPPjKKiDROHfhb8GQCioJBjgYcxs1jqO0XQwy0mtOaNgwHI+U9S0jof/Mll4MgY+dQZJz6R8auL2EcG2WD7TluVAo9GPpnOttWf9rWEvhUNFPOJFdiT1KFUchOnSNj28I3EOOwJOCVw0gipUtvzNBurSXUKmFcm9jHVrqJ7hAtlLQ+w3j2zxvw8JXJQFgTjpBNDhQ1BzErrZtxEuIBMX9orsrYU5jDoIHVLS02XCtbqNcIzfq1ohpRamrU41OXCScFVVozjAMw6yAAT5y6stK5MXtffo1UgRba7TlrZrD2ltCMoFHZYS/miAM9OjOTzKsOAwAoGYKAOZCgeQmRRDBXQKAs7nOpYg1Jrjvm6ioSu4aus/wAGQ5ZqjPYB6NBbeb9aEhBBVSSMPmOGRPCUzKh2u3aXVftB8ySP8tJBUxn0FH+mno/P14xqji09H2stnGaE0N20hQKEZYkeg0kd/jkLRpMJ8+I9qsn4ljb3Ed2iA10riDTjI19lWZh69DVr7R9qk2YZ9LzlISQUxh/OzbPt2ASD2TkUIpUb6SQtI63EBIi13ihzFDTGYG2NZh1GhqEN8x3Ume3gQ7YvDh1C1qATXGg9dfRNg3adVSq+XiVhOE7Z3czxOx/VpqC5jkfoZZPtRNRdYbA0AGIoeTcvVJFlDKVORBB65ZJYWzAnSfCD4jniD6pkqN2jSKrGU01AYb358LN7CjJdJ2sLxCnaQ/m/48DkwwmcEEVGMpy1ULpiI5R6kV3UrkRvHESdWIH1MBQjGIgx/wDUXiOP1mN0Z/Ccjw6udTDrZUkBNdPxo2qgfMn93EbtxPp9nPZm+XLSu0NhxrclkGpeIlLsjIaEETpljt+DHAWNgeP1EkYuz7C9GpdOO9aeqUTGb5CPqWo0hwaukox86d3j08nSYnwxDPheYV+FxXFxN4gzx9Z0RE+YRygy89AJyEmbLZke6YUU0lfwdhWdt3nINOOEzRtp2dkumHpJ5TpnJiVPq5q9zS0lLJ+Yiwctns+32dD7SIRqA37pTO1dqm4Yohookde7TjXZxNBwkRnMgHPS6FQX52oOOocuCXYYmZwaTIsDSmpzp4DfLcmkzBD7EFrL4Z22uybphGr2EcARCMdBHhem8CpBpjSd3hRYcZFiQ3V0YVVlIII5ET8rg0kvs/bF/sxq20ZlUmrQz3obdKnCvMUPOQq+n8w4kmFehfQ09YoGE3G3EP6CudmWF5jHtYEQ+0UGr+YUb0yN/wDjWxf+ih/zRP8AnlCQPjbaMSiizt4jcVMQDyqaecnIXxPd4GNbwAN4RnqPPCRfI1Ccp8FfzZvmUz/MNVQ9i7LhCi2VvxxQN/vVkpDhQoIpDhpDHBFCj0ATHbRvxEFIukpqFaHhx3YHdLmRCVTcntbyT+D7MbokQaXVXHBgCPTN59MXTSd58N20c6oDG3O9aak6hUEdRpykV/8AHbmCO4YUTnUqfSKemdBn0kJ1NVPzT1u1mkhW3Y8uj2dzbYxYTqPa8S/zLUSyrOuEAgggEHAg5GUzHtoFlFXXCSJaxW0kMoJt3ORU5iG3CuBkunrCqxTfaN+3doVp+B7WiZqZ0KJsSxfJXh/kc08m1CRz/DqHwXDD8yA+orLU6ykc5HUfZpOmqjKD4/doyas1P4xMqhvh65Hhiwm6dS+4yyfYl+mPZq/5XU+ukvGoon50+NvdrNKqPkPv7NPaC5q+W5N373E+iW0W8tUdocV6BRUgAnUdy4bt7eUmI1leJRTBiQ61q5QlUHGuRPASnX2KjQ3ft2Jq24Y478d8tBCsiCOV3gL96R4NX2Sw9txA0Nj2EHB2oQS7U7q130GJ3VlRbUuLfZez2xEFT+kvS3pJpXGYvh+xXZ+zkQGpdmiE5E6jQf5QJTfxTAO0nSCI2hLerMKVq7Dp3L6zIU+ZVj5Un2dECbMf/jGz/wBL+0Jhnnh3SOEsr3alk9reBY8MllOkVxbujKQR+HWqlLgd77OVfalncbBeDCjRO3U9kK00kVwrxkzu8XHCrg9A23tWDaPZO6uyxoEKKpUAggLQjPMVHnJ2Ddwtt7IMWDUlMCD4g8PcRzXEdMpyzsIG29i2dpGciNAUNBatCykYpXow6gZI7B2a2ybqPDURgjoCyP4Sy71NKVpwOMjq+CMlUzPUf6PjUjp0agrT5hOoJSogSgKByP8ACQfRqDZF120HsmPeh5c03eWXlJ6UVdQX2fcC4g/s2NV4AnNG5cPqJNrtNXQRVQuoH6qr+1hfdp+ZOYxEi1ET303CvQ8H2Kao7qsx6hhviW0/GQ1A8ULvA8j4vRj1S32ls5YS2EFB3FgVFN7MRqPMnCVStxaXsKqRFIrStCNJ4GoHWJlhgMsNSixWg+A4n9OoqBTDUKDTXMDjK0rKFCdp9meO/Tw9jR+zPxFnfmAjLCd6rpZcMBqWueYxHCV3s57giNDuDV0etftcVFKbq1pynn4S1ix0uioMRRQPU8N4yqMscRLyHTU7jJtKjmFrj0VMxq1AsTF4Enn1d0gQQG4n08rPa8pBZb9MbHAggEHMHIzYzE005AOAhBh36cNZp9fTNWiYUoKDdunjCsxaazsROZb000C8BukOp1/e9UzfI1M9A9Rluooyfm9amZg2mIw5fUj06ptqXm0Tcw4f4OJdMKvHiKkH7UQ5jmQp6qSlnbTFhr7Qf0UlabdoiWkIYBVY06lH1lExKdvD5V9IP0nu6ckoxcSfAZQ+LXSMZSPlSfYlpva99HtI6CCQNUOpqK5MZTv+L3gGkstOGkcayvmMMx31Kpoq5gHjLJxCMHwJnnQe3Ly30aazSRCymzSp21cnvalqKimkb5jttq3D3EMRCNLRBq7oGY0yrmSF2i9xMm3DlMaiEO17q5ncPZE02mgsgg1VGbfm7e0kJe3UW0i0U911qMK9Ppx65Mwm1w0biB5zSMFwJAODDHz90sOT4unCvPCMRQSSmR+eLSKXDqKCmdZcrexVNcARiCMx6fMb5htmSmIHiz65JBYZJ7q7t03BIzcgkhUixBsd54sha3kOMDSikeNPZ+5fsJz9k8pKyn1RB2bKAp3EChy/jDIyRt44r2bUB3cOrl6suEwFrdjdqKJWnzQO984Asf3Abcx4vN60l7CvriCe65kbWezTipKVCFJBHMS1OnxBeL81Zu3xFeH5pSuM8mo5MT9FpCZ8lHYzEbat1H8UQy2QsxqSTLAGSEObDeKaKYhCUp6CG7VS0ulMODj4mllqkta7G2nfEdhaxWB+dhoT+Z6CceZgdjw9WweK0Q1JmOdEtfgmMF13t1DgKMwneI6WbSo9MkhC2Ls3C1thdRR/fR++oPEA0B6lHTMPMSbIBV0y7XIJO7z222beXS60hFYf+q/ch/zNn0LUyTh7JRDWJE7TktQvmcT5CVFHuY1y2qK5bgMlUcFAwAkxszY0a+pEesKD7XzP+QHd9xw6ZylhAxLIH59WQhBJgCWGtLKJGYQreFXkooBzY5DpMrux2BBt6RLkiMwx0/3a9O9uvDlKkt7aDawxDgoEXlmeZOZPTLmeZV1Sl2T3R6l9BFEJzufR01H2ajlT+k91jg3kfpMZ/T/L/u/09UyyGyHyvI+r1z7Gez6al5+nhIAJOAGJM+lP7Uu6DsEOfjP+z9ZwGIw7Al9/xde0aqEp8pHi6TXjPrm8tLq2iwixGpGpqU+KlVyrkaSl9UwxYoSE77lVj5CShSEiJcjDW+zLyHcWkBu0QtoAPeFajD3SWnJ9njRaQQc9Nf5jX3yVS5jQ/BEdehjTymNSl3lQdy6SO6Oj0OfSik2rdLmyv+ZR7qSSh7ZU/tIZHNTX0GnrlJpqHN3BajkZebOt71GV1CsRg64MPLPrmybQtYn94FPBu768JfKwbwkHoNZiCpBkSPR0RxHa0y98NnQ4i3S6exhllZQSrqi4YbiaU4dE4i/xPEcxWaECYjMxOr2p33a0JXti5wZCKHjU0K9c4VtvYFS1zaLziQlHmyD1r5T0tNVF5zO7Dq6cfEi3FP2bb/5OaoewHd+7PCnCYI/xH20GND7GnaildWWFOEpAjH65zLpXhPR7GHJ4s9C2/dQYcJE0AQqaTQ1w51nXPhPaW0NqW9xcXUTVDVlhQRQCrAVY1zOajOcZ2ZsyNtS6S3gJUtizfKi73bkPScBP0HaJabMSHs6AR/ZoBjvxzwZvudiW6pRXVIw2J9g0I01Kl3kJAJkmJ7TswsS6jLcR1Q6liRGBhsNSNU08J91Je3uzvwsMR4T6NNNSgtgT7JJJpXdNNk25jRzGbwwzUc3P0z8pL7YbTaU9p1HlUzAqiolKeWLm6QJQonw5MVsy6eDEWIdOliViUFCRXBjTAkZ1zpWVu5rvIpiKHl6Zzi1b9M76OwPolW7OuRFTsS1WQd018SfVcjypPP1Ce8ojYl+jpJ/s0j+wT2Mm2k5hT0gY9MyK1ZpomRUkS5bISHMJkqAKk0mgEpyC0S4HaxjUknSnyoBhgvHmcZomHFKMc3iGca5h7qv+UYeZoPTLOLelMewiMN9CtfKs0n2U1LeKaBxPj9mQTTGRXTFWAImQQ55brphKMszThUk++ZiT7J9FJnDEUqCYybeIQrwV3tE9AVj9JkeHUlhnRQOok++Ui3xDbxdqQLOCBFPa6IsTUAsPunBV8TEmgJwAlZ1maklMTuHCWlNvwy0OBGGSkqeWqlPSKTlkKN+I2tGA8MCHpJ3av4JndI9utxAiQWyetDwrkeoz85XIi7Dg3cKKf7VGiunMIpI7T97Er0iejpKkpKf4b+H+rErUpKiPiWAgDmTc9Alp/aN6Y13GdC2nUQtCRguA9UjPxD8W/mM0msmE82SaAAAGwhuvxjD2v5jLVrlicNQ/eM0lwlncxfDCantEUXzNBMCrmw10wjePFrrYMbtbKhzR2X3j1y92opayjFcSo1DqP0kPsFewaNBMWG7EB9KHVpphicsajKVPGXXCiLxVh5iSEnEjwfFqd2sSOILy5Lh1NCCvLES/S4fifMynwx1VNSa4yRhxJQlR4s9aODMfiIlMz5mYIdw0KMrMSVr3sTkd45iaA1nphmIQqgknICWZtInK97bsTPRjlj0T9VJsnZkPw2NoP/Rh/wDLL1IEGH4IUJPyoq+oSL+pH8Jc38rwbO+jYQrW4iflhOfUsnYHwvty4ysIiDjFKQ/95gfRP0nNGYKKsQBxJoPMzf6ypkAPG7zxK2+AdoPQx49tBHBdUVvQFHplW2vwNs6DTt40eOeApDX0Vb/NKmuNtWUDAMYzcIeI/mOHlWU3c7euotRCAgry7z/zHLqE1i1FT9o6AfzdW6tRw7DY+yl1LBt4NPmYBnPQW1MeqR918QqO7bw9X3vgOpRj50lGO7O2p2LE72JJ9M+CM2QMzFBOaiVHnk9Pg3Nxd3F0axYjNwGSjoUYS3RWdgqKWZjQACpJ5S7gWUW4iLDQVZsgPWTkAN5nR9m7Kg7PWvjinxOd32rwHpM3VrJoiN9khvpUjUPLcsRs34fWHSLd0dsxCzVfz+0eWXTKiur63sx3yK7kFP4EjbvaMWJENtYr2sQYPEHgh9eVZpa7FQHtLpjHiHGmOge8+gcp5yu936qo4JGfZsOr6KQE91AnidvE/Zk7C8a9Rn0aVBopFaNxzG7jJKWca5t7Rf1HVABgvLkBu9E9trqHdp2kPVprQEigPRxEjkbgQG1u5pp0+HDlu/pNp9MHboHxoe6eB39B3zeeEBhQyOurxLVaV1PTAe9v4xnATk7fr28FslBi7eEcPuPulExHqakkknrJmO6vCSzE6338v44CR8KK+sh8WZSa0ppp/s++elR05iS4KqBIgXLdw/1dTMMK0C5jpPH1TSLawYyFCukHPSSvoGB6xMKxwsNVQVNMSfDU4np9XOSOz7QbQhXDPcGGyaNJqFTHV4gKHcN8nHChMkW6MPvKObaKHUDEHdQjIjdUbuGBm/aAUDd0nAVyPQcvfPIUNkQqxx1Hfq9PVWRdyGjRTDNVqCgpQEVFdQrxyrymjSSeTmKik82Yn1ZRT3F9sZlSIe3gt4NRxw3BsSCOBqJUNptG2vR+m1G3w2wcdW8cxIy6ZTzHFtRWCjGSuBZXVPQ5GRI6DSYZ5KMIZOMuZojN4mY9JJ9cwz6eTYEOiWmdp7Bt75jFQdlF3kYK/wCYcefnISBsCwVx+Mvo0Cnihi3LMfyuGZSOdOqdAmkSFDjLpdQw5+7hLAsizBrUCvvIVhVzuk9Rt1DDNt/Z+xbc22xrR9R8VxGWlT7Rr3nPAHSo4TN8Mi4u4d/GZmeNcxIcIu2JoKu7HkBQeQEt4uy6YwjqHstn1Hf1+crnYa21lZLDLw0iMWeIDRaE7scDQAZSzGlKDFySM8/FoT5iaK6a6YClRK0mQRM+DUMCClvDWGmQ8yd5PTKa25cL2sC3r3tLRCOWABk/HvLa2hNFiRUCqK4MCTyABxJ3CcYibTixbi/2jGFGbTCt4QNaAeFB0YFudZhRkrxHtY67IIFsgAxETbMew2pcPCIZC4V4Z8LaQFrybDMStLH4hsbl0cRPwkZSCBEoFJ4avCwORrQ0nNYmyNo07RoJYvV6AgvjicM68s5GdlEqVKMCMwQQR1GWLQFZggvqU6/lIAkQBF8n9Z2F9A2hC1wmQlTpiKrBtDcKjMHNTvEkqT8rbKu9p7KjiPaEofmU+BxwZd/rE7bs34wtblVW8htaRN58cI/vDvL1jrnn1KCk3TceroaqiTHmJB4Yg17LB7bEmHTE1KnAVOZBHHhSXMKNCjqHhREiKfmRgw8xMsiFlBRFwWM7GJ7PpEzpb0NXoft3dfGXk8JCgkmgGZOQmoczUUQ7Tm/xT8TC1R7O0bVGYUiRBlDB4fcZk2/t6MsFoVgrOSdBdQSca10gAkgTkRsdoRWP9lunZjU/oxCST+7JtKlF1wOA+75uo1CqZCUJJJvMGB/Nufh2BEjbbsNNSRHVyeS1ZieoT9LkVnO/hHYL7PhvdXUMpHiDSqN4ocPfXgzcOE6HK66wpdtrMmmaikArseHB1Vq1G8Zj1HoM5L8ebLhL2e0xA7TwwY9GK0/03NP5SeidaKgkHeMiPV0cpguraFeW8W3jLqhxUKOOR94zB4yqmvAoHtbCJ/MP5N7a0/6Y/wDit9J5+IgDw2sPrZz7xL/bWxrjYt28CKCUqTCiUwiLuPTxEgp7IIUJF21NJO+L/JX3b78dFX9mkGF+SGtfM1MsoseNF/aRHfpNR5ZTWk8pNuRoI2SOy7MbCfs79B7auvor7p0icqsm7K7gPwiL5E0nWCJfSyPV+a+oU8FUHin2Lxq4TRHir7MRx5MZorUMmbyyjxtoXKwobN+oTXJRXHEnCSEDY6w+9GOs+yPCOnefRKMiWdSpqrBIEXAucmztIUS48Iou9jl/WVTBgJBHdxO9jmfoOUxrRBuAHUAJYxdorisHE+3uHRx6cpcLvpijQ0ScajKuO/RIf0JEv7SH4oydC94/5ayJjbegr+ygxYh4kBB7z6Jye3+J7SJQRkiQTxHfX0Ub0Seg7Rso/wCzuIR5agp8moZQKCBnJfnjPBn422r+L4FWCPtFT5t9JDRDcxzWK7Ofuavol0McseifS8JSnIAOMtkLdt7CZRAXeSfRLifTJ1d0CKuQE3n09BKkMDQqQQeBBqJz3V6Js+xSxg1anaMKxGO77Qdyr/WZoivdjSGaFCObDCJEHBfYU+14jupNbXt48NIlzoqQGENQQo4FqkktvpkOmXES4Cv2aDtIlK6AfCOLtko6cTuBnz6iorJmTOez76QkJAAgRk+w4cC0hUUJChqKncBzJPrMsXjXV1har2SH+/igio/7aeI9JoJddhqIeOREK4hafpp0LvP3NU8KTP33+webH3D0mYzF8zxLl6MVD2XaQj2kcm4fPXGNRXknh9BPOSfa+xDdurSPN9PorNYsWBarriOqc2PePRvMp242+oqIEIv9z4DylgTUq7FXt9nEqQjMgNTDtWz0qOA7x8zQegzZ4iQhV2VRzNJzyLtW9i5xNI4Lh6qSOaJEfxOx6/pJA0azmQGOdVTGUnoPu1je7ZRapBNPu3/urn1mUnFjtEriRXM/MeuW2U+k2np0I5sWpqlqsnuj17XJDRWUrkQa4c98utRNVdScMdOIIPpHRLDrI5jCZ4EQQ371SpI1Y96m8ivLdJJep1UwAq3PZ87BPlEXluA62FfXKzhbLWJs6DDwhxVXB6AE8nwxBHWJ5Bu9jJRlIB+9XJHmCJhjfFuw4Na3YcjckOI3l3KemQqlRaoCULEGbhlg0h8ye0NNN2qR49u2kRIDKGFK1DqGUijbwZu9vF0CJEVtAYENo0ioy7xr65QifFl1b7Zu76AoaHcuNUGJkUQaUxHhcLvFRjvl9tb4uvdqQTASGtrCYUdVOt35FyBReQA6ZImpI7o2kz22Y5rU0g3M3gRmxO2r9bqKsOHikKve9pjmRyGQlJMzBgVJBBqCKgg8iJdtlKq+Gdlw7iO19dUW1s/1HZvCzjFV50zI6BvmS1BIYQUVkqLVbq+ydkWtztCOTFiaQyFe/wB7EAUzKLi9fObQo8K4QPCdYinep9e8HkZQm3dqRds3himqwkqsFPZXifubNvKQCRY9oTEgu0NuIyPSMiOmRMNubOp1VJsq/u9fn0oW2+JSqj8VCr98L3ofceqTkLbmzopoLhUPCICnpYU9Mwgs0LQrcM/NpghusQVUqw4qQw9EzzTm+z2s1n05xZW3vjCoHhQYo+5F1fzU9dZUEJtmXw0mBA1ew8NK9Rpj1Sip7WVKpg5SOjnILU97sCBEUm3LQXGIUMSteWqtD6JBWttbbRD2V5CURV1CFEpSJDcfKGzKnMA1GYkha7VjQaK/6qc/EOg/WYNpvCMSHfWzUao7QZMpGIYj+BnMqal/Askg/CrgdmmrTSoThB4iPiHAtF3uxI9smuF+qAzQ4iGivDdd3AhhipwlMxDGhV1QIygZkoaDrynbY3Z3MNbnKFcqIUf/ALcUeCJ1HA8jOTbZvaO9ovyNSIdxKnJeI313yagBfEH8+z4q9BRKrAgHgberCwtoRbVxEh9pDoQW0sVJFcfCa5TqUPaV9DA0XLkZjXpiCn7wr6Zx+srbZN328HsmPfhAD8yZA9WRmqtIRMTxl9DS00UQUJmDe5lrhdu34zEB/wB1l9RMto19ebRZITsqBmVQqYAkmmJzkXPpGCEi4AB4wzno8GDabLg11JCUDvxXIWtMyWNKDlkJiTbOzYoBS7hspyYE6D0NTT11nPY5a6VhFZn1KVJYlsCKb5RdltSHZQxa3SvDMAmHrC6kIU0BNMRhylA083Uok8mPXqrpgFCcXH8h/RSOkRdSMrg71II8xN5xe02hDLarO6Csf9NxU/mQ59YlRrt3aMMUYQ4n3UCnyy9MrNBQyILWjWU1fF/bPPLteigg15YGbTm429eaw5UJxwUgjmAST0jGVzZXsK9hB0IrQal3j+nAypVNSLllpWhfwqCuhbfauyrXa9q9vcLUEd1x4obbmU8vTPzBtTZlxsm8iWscd5cVb5YiHJ15H0HCfrWU7trYtvtaEpeFDeLCqYRcYY5oeR9BxltGr5Zg5H05toUU8+AfyxLuFZ3Mf9nBiP0KaeeU6ytrBgEqIEOEymhGhQQRuOEzZDlPRxMQ/UTkKd+Z/AB5zA+H71yGcpBpjidTeS/WV6pqoPECYI20rK38cdK+yp1t5LWbW8RYsGG6+FlqK50l9EmS+dqlVawSpaYFwLQL+7oFrr/MfUJTl7tO1t6qp7V/ZTIdLZeVZGbdjRhdPC7RhDop0A0FSN9M+uUuRNFNz1ZlGmtNNKgcwIbq5vY10e8dK+wuXXx65pCiUlrPhhMhZqqSs96Seb5Pp9PZY1w5UjRYfgiOn5WI9RknC2lfrgLqN1sT66yHk7s3ZN9tE1t4LMi+KK1EhL+aI1F9NZxgZ2dEMrD2tfBcY7E81Q/7MuV2rtBzRX1HgIak+qTtt8PW0EAx4rXD+zCqkIfvsNbdQXpkxCtre2B7OGkPid/man0zUjZilsrNL8gPcxQOENVWv7zU9A85JEfd0f8ADfNgHiV0YACtTmfyj3n0z4KB08TnOdNSxduxnhBUhrCcijNXV/ICBTrrSX9lf2FraKTF1RW70UULRWiHOvqBJpSUZPZGVpqZECU3kxuyk6moDJhVovsz1ztq4iuphAQkVg2nMtQ1o54ch5z2Lty7iCiCHC5gFj5th6JT8+mfkUrdwWcPPq37xu7u7xW1uzOx+ZjU+mazyfS7o0yS+zyfT6c8+T6ez6bdus8nzEICSQABUk4ASg9o7YNyTBgYQsmbIxOQ4L65qXs292ltPtawYB7uTuPm+1ft4nfulKxDQTfXTdLCLGxynTDoAk5OaEKtWX0xQl7oMv7e1j3kTsoCF2zO4KOLE4AdM1MOCjJfrKyjbSukt4ObYsx8KKPE7HcqiVNtS/g9jD2bYmlpAzbfcRN8RuVfD/wkVGu4VjAaws3Dl/8Azdyv98R/dQzmIK/5zjlLGHIqzJnsZdNL92cwxIXdMkgJo6EqcD5SuWTDT7waVHlLGNBqNXUJU720RqURvKYXso70/TOE7E8Y4hpmEYsHvw3eGajFWKn0GVTbfEN/b4RCtwv3ijfzL7wZanZdxlo3g5zMNjXT5BR1zOxaFVhT+cDxaytNv2dyBr1QG4Piv8w94En1dXGpWDA7wajzEoO32DFAGtlHRJuFYNa4pEKnkSKnhwPXLPLBFiyxqaJSIXiO8BqSfS0RoqgAsH41Gk+jD0TJ2yjxVXpy8xhK1U1JzDamolWR8HPPJ8DWfGVN7ARdoXNlFexiv/ZLkYYUNDhQt9uR5UMpy8t27ytjEgjE/wCpB+V+lcmlYbQs1vYBTAMO9Dbg30ORlNW8RrlexbuXNvXsy3zAYFG48Dyxk+ioKTG+/PmwqicJkZNNS6trhraMkVflzHtKcx/G+ZI8DxRIakAGkSH80JuB+32TI+WEbOIO4epI6xFVlNVYAg8jN5SGyLsitudRzZKU/eGJHSOuVRqf2B1t9AZE8tcmASyfMRFyByc8pXbNiW/tMMVoP1ByHzeWcqHWw3KeQbHqqBMFy6taxyP9N68R3TgRunYV0yCRDrEioCAQYeYvboxqvcPEfx6p4sW+t/2caKByckeRlxWeSQaaSxCAc24h7U2wuRd8C2MINgMzguQ4yU2X8UXVpchomkKTiUFNPMrUgg/MOuXezhQQa/LBjsfyswA9RllbwmEKH/Y4UQPUq5YCuJwNRn6xKqlIAZ58mMtZ06TURTxYfighMJ4mdn9CbO2jC2hBDoRWgJANRjkynep3STnDdmXd7YRkK24hQxnpcMFr9ozU/MB0jGdltLqHeQVipvzHsnh9DvE8evRNMyMiz9Jq6erRiSRI+JIUFFP+JPgWnfiLY0faNu0SyimBdIKilAsYD5GJGB9luo4T86XD3faPDuWja0JVkiFqqRmCDP1zKU21sCBtGtxDhQvxIWneACxQMlc0wPst1HCZUK2Huqy48P5MsnACpKApXCwJ8S/medN2UdVhb/lI8mMxG0ioxVtnwVZTQqWWoP8ALJG3UrD0mGIdGbug1A8p7NLPwfKr68apODBhKTJ76VHhEC4aE26P7cfyJ6pT1J1KLB7SK5/DJGy7zFQcssRMX4Qf9DC/mT6TjmevByH1KnSQmmUA4QBPmUx6EyHlxExkTqRs0/6BPNJjNlC/6BfNJz59X6pSn+n/AOpT/wDJ5hJXZ2yr7asXsrSC0U/M2SJzZz3R650nYnwIWC3G1W7NfF+HVqNT/uv8o4hceJEriJewbWELbZ8NIEJcNSKF/kH+2cTu4zA1pOFAk8dgzioBo+z+FNm7Ko1+3465z7BCVgIfvPibrpX2ZOPFaKADpVF8EJAEhIPtQYdZxmCaFsaDE+gcz/GMyCd1HEePDoGOpRLuzheZ3AZmahNWL48F3D6mfBdOOZOZ/jIcptM2tyodLgzeNDodQy9Ut5IK2pRznOixs9mV00HlumlMKnq5zbkLus+n0+nOn6fT6fTTz9Pp9Ppzz9MUSIkJdTGg9JPADMnkJjjRxC7oGtzkgPpY/KOfkDKfiQL2M5iNcKvAKuCDgtT5nMzmdp9HV1HeCVYN1CL9JIbfaKXt/wB0FYML2K1Zub0w/dGAkXC2K6jvRV8v6yReycnv3j+YX3z78LZqO/cs3TF+k0+6dHQQn+j/AJ1gPaW0bZcFR3rinkJZf4fs8N3riv7w90mYNlZ3kTsbeHFuX9lNbU/MfCBzJAlYw/h/ZeyYP4raQhqB4YK95nPs4YseS4cTMFLSM8+G5alfpaCPg0+LYBSqhaesdj29zDMUMUt4fjjuSIY5DLU3Idcw3W0rOFCa0s0dYJ8bKDrjc2bhyyphLy928byirbOsFMIUEABEG7ACleflIhru6oClmafxymiCfi7ODCSiktQUcCeCEUlEA8zFy2Kdj8trEP7klYQbdasOmglutxtJsrdF6f8AjL+H/iTZ9msrKRzbVUxsKn/88LnCXG6AB0kTYwrsjBIY65mEG8+e4VegVmTsaeK4Y+j3zHCOB9GCuRkknwcK2l6wzhjzmYbOj1q9yijgAPfMMeHBdQPxLLT7h9ZYmBYr4rhm/f8ApOw8v+5jwpQzw8sElnRZwl8VyPNRPH/CJndf5190hKbLGZLfzGZFbZpYKkIuxNAApJPnNiP29rGVpsWZqn/aA3BuLTUFEdmJNAA5JJ4ACSMOCEOog13VJNB17zvmaDZwYXf7JFbdQDu9fGZmEmIEZw3oRgGauhOXY4Zo+QPskH6+isyTRsQegzM3BDaDBB4F10lWOg0303c+iZViGtGFDNqagDyBnhTV07p5T7GbllJ7YtIgjLcwQQwUFtOfdPiHOlK8RKvUVExxE7y9De6XUj3w01vgLRSRBfgRIRWHdItGX5Yy8CMj7pFxLcRSezXs4o8cA59MOuY+3PhJ+92SdfbW50PWtMgT07jzyO+RzXCxCIN/DaHEXwxgKMOZpmOYqJ6DBHJgkd4MQMvdZDUV3EcffOjW8dbmCkVcmFacDvHUZS8eAdOqMPxEP5bmFTtAPvHzDp85dbLJgMYYdYsGIao6/K/ssM1LDjvE4WdKuz6qpDA0rU14/wAUykdfmllEetGKaa+0CaUPGShVWzAMp/bkXTASHvdq9S/1pM1XBaUJIUPwaNmSHDaK6oubGn9egTRVLEBQSTkBiTJy1tcWQMNVP1nHhgpvUHLW2/gJWyCYbouIdrGiJ/e6beAN5Ve7X941MqCFBVICQiAQqBSONB9ZEW6i8uFiKKW9t3YI3M3tdX0lQASLWVJjgyaKYSSd/Zpq4sOxLRGuriHCzrqJCcic6cCZM7B23b7LirD/ABgjw4jUIY4ivA9OVcjyMkaClDjKL2n8OrErFtKK2ZhZKfyHceWXRKCAoFJEsP8ASeXX82lUUgb0wEYDy+GY8X9Go6xFV0OpWFQZknGPhL4iiwG/AXuoFfCW8WHT8w38RjnOyghgCCCDiCMjPJqUzTVHYX1UqChIYDbOxIO1oYOt4EZfBFQla/a9PEvpG6c9FpEsC0CL2mpWOLmpYHeDvHAzsUsryyg30PRFGI8LjxKeXvGRl+n1JpGDdPqOjF1GmFW6ThV6K6/d4tdtbiJ+pdvbsR4VfSCOOUs+0s//AHOL/wCIPpLf4s2TeWd2jMmqEVCpFHgYgk05NyPVKFMGJ7Pqnp4wq6bg7sEaQQMeoVTVF0xTMdqZehdpa/8AukT/AMRfpNNdr/7pE/8AEX6TnhhP7JmMo3AzsXJj1NAg/wD2lf40v/F/R97fvdnStUhbl3vzf3Lu34yLns0YnwjP1DifdxlyUhIgOyZdSSTpXPedwHP3CbqoUYdZ3npnyqFFB1neTxM2mTi6zybTyc8+S4hNmOuW8zwVqdRNFXM+6c7ShVQ4U5n8yeQbvQGUlvD6SeA953SweurH+lOUvXfUeAGAHATCw1CYvKIHdTcbn+I8enBtJ9PZ9MnF8n0+mN4gSgxJOSjFj1e84TnnJlIm5uLl0paQ9Vf71gdA5qM26fD0y57Mx2/U8CnFB4SeBPzU37t0vZrNzSQkgkBXIyB6NGw7HaOOu5YVxOmGak8zSZjsuK3ijXLdGHrMqyYokWHCFYjqg4sQPXOZ/wCsVH9NHKVVCOzHDE2nwiLkhjGT9+PVv5VrKvtfgzZ0MgxtUb7RVV68Sx8xKbg3tvcvpgur40LZKOvf1T3af4iHAOm4irUEURim7ka+mVKQsglK4HR87UfVEJqCkvClRthQgW6k/dqi925s3Yo/B2UOE8bLsoQAhoeMVl38sW40lL3T3V3WNE0u9MyCQOS7gOQnNLeJ2UVX4HGdStryC9uKndhznadCLznxLB+oavV6IoVQMA5kAE9pBaJuNrR4Pc7NKjfjTykW22Lo5aB0D+sy7X0tcEDhj0yncZom5HB+goa3U1KKFGooSkHYfgy52neH+9p0AfSVh8KQW2xtBoFxEitDECI50tpINVAII5nonOaGde//AFzBrHv43sw4UMfvMWP+6JXUkJLYKq1qErUfEsntH4QvYVXs47XK59m50xeo+Bv8s55HEWA7Q4qvDdcCrghh1Gfp2RW0dk2W1Yei5hBvZcd2In5WGPViOUhiod2wpl/NhYTQtKx2z8JXuzdUWBW6gDGqj9VB96DMfcvWBKFrLgQWo2boNK22N+DCVVgYxHe1YEcl5cxKBDS8Q0pLEHCZiXFVxD1YzC0oaHte4gb+0X2W9xzktC29aRMIlYJ+7Ff5h7wJOTUSd46tBSWaM1nixEijUjK44qQR6J7LXBzQv2adAmcCYIPgHIt6zL5RPJVYnq+2gSAeQZfZdoI0TW4qibtxO4e+VJHtLe5cK6DBDiMGFSMiOia7OhdlbJxbvHry9EvVxdz+VfIV/wBqQys4pBIjJwUAWhb/AGY9riO/DOGreOTfXKUxdwFiwqOocDiPOk7Iyq6lWAIIoQciJz3aVkbWIyjFWBKHlw6RPT09fH3VZ+7BqU8Nxl7POXsrqyJiWrHTvhsQV9fr85h1QYsShBsbn/8Azc8xln/xMqeGGIZCegnEdFOHlLaJbw46GHGQNTzHNTnl6pPaCW6hOXQE4HJhwYZjzylLXnZ3twadtF0dxUhLhgcSznAVPDcJdol1ZCLBRXuA9DCaoGncwYnLClDPhB2lEojRIVqtPDDFTTq/5p2brLcNp2CwF/WZLRD8kM6ozjgXz/lwmiar4djBT8PbLifaidJ9Z9cvBs6BBiI0QtGrvfGrcKc+dcjJ3uVXSBiCMBTqmUOiXDARYKCGuATAdGfvl2mNT5SxZuxcjcV7vVu9Mv1wAEgVBhWe3tZ9NWJCT4djvPp7PpVLY2NzZQbqhcEOuKRFwdCOB9xwlSbJ2pFtP0Yx1qM6f76jd9y8ZEzE6k0K+JcV+h5Hf5ytaQsQXIWL1uHFSMgeGwZTkR/GcyTmFnfRYFHhMRXxKcqjMMOIlX2+2oESgigwm45r9RPOXRUnK4bYZi5toN3BeDHRYkNxRlb18iNxGInDtv8AwxG2WxiwdUW2JwbNoX2xKehsjvxndUiw4gqjqw5EGR+0o8KHaxUYqS6lQmBrXlwnUqi0KtvmGmpSRVEKHjuH8yNBaYTCfhK8vdnBKxIQ7u9fZ6OXqkEYaz2AZcB9OpquJPi9GY0wGZy+p5CfKukceJ4meqpGJzOfLkJvJL4jrSfUns+mnTrSeTefAFjQZmbcgCTAEk2DqkMxGoOs8JlisPAvhX0mZ2pBTSuZ3+/6SypMRe/YzaoGmR5Q+NQ/ungNkD8XMpqJvMKZ0mac+aXRlrjvluSFFSaAcZkaMKlUGthnjRV/M27oxPKYDD1Nqc6zuwoo6B7zUzbsOLU8Twd1faIxP5VPrbyMi7+/ttloustqiHMDVEIGbYnqG6slY0VLeG8WIdKoCzHkJxe/vYl/cvGffgi+yoyH15zFRjq300YzyGbWz/FNugpCt4hplqZV9WqR0T4pum/ZwYSdOpz6wJRs2EoKlcWUKSOD0iz22kZP1WGreGbQB0UwI9MpnalylxGATELvGRJ4SBE2nFalCCxqeiRTrGrjWTskmQOjJ2d09o+oZbxJq52320LSK1IpUmtOiUmBN9M0CoCJs2VNJQq1BUWmVDf7twIijjMyXsWEKQ2cCWdJsBMQObIKEqFxI4G4dmiOxqRU8SZ5ic5vSbqtTSZgQ4kW4OKk7h/+u4WmxvYntR1X+SGD/tTixQg0pO+/AkPRsWtKa7iK3lpX3Suse52OVL4vBr+e1nk+kJmP0ovbPwnYbU1RIYFrcHHtEHcc/wDcTAH8wo3TK0n04GHol/Lm1NkX+x4ui6hEAnuRV70J/wArcftNDykeIhn6tjQYVxDaFGhpFRhRkcBlPUZy7a3wSqao+zOk27n/AO25/wB1vOSULG9mLVQoCUjFy3eRxCwGIIke7EyduFioxWKjIykqQylSCMxjvEjjJUPn+coZpuxqRY8FtUJokM8VJHqlQW239owqCIqxx9w0v/MuHmJFEzGXUbxMhbIuJrKPyj1esbJvVvoDRAhhkOQVJBIwBzG4yo4Q1ELxIHnOdfDDsfxBU6lBQMu/EGjDyoROh2kVTc24FW/VWoAJNBU5U4iRKoVJMZ3foNLUCqKSSAQLh6JhCToAAHHcB1zZF0qAc8z0nEzRQzHUwp7K505ndX1TNIIdP0itqQBHtWNO9D746sx5SVmrU0tXKhr0UxmaVYVAjYuJEgh5GVqzlcMNI6ZZFu8urBsQRxpjXyrM5dhE0g90k9PKYo2FCV1aWBBGY509c+iS+cRZ8eooRmKjz/rSeMRRTWu/q3zIZ5pXE0GOeGczanC4JU0wOYIpmOFa/wAGfLgBhz1E16/4pMijD0e73T1UXp6f4pNumyulEe31DdRxQ8M8RLS2vtFFiYr7W8dI3jmJMUAJG4409BlExoF7DjRFhozKGOkgVw3SLXGR8GTQqITIWoJHMx7teKQwBBBByIyM2lF2sXadu37FmXehFB1cDKthRhFXwsjb1YUI+vSJCIZeNBMJWhXRQP4uafT6fTTm27Hsn1/K1A/I5Bvc3UZegzCQGBBFQcCOImKCxUmExqUppJ+ZDkekZHz3zRcgW/DT6tZpPZqHKX2WIsbRnJiIQGOYYgKeY4eqXs8mQs7RUKFSPEcW/wBIn1BN5rJb8460mtJvPJt0+MJcoghgk57+Q4TdFBGo7sumYIz/ACjpMwzs+tp0DT0jqVi+VMHid/zs4GOokmaT2WrRquYcOjOPF7KV9o+pczM3yiSokm5NyXIzrD7zGmPmeAGZPIT464g71YS+yDSI35iPCOQx5iaLC0nUTrf2ju5KPlH8EzNSc4l1AAACgKBkBgJ9jkASccAKnDOb0kjZJg0TidK9Az829U0TAc6afMVHa8n+KNo6tNnDaoFGikcflXqzPVKCE71tv4bttrAxEpAud0QDuvyiAZ/mGI5zi93s66sIxg3EMw2GXssPaU5EcxKVEkvoJSEJgNjNhNxDMyiGJhdykOMTcCZwg4SfsdjXl7QqnZof7x+6vUM26hOwku8TTwUy/t7G6uTSDCeJ+UYdZyHnOmWfw9Z21GiA3D8X8HUg99ZUiqFAVQFAyAFB5CWCnxLjieXwvhi/fFzCh/map/yg+uXR+FroZRYLcu8PWs6PPpngS6l4/HsIlo+iNDKndXI9BGBmiKFYUAnXI8CFcwzDiqGU+jmDuPOc72hse5tWLQqxYfLxAcTxG4ndvmKhGTSUFVpzYp853f4PH/4SB+eN/wDcM4X+Au4nyEfmIE7z8JQmgbFgI1Khotac4jGRa04fFl0tLUo95SVAREkR7tVz6bzWkiN75Pp9Ppzz9Pp4CDvE9m3mm9u7AtttwaP+lGUHsoy5qeDD5lO8Z8DOB3fw7f2kZoMbQjLv1EhhuZcMQZ+oZTe3tl2u0LYvGhqzwAXVsRh8ymmYI9MvpLggG49mHq0r8pS6dlpE/CFFQAyuRfg/nI7FI8dzCXr+pE8/wm0HivF/dp9TOkCwsYeUGCOkD3zctZwt8BP5BJ+F+EV9ZrK+E1j0TTHslTA/D8C3tnjJCiNE1hWJIIxWuWA4ysULI3dZwQagggU3yE/G2rRYYhRoTNU91WBNKVOXRJqtSCN4rLRk/T/T666+mStYWFSoHH8Vj0Ttyaot9sugCxl7T7hg3WMj6JKrtazIxZl6VPurKErPqyhWmpq2I6PrJqq6tdNteyX52PQh99JD3u2liQmhwUYahQs1MjnQD6ymGcCYzjNo0tNJmCepcjUV0baKRqTKuqau2mtcjlMMSvbigqaYcpoxLU/UYHUtVoo35HCtKcDJzHUW4P8AHnNENQOgeqe7q8vqZr2ZGTUwFR1Uw4TbU+jf0zEqksSIjCgXu4EZcCPVSbL7z6z9JosFWcua1GAxpkOWPpnOnN8/7vvm6QVdnJZx4TgaDKnummmjHEnAZmu8ylNt39zZxEECIU1JVqUxxNMxK6hAQZYWso1K9AopqCVyCCcrHx2a0FvD9uJ/NPfw0I/NEP705J/je0v+obyX6TYbb2jj/aWHDurj6JCxp5vjp0H1JOVel2qH/teuGHTI19f9ZinKf8c2l/rn+VfpNl27tBWDdqG4gqtD00pK1Ydpff0dXW0+7qDSqJ/jSTjHUFMK9C9UlpcAjTEXND5g7ugyJ2ZtlL+qNDaG6ipp3kplWuY6D5yfwYcQZi+0laVZEGO13huHUMMjMkikJt4mlvAxz4Hj17/OSU22uSfTSs8rOdM1oM80c5mrNJKh8OHHpnmippPWakyw1oKnMziYDJ0tDz6oT8ourpw8XZiFXkMhI5jSpJ5ky4juBnkPWch0zA2zzcr+szKv+mppX853/lGA5zkj1cvqWoGPCPgp2AG6t+zJpe82mzVh25oMjE3n8n/N5SWsbb8LACnxt3nO8sfplLx7K1gMqpDWviJOJFMs+J9UyTZEPk0lmoCsgp2APDi+T6ez6c2ujHSpMqCEnZw0T2VAPTv9MggKugO90H+YSopWrZm6ZNlHwfJY3tjbbQhGFcQw67jkynirZg/wZnePCTNxXgMW8hUy3a6J8C05vh/lGPmRNQy3kO2Ph652ZqiJWPb+2B3k5RFGX5hh0Sxsdj31/QpD0J/qRO6vVvbqE7K1YnjYvyyT+UZ9dZ7OwuFmmrDYFpZ0aJ/aInFh3B+VfeaysINnc3CFoUMFRkWbQDyXA19XOXmz9n/iaRIgpC3DfE/+j19ErIAKAAAABuwAEoqVsFk57tiUTcvO40GPb/tYTpzNCv8AMpK+mW2uV9Gjau6Mt/P+kim2VCuAWH6PNfCelcvKk2nUfxDsdmlwLTGoTeZo9jcQBqKa0/1EqV6SPEvWKc5aCoykoFKrgy0kEZhyTV1qMMxl9DyM+DTJMnFpW92WIx7WFEjKnzQlOXHSOW9fKdD+FNCbN7FST2cV8zU0bvVr1mU+e41dzHHk249eXTSTGyYi20eJuV9LNwqaivoFZGrIlJhzBWaoUaiiIgpJkciGuJ9Pp9PMZbjchFLHIYynY0d4pxNBuG6St81IQHFpAEyZRSIxNSzs+VplLyBexIbAOdS88x0GWBmOuMkFIUIIapIa0llfYWkf/wD5t6ZeyJ2tE0Wbj2yqjzr7pAQJWkcwyVGEno/mfbUCJaXsRNT6G76d4+Ft3UaiU6wJnUfia07S2SOBjCah/I30NPOczIk5YhRYSYAsAH21ivb3EOImatvy5jynQLf4g06ViwagVxRsceTU9c5/DHfXpklLKZsXIDFm9RgbStLjwRVB9l+43kc+qsvC5OXmfdxnJhLyFeXMD9nGdRwrVfJqiSZccL0sCnM8TPiQBUyiIW37hCBEhpFHEdw+8egS8/xmBHIV9cIVFaio81r6pkCHEhTMw3EaIzjEAUHX/T1zd1DOuGIBx/Nh9ZbI8GIKW8VCM6K4/wCM3gg6a1J1GoJJPJc91KmWNbnJqQP4pn6h6ZkLUUmYaVqaVpTDjkSPKk9Zq0wPHEUy5HnSc4vgoq47h/HvmMF03661bTSjLXGlcjyrTpmKOzABUXWxOWOIGdadfnM7xgFxBViMFOderA86TnndDqGrj6BwnNdtXIuLuJQ1CUQfu5+msqbaW0vwcDs0P6r1p9o9r6Tn+k0rxkWuq2EdS84p9Mume6ZDwvS4ZsBMlJuBOwupa1+G4OmFGin5mCDoUVPpMmdpXLWduYsOgfUoFcjU41G/CZNnQPw9nBTI6dTdLYn1yE+IYncgw+JZz1Cg9Zk6MNGOXqXyUrKtViSSO9twDd2u2re4Gi4UQid+cM9ea9fnKhhYKKNrX5TWuHCu8Tkw3TPDuY9u36UV4fQcPLKQoffRqSPiE9HrFZ9OcLtu/X50b8yL7qTOvxBdjNILdTD/AGp0FkDU0+Y8HsIIImJm4TSeSS+US7IupuQxMuWYKCzGgAqeqeQxRenGUttu/eGwt0quAdm48APXKzdUP0mkp+Rp5+Zfe7cuxnkMND20dlQ5qrEDSDvP3H0DCYou2bOHkxiH7R7zSc4MViakknmayQsYJjXEINTTXURx040l2T5OoppSI/1LWgZolYjChfGnsjcvUPTNp7Ppp818nk2n051LD7RvksIcOIzhP1FoaV8PepTnSklFi/iUSJ2jRFcBlx7pBFfCKL6JDXljAv4v6wLLBoFWtBVhUk05UEvbNEtwICDSgBKD2eI6MazV5m0NVD6hR/VHS9/H0GEECY43HgyAAXIAdGE9n02pNy+0+AkSZ2dZm8bU4/SU4/efZHL2j1SOt4JuI8ODXTrOJ4ACppzoMOc6JDhpCRUQaVUUAkavUwiBmfRsQibu4AGAFAMhuEs40WvdGW/nMsdyooN8soa62CyAyYcsKFrNT4fXLr9qdIwQZ8+XRPomGmGuFfVM6gKKCadO2UirjZlvHqQOyc/MmFelcj6+clZ9OBKTIMOoloS52fHt6ll1r7a4j94Zr6ucjaEYidNkZH2dbx6nT2bH5lw8xkfXJaNTsoeIaVUuDQlQwIYYHCb27lYyqTuK19oHFT6KHnL68szauFYhq4givpH/ABkXEUijA4qdSnmPcd8m2UJDTk1la3nZ9x8V3Hev9JOqyuKqQRxEo5TqUHiAfOZUiPCNUYr6vKQl0gq4sfRuCoaiu4RiwiBmMRz5Slyw4iTEPaJH7RK81+hlvtDZyRlNxCojU1MDk3PDI+udTmmcKrTkc3ld64YwmY6yJqRvMyiKw316ZNwtGJ6OMQDxAlLbbi1eHC9kaj0nL0CTOz43bWyE/L3fLL0SmNq/+cidC/7okKimKpB+WW+oe51hgLmCLiBFhHJ0ZfMYemcUaGVJBzBIPSJ3Sck2tCEK/uFGWvV/MNXvkqrkCxGERe+JeTCo74meYoybkZPqy9tU7S5gpnWIteitTLIZyZ2Suu9h/aHbyWnvkhN3lbtxtqHBR00Q0UnMqAPV0yJtLOLeOVSgC4s7eFfqeUkdstW6pwH8eqfMTB2SmnDtorazxArh6BL1/FHAD2aKc4OpPu2l3s5reGIqxEjQ60LL8p54nzrLSHd3MIUSNEUcK6h5NUSStP8AyF+DkFQgc8cfVIOVtvGWbhbZuoShSIcTmQQx5kg09E9O27gmvZw+WJw9EgpJbPtocdorxamHBXWyjAtnQV3DDGbBLiQnOHIdrXOrVSGDSg8WA8xLeLtm8bvEw/ZUBPM4sZ9tGHChNDeCCiRYSxApNdJOFJJbN2Rb3MERo2pqkhVB0gBTTGmJJPOccRsDdxOECYaPiO8Zy7ksxzJnm6krPbNrbW1tDEKCiFoniA71ADhU1MpILhIqxhMG7TLrpnlMZd6cp5pxMrl6G1pJKwtvxF1CSmGqrflXE/SW2nA9cq/YUAARI2/wDlvPnhM0DEoBqrKwU1Hs6lqic/2zE7W8YDKGoTrzPpMr5jpUtwBPlOYxGMRnc5sSx65fXVAA4lg6NEqUrgI7W3AwExv4pc7h1TBE8UiDN9NQgOk3AngmUTJpl//Z",
    "downloads": [
      {
        "label": "卷 1",
        "github": "https://raw.githubusercontent.com/laoye666-6/dsh-plugin-media-wallpaper/main/presets/parts/hatsune-2k.zip.001",
        "cdn": "https://cdn.jsdelivr.net/gh/laoye666-6/dsh-plugin-media-wallpaper@v0.2.4/presets/parts/hatsune-2k.zip.001"
      },
      {
        "label": "卷 2",
        "github": "https://raw.githubusercontent.com/laoye666-6/dsh-plugin-media-wallpaper/main/presets/parts/hatsune-2k.zip.002",
        "cdn": "https://cdn.jsdelivr.net/gh/laoye666-6/dsh-plugin-media-wallpaper@v0.2.4/presets/parts/hatsune-2k.zip.002"
      },
      {
        "label": "卷 3",
        "github": "https://raw.githubusercontent.com/laoye666-6/dsh-plugin-media-wallpaper/main/presets/parts/hatsune-2k.zip.003",
        "cdn": "https://cdn.jsdelivr.net/gh/laoye666-6/dsh-plugin-media-wallpaper@v0.2.4/presets/parts/hatsune-2k.zip.003"
      }
    ]
  }
];

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

// src/client/presets.ts
function isZip(bytes) {
  return bytes.length >= 4 && bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4;
}
async function downloadAll(sources, onProgress, signal) {
  const chunks = [];
  for (let i = 0; i < sources.length; i++) {
    const label = sources.length > 1 ? `第 ${i + 1}/${sources.length} 卷` : "下载中";
    const urls = [sources[i].cdn, sources[i].github];
    let lastErr = null;
    let done = false;
    for (const url of urls) {
      try {
        const res = await fetch(url, { signal, cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = new Uint8Array(await res.arrayBuffer());
        chunks.push(buf);
        onProgress({ phase: "downloading", ratio: (i + 1) / sources.length, detail: label });
        done = true;
        break;
      } catch (err) {
        if (signal?.aborted) throw err;
        lastErr = err;
      }
    }
    if (!done) throw new Error(`${label} 下载失败：${String(lastErr)}`);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return merged;
}
function readZipEntries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  const minStart = Math.max(0, bytes.length - 66e3);
  for (let i = bytes.length - 22; i >= minStart; i--) {
    if (view.getUint32(i, true) === 101010256) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP 结构无效（未找到 EOCD）");
  const count = view.getUint16(eocd + 10, true);
  let cd = view.getUint32(eocd + 16, true);
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (view.getUint32(cd, true) !== 33639248) break;
    const method = view.getUint16(cd + 10, true);
    const compressedSize = view.getUint32(cd + 20, true);
    const uncompressedSize = view.getUint32(cd + 24, true);
    const nameLen = view.getUint16(cd + 28, true);
    const extraLen = view.getUint16(cd + 30, true);
    const commentLen = view.getUint16(cd + 32, true);
    const localOffset = view.getUint32(cd + 42, true);
    const name2 = new TextDecoder().decode(bytes.subarray(cd + 46, cd + 46 + nameLen));
    const lfhNameLen = view.getUint16(localOffset + 26, true);
    const lfhExtraLen = view.getUint16(localOffset + 28, true);
    entries.push({
      name: name2,
      method,
      compressedSize,
      uncompressedSize,
      dataOffset: localOffset + 30 + lfhNameLen + lfhExtraLen
    });
    cd += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}
async function inflateRaw(data) {
  const copy = data.slice();
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function extractFirstFile(zip) {
  const entries = readZipEntries(zip);
  const entry = entries.find((e) => !e.name.endsWith("/")) ?? entries[0];
  if (!entry) throw new Error("压缩包内没有文件");
  const raw = zip.subarray(entry.dataOffset, entry.dataOffset + entry.compressedSize);
  const data = entry.method === 0 ? raw : await inflateRaw(raw);
  return { name: entry.name, data };
}
async function fetchPresetMedia(preset, onProgress, signal) {
  onProgress({ phase: "downloading", ratio: 0 });
  const merged = await downloadAll(preset.downloads, onProgress, signal);
  let data = merged;
  let fileName = preset.downloads.length > 1 ? `${preset.id}` : preset.id;
  if (isZip(merged)) {
    onProgress({ phase: "extracting", ratio: 0, detail: "解压中" });
    const extracted = await extractFirstFile(merged);
    data = extracted.data;
    fileName = extracted.name;
  }
  onProgress({ phase: "saving", ratio: 0, detail: "写入本地媒体库" });
  const blob = new Blob([data.slice()], { type: preset.mime });
  return { blob, fileName };
}

// src/client/settings.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var STR = {
  zh: {
    title: "壁纸",
    enabled: "启用壁纸背景",
    pick: "选择图片 / 视频",
    presets: "预置壁纸",
    download: "下载",
    copyLink: "复制链接",
    copied: "已复制 ✓",
    presetsHint: "一键应用由插件自动完成下载、合并与解压；也可手动下载留档",
    apply: "一键应用",
    applying: "处理中…",
    manualDownload: "手动下载",
    applyFailed: "应用失败：",
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
    textColor: "字体颜色",
    textModeOff: "关",
    textModeAuto: "自动",
    textModeCustom: "自定义",
    textColorPick: "选择颜色",
    accentAuto: "主色调跟随背景",
    finishHint: "作用于输入框、新对话与设置面板等前景 UI；背景模糊请用高斯模糊滑杆",
    opacityHint: "开关控制该区域是否透出壁纸，滑杆单独调节各自的不透明度",
    opaque: "不透明",
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
    presets: "Preset wallpapers",
    download: "Download",
    copyLink: "Copy link",
    copied: "Copied ✓",
    presetsHint: "One-click applies downloads, merges and extracts automatically; manual download is also available",
    apply: "Apply",
    applying: "Working…",
    manualDownload: "Manual download",
    applyFailed: "Apply failed: ",
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
    textColor: "Text color",
    textModeOff: "Off",
    textModeAuto: "Auto",
    textModeCustom: "Custom",
    textColorPick: "Pick color",
    accentAuto: "Accent follows background",
    finishHint: "Applies to composer, hero and settings panels; use Gaussian blur for the background",
    opacityHint: "Toggle whether a region shows the wallpaper; each slider adjusts its own opacity",
    opaque: "Opaque",
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
  const [applying, setApplying] = (0, import_react.useState)("");
  const [progress, setProgress] = (0, import_react.useState)(null);
  const abortRef = (0, import_react.useRef)(null);
  const hasMedia = s.mediaId !== null;
  const thumb = hasMedia ? currentObjectUrl() : null;
  async function applyPreset(p) {
    if (applying) return;
    setError("");
    setApplying(p.id);
    setProgress({ phase: "downloading", ratio: 0 });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { blob, fileName } = await fetchPresetMedia(p, setProgress, controller.signal);
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `wp-${Date.now().toString(36)}`;
      const prev = getSnapshot().mediaId;
      await putMedia({ id, blob, mime: p.mime, name: fileName, addedAt: Date.now() });
      if (prev && prev !== id) void deleteMedia(prev);
      set({
        mediaId: id,
        mediaType: p.kind,
        formatLabel: p.mime === "image/jpeg" ? "JPEG" : "MP4",
        mediaName: p.name,
        enabled: true
      });
      setProgress({ phase: "done", ratio: 1 });
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(String(err instanceof Error ? err.message : err));
      }
    } finally {
      setApplying("");
      abortRef.current = null;
      setTimeout(() => setProgress(null), 1200);
    }
  }
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
      PRESETS.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wp-title", children: t.presets }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-presets", children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-preset", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { className: "wp-preset-thumb", src: p.thumb, alt: p.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wp-preset-name", title: p.name, children: p.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-preset-size", children: [
            p.kind === "video" ? "▶ " : "",
            p.sizeLabel
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "wp-btn wp-preset-apply",
              disabled: applying !== "",
              onClick: () => void applyPreset(p),
              children: applying === p.id ? t.applying : t.apply
            }
          ),
          applying === p.id && progress ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-progress", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-progress-bar", style: { width: `${Math.round(progress.ratio * 100)}%` } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wp-progress-text", children: [
              progress.phase === "downloading" ? `${Math.round(progress.ratio * 100)}%` : "",
              progress.detail ? ` ${progress.detail}` : ""
            ] })
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: "wp-preset-manual", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { className: "wp-preset-manual-summary", children: t.manualDownload }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-preset-actions", children: p.downloads.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-preset-dl", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wp-preset-dl-label", children: d.label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "wp-mini-btn", onClick: () => window.open(d.github, "_blank"), children: "GitHub" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "wp-mini-btn", onClick: () => window.open(d.cdn, "_blank"), children: "国内" })
            ] }, d.label)) }),
            p.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-hint", children: p.hint }) : null
          ] })
        ] }, p.id)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-hint", children: t.presetsHint })
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-seg", role: "radiogroup", "aria-label": t.finish, children: [
          ["none", t.finishNone],
          ["frosted", t.finishFrosted],
          ["liquid", t.finishLiquid]
        ].map(([v, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: "wp-seg-btn",
            "data-active": s.finish === v ? "1" : "0",
            onClick: () => set({ finish: v }),
            children: label
          },
          v
        )) })
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
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.textColor }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-seg", role: "radiogroup", "aria-label": t.textColor, children: [
          ["off", t.textModeOff],
          ["auto", t.textModeAuto],
          ["custom", t.textModeCustom]
        ].map(([m, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: "wp-seg-btn",
            "data-active": s.textColorMode === m ? "1" : "0",
            onClick: () => set({ textColorMode: m }),
            children: label
          },
          m
        )) })
      ] }),
      s.textColorMode === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.textColorPick }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "color",
            className: "wp-color",
            value: s.textColor,
            onChange: (e) => set({ textColor: e.target.value })
          }
        )
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-row", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-check", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: s.accentAuto,
            onChange: (e) => set({ accentAuto: e.target.checked })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.accentAuto })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wp-title", children: t.transparency }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wp-hint", children: t.opacityHint }),
      [
        ["sidebar", t.tSidebar],
        ["topbar", t.tTopbar],
        ["main", t.tMain],
        ["rightbar", t.tRightbar],
        ["cards", t.tCards]
      ].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wp-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wp-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: s.transparent[key],
              onChange: (e) => setTransparency({ [key]: e.target.checked })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "wp-range",
            style: { maxWidth: 150 },
            type: "range",
            min: 0,
            max: 100,
            step: 5,
            value: s.opacity[key],
            onChange: (e) => setOpacity({ [key]: Number(e.target.value) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wp-value", style: { width: 40, textAlign: "right" }, children: s.transparent[key] ? `${s.opacity[key]}%` : t.opaque })
      ] }, key))
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
var lastTint = null;
var ACCENT_KEYS = ["--dsw-static-blue-400", "--dsw-static-blue-500", "--dsw-static-blue-600", "--dsw-static-deepseek-450"];
function captureAccents() {
  if (typeof document === "undefined") return;
  const body = document.body;
  if (!body || body.dataset.wpAccentCaptured === "1") return;
  for (const key of ACCENT_KEYS) {
    const value = getComputedStyle(body).getPropertyValue(key).trim();
    if (value) body.style.setProperty(`${key.replace("--dsw-static-", "--wp-accent-base-")}`, value);
  }
  body.dataset.wpAccentCaptured = "1";
}
var lastAutoTextDark = false;
function updateAutoText() {
  const body = typeof document !== "undefined" ? document.body : null;
  if (!body) return;
  const s = getSnapshot();
  if (s.textColorMode !== "auto" || lastTint === null) {
    body.style.removeProperty("--wp-text-color-auto");
    return;
  }
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(lastTint);
  if (!m) return;
  const wall = [Number(m[1]), Number(m[2]), Number(m[3])];
  const mix = (a, b, t) => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t)
  ];
  const glassTint = s.tintFollow ? mix(wall, [255, 255, 255], s.tintStrength / 100) : [255, 255, 255];
  const glassAlpha = Math.min(0.92, s.opacity.cards / 100 * 1.2);
  const effective = mix(wall, glassTint, glassAlpha);
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * lin(effective[0]) + 0.7152 * lin(effective[1]) + 0.0722 * lin(effective[2]);
  if (luminance > 0.3) lastAutoTextDark = true;
  else if (luminance < 0.22) lastAutoTextDark = false;
  body.style.setProperty("--wp-text-color-current", lastAutoTextDark ? "#1b1c22" : "#f5f6f7");
}
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
  updateAutoText();
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
    captureAccents();
    unsubscribe = subscribe(() => applyAll(getSnapshot()));
    registerSettingsSlots(ctx);
    onTint((color) => {
      const body = typeof document !== "undefined" ? document.body : null;
      if (!body) return;
      lastTint = color;
      if (color === null) body.style.removeProperty("--wp-tint");
      else body.style.setProperty("--wp-tint", color);
      updateAutoText();
    });
    ctx.effect?.(() => {
      return () => {
        unsubscribe?.();
        unsubscribe = null;
        loadedMediaId = null;
        lastTint = null;
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