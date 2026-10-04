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
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs'
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
// 预览图（480px JPEG）以 data URL 内嵌进客户端包；源文件（大体积媒体）作为
// GitHub Release 资产分发（git blob 有请求体积上限），设置面板提供下载链接。
const PRESETS_RELEASE_TAG = `v${pkg.version}`
function generatePresets() {
  const manifestPath = out('presets/manifest.json')
  if (!existsSync(manifestPath)) return
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entries = manifest
    .map((p) => {
      const thumbPath = out(`presets/thumb-${p.id}.jpg`)
      const filePath = out(`presets/${p.file}`)
      if (!existsSync(thumbPath) || !existsSync(filePath)) {
        console.warn(`[presets] 缺少 ${p.id} 的缩略图或源文件，跳过`)
        return null
      }
      const thumb = `data:image/jpeg;base64,${readFileSync(thumbPath).toString('base64')}`
      const sizeMb = (statSync(filePath).size / 1024 / 1024).toFixed(1)
      return { ...p, sizeMb, thumb, url: `https://github.com/laoye666-6/dsh-plugin-media-wallpaper/releases/download/${PRESETS_RELEASE_TAG}/${encodeURIComponent(p.file)}` }
    })
    .filter(Boolean)
  const ts = `/**
 * 由 scripts/build.mjs 从 presets/manifest.json + presets/ 生成，勿手改。
 * 预览图内嵌（data URL）；源文件存于仓库 presets/ 目录，设置面板提供下载链接。
 */
export interface PresetEntry {
  id: string
  name: string
  file: string
  mime: string
  kind: 'image' | 'video'
  sizeMb: string
  thumb: string
  url: string
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
