/**
 * 预置壁纸一键应用：下载 → 合并分卷（如为分卷压缩包）→ 解压 ZIP → 落地为当前壁纸。
 *
 * 全部在浏览器内完成，无需用户手动下载 / 合并 / 解压：
 *  - 下载：逐卷 fetch，优先国内 jsDelivr，失败回退 GitHub raw（两者均带 CORS 头）
 *  - 合并：按顺序拼接 ArrayBuffer
 *  - 解压：标准 ZIP（deflate）用原生 DecompressionStream('deflate-raw') 解压，零依赖
 * 进度通过回调上报，供设置面板展示。
 */

export type PresetPhase = 'downloading' | 'merging' | 'extracting' | 'saving' | 'done' | 'error'

export interface PresetProgress {
  phase: PresetPhase
  /** 0–1 */
  ratio: number
  /** 说明文字（如「第 2/3 卷」） */
  detail?: string
}

export interface PresetSource {
  /** GitHub raw 直连 */
  github: string
  /** jsDelivr 国内 CDN */
  cdn: string
}

/** 与 presets-data.gen.ts 的 PresetEntry 结构兼容（避免循环依赖）。 */
export interface PresetLike {
  id: string
  name: string
  kind: 'image' | 'video'
  mime: string
  thumb: string
  downloads: PresetSource[]
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
}

/** 顺序下载全部来源（每项优先 CDN，失败回退 GitHub），逐段上报进度。 */
async function downloadAll(
  sources: PresetSource[],
  onProgress: (p: PresetProgress) => void,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  for (let i = 0; i < sources.length; i++) {
    const label = sources.length > 1 ? `第 ${i + 1}/${sources.length} 卷` : '下载中'
    const urls = [sources[i]!.cdn, sources[i]!.github]
    let lastErr: unknown = null
    let done = false
    for (const url of urls) {
      try {
        const res = await fetch(url, { signal, cache: 'force-cache' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = new Uint8Array(await res.arrayBuffer())
        chunks.push(buf)
        onProgress({ phase: 'downloading', ratio: (i + 1) / sources.length, detail: label })
        done = true
        break
      } catch (err) {
        if (signal?.aborted) throw err
        lastErr = err
      }
    }
    if (!done) throw new Error(`${label} 下载失败：${String(lastErr)}`)
  }
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.length
  }
  return merged
}

interface ZipEntry {
  name: string
  method: number
  compressedSize: number
  uncompressedSize: number
  dataOffset: number
}

/** 解析 ZIP 目录项（只需支持本插件生成的标准 deflate/store 单卷包）。 */
function readZipEntries(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // 从尾部向前找 EOCD（0x06054b50）
  let eocd = -1
  const minStart = Math.max(0, bytes.length - 66000)
  for (let i = bytes.length - 22; i >= minStart; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('ZIP 结构无效（未找到 EOCD）')
  const count = view.getUint16(eocd + 10, true)
  let cd = view.getUint32(eocd + 16, true)
  const entries: ZipEntry[] = []
  for (let i = 0; i < count; i++) {
    if (view.getUint32(cd, true) !== 0x02014b50) break
    const method = view.getUint16(cd + 10, true)
    const compressedSize = view.getUint32(cd + 20, true)
    const uncompressedSize = view.getUint32(cd + 24, true)
    const nameLen = view.getUint16(cd + 28, true)
    const extraLen = view.getUint16(cd + 30, true)
    const commentLen = view.getUint16(cd + 32, true)
    const localOffset = view.getUint32(cd + 42, true)
    const name = new TextDecoder().decode(bytes.subarray(cd + 46, cd + 46 + nameLen))
    // 本地文件头：数据起始 = 本地偏移 + 30 + 本地文件名长度 + 本地扩展长度
    const lfhNameLen = view.getUint16(localOffset + 26, true)
    const lfhExtraLen = view.getUint16(localOffset + 28, true)
    entries.push({
      name,
      method,
      compressedSize,
      uncompressedSize,
      dataOffset: localOffset + 30 + lfhNameLen + lfhExtraLen,
    })
    cd += 46 + nameLen + extraLen + commentLen
  }
  return entries
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const copy = data.slice()
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** 从 ZIP 字节中取出第一个文件的内容。 */
async function extractFirstFile(zip: Uint8Array): Promise<{ name: string; data: Uint8Array }> {
  const entries = readZipEntries(zip)
  const entry = entries.find((e) => !e.name.endsWith('/')) ?? entries[0]
  if (!entry) throw new Error('压缩包内没有文件')
  const raw = zip.subarray(entry.dataOffset, entry.dataOffset + entry.compressedSize)
  const data = entry.method === 0 ? raw : await inflateRaw(raw)
  return { name: entry.name, data }
}

export interface ApplyResult {
  blob: Blob
  fileName: string
}

/**
 * 一键获取预置壁纸的媒体内容：下载全部分卷 → 合并 →（若是 ZIP）解压取首个文件。
 */
export async function fetchPresetMedia(
  preset: PresetLike,
  onProgress: (p: PresetProgress) => void,
  signal?: AbortSignal,
): Promise<ApplyResult> {
  onProgress({ phase: 'downloading', ratio: 0 })
  const merged = await downloadAll(preset.downloads, onProgress, signal)
  let data = merged
  let fileName = preset.downloads.length > 1 ? `${preset.id}` : preset.id
  if (isZip(merged)) {
    onProgress({ phase: 'extracting', ratio: 0, detail: '解压中' })
    const extracted = await extractFirstFile(merged)
    data = extracted.data
    fileName = extracted.name
  }
  onProgress({ phase: 'saving', ratio: 0, detail: '写入本地媒体库' })
  const blob = new Blob([data.slice()], { type: preset.mime })
  return { blob, fileName }
}
