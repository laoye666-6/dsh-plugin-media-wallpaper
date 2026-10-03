/**
 * 壁纸格式自动识别：读文件头部字节做魔数嗅探。
 *
 * 支持（与需求一一对应）：
 *  - 静态图片：PNG / JPEG
 *  - 动图：GIF（浏览器原生播放）、动图 WebP（RIFF 内含 ANIM 块）、APNG（PNG 内含 acTL 块）
 *  - 视频：MP4（ftyp box）、WebM（EBML 头，Matroska 家族）
 */

export type DetectedFormat =
  | { kind: 'image'; animated: boolean; mime: 'image/gif' | 'image/png' | 'image/webp' | 'image/jpeg'; label: string }
  | { kind: 'video'; mime: 'video/mp4' | 'video/webm'; label: string }

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = ''
  for (let i = offset; i < Math.min(offset + length, bytes.length); i++) out += String.fromCharCode(bytes[i]!)
  return out
}

function indexOfAscii(bytes: Uint8Array, token: string, from: number, to: number): number {
  const end = Math.min(to, bytes.length)
  outer: for (let i = from; i <= end - token.length; i++) {
    for (let j = 0; j < token.length; j++) {
      if (bytes[i + j] !== token.charCodeAt(j)) continue outer
    }
    return i
  }
  return -1
}

function detectPng(bytes: Uint8Array): DetectedFormat {
  // APNG 规范：acTL 必须出现在首个 IDAT 之前；只扫头部窗口即可
  const windowEnd = Math.min(bytes.length, 4096)
  const actl = indexOfAscii(bytes, 'acTL', 8, windowEnd)
  const idat = indexOfAscii(bytes, 'IDAT', 8, windowEnd)
  const animated = actl !== -1 && (idat === -1 || actl < idat)
  return {
    kind: 'image',
    animated,
    mime: 'image/png',
    label: animated ? 'APNG' : 'PNG',
  }
}

function detectWebp(bytes: Uint8Array): DetectedFormat {
  // RIFF 容器：遍历子块找 'ANIM '（注意空格是块 id 的一部分）
  const animated = indexOfAscii(bytes, 'ANIM', 12, Math.min(bytes.length, 4096)) !== -1
  return {
    kind: 'image',
    animated,
    mime: 'image/webp',
    label: animated ? '动图 WebP' : '静态 WebP',
  }
}

function detectMp4(bytes: Uint8Array): DetectedFormat {
  // ISO BMFF：offset 4..8 为 'ftyp'；兼容 brand 不区分（isom/mp42/avc1/M4V …）
  return { kind: 'video', mime: 'video/mp4', label: 'MP4' }
}

function isMp4(bytes: Uint8Array): boolean {
  return bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp'
}

export function detectFormat(bytes: Uint8Array): DetectedFormat | null {
  if (bytes.length < 12) return null

  // GIF87a / GIF89a
  if (ascii(bytes, 0, 3) === 'GIF') {
    return { kind: 'image', animated: true, mime: 'image/gif', label: 'GIF' }
  }
  // PNG 签名 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return detectPng(bytes)
  }
  // RIFF....WEBP
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return detectWebp(bytes)
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { kind: 'image', animated: false, mime: 'image/jpeg', label: 'JPEG' }
  }
  if (isMp4(bytes)) {
    return detectMp4(bytes)
  }
  // EBML 头：WebM / Matroska
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { kind: 'video', mime: 'video/webm', label: 'WebM' }
  }
  return null
}

/** 供文件选择框使用的 accept 串。 */
export const ACCEPT_ATTR =
  'image/gif,image/png,image/apng,image/webp,image/jpeg,video/mp4,video/webm' +
  ',.gif,.png,.apng,.webp,.jpg,.jpeg,.mp4,.webm,.m4v,.mkv'
