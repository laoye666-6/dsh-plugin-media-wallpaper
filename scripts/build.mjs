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
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(root, '..')
const out = (p) => join(pkgRoot, p)

const PKG_ID = 'dsh-plugin-wallpaper'

// ---- Host 半侧 ----
await build({
  entryPoints: [out('src/index.ts')],
  outfile: out('lib/index.js'),
  format: 'esm',
  platform: 'node',
  target: 'node18',
  bundle: false,
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
  define: { 'process.env.NODE_ENV': '"production"' },
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
