# dsh-plugin-media-wallpaper

DeepSeek Harness（DSH）壁纸插件 —— 在 Web UI / 桌面版中更换图片或视频背景。

**纯客户端插件**：零服务端逻辑，所有设置保存在浏览器本地（localStorage），壁纸文件保存在浏览器 IndexedDB（支持大体积视频）。官方 Web 版与各类桌面版（Electron 壳）行为完全一致。

> 命名说明：npm 包名与 GitHub 仓库均为 **`dsh-plugin-media-wallpaper`**（npm 原名 `dsh-plugin-wallpaper` 已被他人占用，故改名）。

## 功能

- **图片 / 视频背景**：GIF、动图 WebP、APNG、静态 PNG / JPEG 图片；MP4、WebM 视频（自动循环静音播放）
- **格式自动识别**：按文件魔数嗅探（非扩展名），设置面板显示识别徽标
- **自带画质调节**：压暗（0–90%）、亮度（20–200%）、高斯模糊（0–40px，自动防边缘露底）
- **界面色调跟随背景**：canvas 取样主色混入界面表面（强度可调），视频播放时自动跟随画面变化
- **字体颜色**：关 / 自动 / 自定义。自动模式按「文字实际压在什么上面」分区选色：直接透出壁纸的区域按壁纸亮度（含亮度/压暗）配深字或浅字；卡片、气泡、输入框、弹层等自有表面沿用 DSH 主题语义色（深色模式不会反成看不清的深字）
- **主题联动**：设置页顶部内置 **浅色 / 深色 / 跟随主题** 三个选项，直接读写 DSH 全局主题服务，与 设置 → 通用设置 → 外观 双向同步（不另建一套主题，避免两套主题互相打架）
- **填充方式**：填满（裁剪）/ 适应（完整显示）/ 拉伸 / 平铺
- **逐组件透明化**：侧栏、顶栏（标题栏）、主内容区、右栏、卡片面板五个独立开关 + 表面不透明度滑杆
- **开屏动画（可选）**：启动时先全屏播放一段动画（视频 / GIF / 动图 WebP / APNG / 图片），播完渐隐，露出聊天与壁纸；会等开机动画开始收场再满不透明接上（交叉叠化），每会话只播一次，不挡点击
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
2. 页面顶部的「主题」可直接切 **浅色 / 深色 / 跟随主题**（等同 设置 → 通用设置 → 外观，双向同步）
3. 点击「选择图片 / 视频」，选择本地文件（格式自动识别）
4. 按需调整填充方式、模糊 / 亮度 / 压暗、色调跟随
5. 在「组件透明化」里控制各区域：开关**开启 = 该区域透出壁纸**（默认全开）；关闭 = 恢复该区域不透明（依赖结构识别，失败时该区域保持透明）
6. （可选）在「开屏动画」里选择一段动画：启用后下次启动会先全屏播放它，播完渐隐露出壁纸；可调渐隐时长、图片停留时长、填充方式，以及「同一会话只播一次」「等开机动画结束后再播」；「预览播放」可立即全屏试播（不消耗每会话一次的标记）
7. 「清除壁纸」删除文件并还原界面；「恢复默认」重置全部设置

## 验收清单

- [ ] 分别选择 GIF / APNG / 动图 WebP / PNG / JPEG / MP4 / WebM，徽标显示正确，背景正常渲染
- [ ] 视频自动循环静音播放，无声音、不挡鼠标
- [ ] 四种填充方式生效（视频平铺按填满处理并有提示）
- [ ] 模糊 / 亮度 / 压暗拖动即时生效且互不影响界面文字
- [ ] 开启色调跟随：界面表面混入壁纸主色；视频播放时色相随画面变化
- [ ] 五个透明开关分别只影响目标区域；表面不透明度滑杆生效
- [ ] 亮 / 暗主题切换后透明化颜色仍正确
- [ ] 设置页「主题」的 浅色 / 深色 / 跟随主题 与 通用设置 → 外观 双向同步；切深色后 body 出现 `data-ds-dark-theme`
- [ ] 禁用插件 / 清除壁纸后界面完全还原、无残留样式
- [ ] 开屏动画：选择视频后，下次启动等开机动画开始离场再全屏播放，播完按设置渐隐露出壁纸；刷新（同一会话）不再重播
- [ ] 开屏动画：图片/GIF 按「图片停留」时长收；视频播完即收；播不出来时 2 秒内自动撤层、不盖住界面
- [ ] 「预览播放」立刻全屏试播，且不影响每会话一次的标记

## 已知限制

- 视频平铺（tile）由「填满」代替（`<video>` 无法平铺）
- 开屏动画层 `pointer-events:none`：不吞点击，所以也不能"点一下跳过"（与 dsh-chat-wallpaper 的选择一致）；播不出来时会在 2 秒内自动撤层
- 开屏动画的「等开机动画结束」依赖 `#dsh-startup-root` 与 `dsu-handoff` / `dsu-gone` class（与 dsh-startup-screen 的约定）；没装开机动画插件时宽限 3 秒后直接播
- 色调取样对动图取首帧（对色调跟随足够稳定）
- 「界面色调跟随背景」在侧栏 / 右栏上的叠加会随各自不透明度淡出：把侧栏滑到 0 时叠加也不会再出现（避免 0% 的侧栏还盖着一层颜色）
- 「组件透明化」控制的是各区域的**底色**：侧栏里的按钮 / 会话行、输入框、气泡分别属于「卡片与面板 / 输入栏」，需要单独调；桌面客户端的**原生窗口菜单栏与窗口按钮**由桌面壳绘制，不在网页内容里，「顶栏 / 标题栏」只能控制网页内的标题栏拖拽条
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
        ├── intro.ts                  # 开屏动画（等开机动画 → 全屏播放 → 渐隐露出壁纸）
        ├── settings.tsx              # 设置面板（双插槽复用）
        ├── styles.ts                 # 全局 CSS（data-plugin 归属标记）
        └── types.ts                  # 官方 API 的最小结构类型
```
