# dsh-plugin-media-wallpaper

DeepSeek Harness（DSH）壁纸插件 —— 在 Web UI / 桌面版中更换图片或视频背景。

**纯客户端插件**：零服务端逻辑，所有设置保存在浏览器本地（localStorage），壁纸文件保存在浏览器 IndexedDB（支持大体积视频）。官方 Web 版与各类桌面版（Electron 壳）行为完全一致。

> 命名说明：npm 包名与 GitHub 仓库均为 **`dsh-plugin-media-wallpaper`**（npm 原名 `dsh-plugin-wallpaper` 已被他人占用，故改名）。

## 功能

- **图片 / 视频背景**：GIF、动图 WebP、APNG、静态 PNG / JPEG 图片；MP4、WebM 视频（自动循环静音播放）
- **格式自动识别**：按文件魔数嗅探（非扩展名），设置面板显示识别徽标
- **自带画质调节**：压暗（0–90%）、亮度（20–200%）、高斯模糊（0–40px，自动防边缘露底）
- **界面色调跟随背景**：canvas 取样主色混入界面表面（强度可调），视频播放时自动跟随画面变化
- **填充方式**：填满（裁剪）/ 适应（完整显示）/ 拉伸 / 平铺
- **逐组件透明化**：侧栏、顶栏（标题栏）、主内容区、右栏、卡片面板五个独立开关 + 表面不透明度滑杆
- **双设置入口**：侧栏 → 设置 → 「壁纸」分区；以及 插件管理 → 本插件详情页
- 自动尊重系统「减弱透明度」可达性偏好；插件停用后界面完全还原（含样式回收）

## 版本兼容

- 面向 **DSH 0.2.x**（npm `@deepseek-ai/dsh` latest `0.2.0-rc.2` / master，机制已于 2026-10-03 对照 `dsh-v0.2.1-alpha.1` 源码逐项核对）
- 依赖的官方机制：`dsh.client` 清单、懒 CJS 工厂包装（`window.__ModuleLoader__.load`）、平台冻结模块表（react / react/jsx-runtime）、`settings.section` 与 `plugins.detail.section` 插槽、语义 token（`--dsw-alias-*` / `--dsw-specific-sidebar-fill`）、样式归属标记（`data-plugin`）
- AppFrame 结构识别失败时自动进入全局 token 兜底模式，不会白屏

## 构建（仅开发时需要）

```sh
cd dsh-plugin-wallpaper
npm install
npm run build        # 产出 lib/index.js + lib/client.js
npm run typecheck    # 可选：tsc --noEmit
npm run smoke        # 可选：Node 最小 DOM 桩自检
```

> 安装使用无需构建：仓库内已提交预构建产物 `lib/`，git 安装直接可用。

## 安装到 DSH

**方式一（推荐，国内网络）：npm 源安装** —— 自动走你配置的镜像（如 npmmirror.com），不触碰 GitHub：

```sh
dsh plugin --profile dshwallpaper add dsh-plugin-media-wallpaper
dsh --profile dshwallpaper   # 启动该组合
```

**方式二：GitHub 一条指令安装**（任何机器）：

```sh
dsh plugin --profile dshwallpaper add github:laoye666-6/dsh-plugin-media-wallpaper
```

- 仓库内置预构建产物，拉取即用；插件无构建脚本，pnpm ≥ 10 亦无需授权（无需 allowBuilds）
- 首次使用会自动初始化 profile（以 `@deepseek-ai/dsh-base` 为第一个组合包）
- 安全建议：可锁定提交安装 —— `github:laoye666-6/dsh-plugin-media-wallpaper#<commit-sha>`

**方式三（本机开发路径）**：

```sh
dsh plugin --profile dshwallpaper add "E:\Deepseek Harness\dsh-plugin-wallpaper"
```

**方式四（开发调试，免安装）**：

```sh
dsh web --patch "E:\Deepseek Harness\dsh-plugin-wallpaper\cordis.patch.yml"
```

关于 profile 名（示例用 `dshwallpaper`；profile = DSH 的命名配置组合，位于 `$DSH_HOME/profiles/<名字>/`，决定启动时加载哪些 bundle）：

