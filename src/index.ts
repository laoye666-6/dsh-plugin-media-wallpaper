/**
 * dsh-plugin-wallpaper — Host（Node）半侧。
 *
 * 纯客户端插件：本插件的全部能力（壁纸层、滤镜、透明化、设置面板）
 * 都在浏览器半侧 `./client` 中实现，Host 不注册任何服务。
 * 此处保留空 apply 仅为满足插件模块约定（导出 name / apply）。
 */
export const name = 'dsh-plugin-wallpaper'

export function apply(): void {
  // intentionally empty — client-only plugin
}
