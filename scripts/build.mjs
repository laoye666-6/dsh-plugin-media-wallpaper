/**
 * dsh-plugin-wallpaper 构建脚本。
 *
 * 产物（官方约定，见 packages/client/tsdown.client.ts 与 modules README）：
 *  - lib/index.js   Host 半侧（ESM，插件行通过包名解析到此）
 *  - lib/client.js  浏览器半侧：CJS，包裹为
 *      window.__ModuleLoader__.load({ id, factory: (require) => { ... return module.exports; } });
 *    external 仅取自平台冻结模块表（web/src/seed.ts）：react / react/jsx-runtime。
 */
import { build } from 'esbuild'
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(root, '..')
const out = (p) => join(pkgRoot, p)

// 包名唯一来源：package.json。经 define 注入两侧 bundle（src/client/identity.ts 消费），
// 保证 npm 包名、__ModuleLoader__ 工厂 id、data-plugin 标记、插槽条目 id 完全一致。
const pkg = JSON.parse(readFileSync(out('package.json'), 'utf8'))
const PKG_ID = pkg.name
const PLUGIN_DEFINE = {
  __DSH_PLUGIN_PKG__: JSON.stringify(PKG_ID),
  __DSH_PLUGIN_VERSION__: JSON.stringify(pkg.version),
}

// ---- 预置壁纸：生成 src/client/presets-data.gen.ts ----
// 预览图（480px JPEG）以 data URL 内嵌进客户端包。媒体分发走双通道：
//   GitHub raw（直连） + jsDelivr（国内 CDN，单文件 ≤20MB，超限打分卷）。
const PRESETS_TAG = `v${pkg.version}`
const PRESETS_OWNER = 'laoye666-6'
const PRESETS_REPO = PKG_ID

function generatePresets() {
  const manifestPath = out('presets/manifest.json')
  if (!existsSync(manifestPath)) return
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entries = manifest
    .map((p) => {
      const thumbPath = out(`presets/thumb-${p.id}.jpg`)
      if (!existsSync(thumbPath)) {
        console.warn(`[presets] 缺少 ${p.id} 的缩略图，跳过`)
        return null
      }
      const thumb = `data:image/jpeg;base64,${readFileSync(thumbPath).toString('base64')}`
      // 分发文件：单文件直接用 presets/<file>；分卷（archive）用 presets/parts/<archive>.00N
      const downloads = []
      let hint = ''
      let sizeLabel = ''
      if (p.archive) {
        const partsDir = out('presets/parts')
        const parts = existsSync(partsDir)
          ? readdirSync(partsDir).filter((f) => f.startsWith(`${p.archive}.`)).sort()
          : []
        if (parts.length === 0) {
          console.warn(`[presets] 缺少 ${p.id} 的分卷文件，跳过`)
          return null
        }
        let total = 0
        for (const part of parts) total += statSync(out(`presets/parts/${part}`)).size
        const mb = (total / 1024 / 1024).toFixed(1)
        const single = parts.length === 1
        sizeLabel = single ? `${mb}MB（压缩包）` : `${mb}MB · ${parts.length} 卷`
        for (const part of parts) {
          const idx = parseInt(part.split('.').pop() ?? '0', 10)
          downloads.push({
            label: single ? '下载' : `卷 ${idx}`,
            github: `https://raw.githubusercontent.com/${PRESETS_OWNER}/${PRESETS_REPO}/main/presets/parts/${part}`,
            cdn: `https://cdn.jsdelivr.net/gh/${PRESETS_OWNER}/${PRESETS_REPO}@${PRESETS_TAG}/presets/parts/${part}`,
          })
        }
        hint = single
          ? `下载后解压出 ${p.quality ?? ''} 视频，再用「选择图片 / 视频」选用`
          : `${p.quality ?? ''} 分卷：全部下载后用命令合并再解压 —— copy /b ${parts.join('+')} ${p.archive}`
      } else {
        const filePath = out(`presets/${p.file}`)
        if (!existsSync(filePath)) {
          console.warn(`[presets] 缺少 ${p.id} 源文件，跳过`)
          return null
        }
        sizeLabel = `${(statSync(filePath).size / 1024 / 1024).toFixed(1)}MB`
        downloads.push({
          label: '下载',
          github: `https://raw.githubusercontent.com/${PRESETS_OWNER}/${PRESETS_REPO}/main/presets/${encodeURIComponent(p.file)}`,
          cdn: `https://cdn.jsdelivr.net/gh/${PRESETS_OWNER}/${PRESETS_REPO}@${PRESETS_TAG}/presets/${encodeURIComponent(p.file)}`,
        })
      }
      return { id: p.id, name: p.name, kind: p.kind, mime: p.mime, sizeLabel, hint, thumb, downloads }
    })
    .filter(Boolean)
  const ts = `/**
 * 由 scripts/build.mjs 从 presets/manifest.json + presets/ 生成，勿手改。
 * 预览图内嵌（data URL）；媒体走 GitHub raw（直连）与 jsDelivr（国内 CDN）双通道，
 * 大体积文件为分卷，下载后按 hint 合并解压。
 */
export interface PresetDownload {
  label: string
  /** GitHub raw 直连（适合可访问 GitHub 的网络） */
  github: string
  /** jsDelivr 国内 CDN */
  cdn: string
}
export interface PresetEntry {
  id: string
  name: string
  kind: 'image' | 'video'
  mime: string
  sizeLabel: string
  thumb: string
  downloads: PresetDownload[]
  hint: string
}

export const PRESETS: PresetEntry[] = ${JSON.stringify(entries, null, 2)}
`
  writeFileSync(out('src/client/presets-data.gen.ts'), ts)
  console.log(`[presets] ${entries.length} preset(s) generated`)
}

generatePresets()

// ---- Host 半侧 ----
await build({
  entryPoints: [out('src/index.ts')],
  outfile: out('lib/index.js'),
  format: 'esm',
  platform: 'node',
  target: 'node18',
  bundle: true,
  define: PLUGIN_DEFINE,
  sourcemap: false,
  charset: 'utf8',
  logLevel: 'info',
})

// ---- 浏览器半侧 ----
const client = await build({
  entryPoints: [out('src/client/index.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  define: { 'process.env.NODE_ENV': '"production"', ...PLUGIN_DEFINE },
  write: false,
  charset: 'utf8',
  legalComments: 'none',
  logLevel: 'info',
})

const code = client.outputFiles[0].text
const banner = `window.__ModuleLoader__.load({ id: '${PKG_ID}', factory: (require) => {\nvar module = { exports: {} };\n`
const footer = `\nreturn module.exports;\n} });`
mkdirSync(out('lib'), { recursive: true })
writeFileSync(out('lib/client.js'), banner + code + footer)

console.log(`[build] lib/client.js ${(banner.length + code.length + footer.length) / 1024 | 0} KiB (wrapped lazy-CJS factory)`)