- 名字自己取，首次安装时不存在会自动创建（以 `@deepseek-ai/dsh-base` 初始化）；之后启动也用同名
- 自己命令启动：装和启用用同一个名字即可
- 桌面版（Electron 壳）：若其启动参数/快捷方式带 `--profile xxx`，就用那个名字安装，保证插件装进壳实际使用的组合
- 验证是否装对：`dsh --profile dshwallpaper --dump-config`，输出出现 `# == dsh-plugin-media-wallpaper` 一层即成功

安装后重启 `dsh web` 或桌面版客户端。

## 使用

1. 打开 **设置 → 壁纸**（或 插件管理 → Wallpaper 详情页）
2. 点击「选择图片 / 视频」，选择本地文件（格式自动识别）
3. 按需调整填充方式、模糊 / 亮度 / 压暗、色调跟随
4. 在「组件透明化」里勾选希望透出壁纸的区域（默认开启侧栏 / 顶栏 / 卡片）
5. 「清除壁纸」删除文件并还原界面；「恢复默认」重置全部设置

## 验收清单

- [ ] 分别选择 GIF / APNG / 动图 WebP / PNG / JPEG / MP4 / WebM，徽标显示正确，背景正常渲染
- [ ] 视频自动循环静音播放，无声音、不挡鼠标
- [ ] 四种填充方式生效（视频平铺按填满处理并有提示）
- [ ] 模糊 / 亮度 / 压暗拖动即时生效且互不影响界面文字
- [ ] 开启色调跟随：界面表面混入壁纸主色；视频播放时色相随画面变化
- [ ] 五个透明开关分别只影响目标区域；表面不透明度滑杆生效
- [ ] 亮 / 暗主题切换后透明化颜色仍正确
- [ ] 禁用插件 / 清除壁纸后界面完全还原、无残留样式

## 已知限制

- 视频平铺（tile）由「填满」代替（`<video>` 无法平铺）
- 色调取样对动图取首帧（对色调跟随足够稳定）
- 壁纸文件存于浏览器 IndexedDB：清理浏览器数据会丢失壁纸与设置（重新选择即可）
- 透明化基值取自官方 `design-platform.css` 当前语义（bg-layer 静态值含亮 / 暗分支）；若官方大版本重构 token，需同步更新 `src/client/styles.ts`

## 发布流程（维护者）

1. 修改代码 → `npm run build && npm run typecheck && npm run smoke`
2. 提交（**必须包含更新后的 `lib/`**，git 安装用户拿到的是预构建产物）
3. 发布，按渠道：
   - **npm（国内推荐渠道）**：`npm login` 后执行 `npm publish`；npmmirror 会自动同步（也可 `curl -X PUT https://registry.npmmirror.com/-/package/dsh-plugin-media-wallpaper/syncs` 催一下）
   - **GitHub**：网络可达时 `git push origin main --tags`（首次远端为 API 引导的历史，需 `--force` 对齐）；git push 不通时 `npm run publish:api -- "commit message"` 经 REST API 整树发布
4. 安装端锁定版本建议：npm 固定 `dsh-plugin-media-wallpaper@<version>`；GitHub 固定 `#<commit-sha>`

## 目录结构

```
├── package.json / cordis.patch.yml   # dsh.bundle + dsh.client 声明
├── scripts/build.mjs                 # esbuild 构建 + 官方懒 CJS 工厂包装
├── scripts/smoke.mjs                 # Node 桩自检（包装格式/装配/插槽/投影/清理）
├── scripts/publish-api.mjs           # 经 GitHub REST API 发布（git push 被阻断时的替代通道）
└── src/
    ├── index.ts                      # Host 半侧（空实现，纯客户端插件）
    └── client/
        ├── index.ts                  # 浏览器入口（装配/清理）
        ├── state.ts                  # 设置 store + localStorage
        ├── storage.ts                # IndexedDB 媒体存储 + objectURL
        ├── format.ts                 # 魔数格式识别
        ├── layer.ts                  # 壁纸层（img背景/video + 滤镜 + 压暗）
        ├── surface.ts                # AppFrame 打标 + 设置投影 + 兜底
        ├── palette.ts                # 主色取样（canvas 均值）
        ├── settings.tsx              # 设置面板（双插槽复用）
        ├── styles.ts                 # 全局 CSS（data-plugin 归属标记）
        └── types.ts                  # 官方 API 的最小结构类型
```
