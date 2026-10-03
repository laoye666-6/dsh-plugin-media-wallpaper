/**
 * 插件包名的唯一运行时来源：构建时由 scripts/build.mjs 从 package.json
 * 的 name 字段注入（esbuild define），保证包名、bundle id、样式归属标记、
 * 插槽条目 id 全部一致，改名只需改 package.json。
 */
declare const __DSH_PLUGIN_PKG__: string
declare const __DSH_PLUGIN_VERSION__: string

export const PLUGIN_PKG: string = __DSH_PLUGIN_PKG__
export const PLUGIN_VERSION: string = __DSH_PLUGIN_VERSION__
