# Progress Log

## 2026-09-05 - Task: 工程迁移到本机后完成环境搭建并验证本地运行

### What was done
- 在新电脑上完成项目环境搭建：`npm install`（项目本身零外部依赖，仅生成 `package-lock.json` 锁定文件）。
- `npm run check` 通过：`server.js` / `worker.js` / `app.js` 三个文件语法检查无误。
- 后台启动本地服务（`node server.js`，端口 4174），落地页、后台预览页、`/api/config` 接口均返回 200。
- 使用 ZCode 内置浏览器实际打开 `http://localhost:4174/` 与 `http://localhost:4174/admin.html`，确认页面渲染与配置数据（3 个 WhatsApp 轮询号码、7 条 FAQ）加载正常，样式布局无异常。

### Testing
- `npm run check`：三个 JS 文件语法检查全部通过（Node v24.15.0，满足 engines >= 18 要求）。
- `curl` 冒烟测试：`/` 返回 200、`/admin.html` 返回 200、`/api/config` 返回完整配置 JSON（含 WhatsApp 号码与 7 条 FAQ）。
- 浏览器实测：落地页截图确认标题、WhatsApp 联系卡片、FAQ 卡片、Join 按钮渲染正常；后台预览页显示渠道编辑器、7 条 FAQ 表单与 TikTok Pixel 表单，数据与 `config.json` 一致。

### Notes
改动文件清单：
- `package-lock.json`：`npm install` 生成，锁定空依赖结构，无行为影响。
- `progress.md`：新建进度日志（本文件）。

回滚方式：删除 `package-lock.json` 与 `progress.md` 即回到迁移包原始状态；本地服务通过结束占用 4174 端口的 node 进程停止。

## 2026-09-05 - Task: 落地页美化与后台可视化配置扩展 + TikTok 像素/事件完善

### What was done
- 落地页卡片全面美化：所有卡片改为品牌色 SVG 图标芯片（WhatsApp/TikTok/Instagram/Facebook/Telegram/Email/Website/FAQ/Shop/Link 自动匹配），新增卡片入场动效、悬停抬升、头像浮动动效（自动尊重系统减弱动效设置）。
- 后台可视化配置扩展（本地 admin.html 与线上隐藏后台两套同步）：新增"页面背景图"配置（带浅色遮罩保证文字可读）；新增"菜单卡片"管理（与 F&Q 同级，可自由增删，图标按 URL 自动识别或按关键词指定，支持卡片背景图与启用开关）；联系渠道类型扩展至 TikTok/Instagram/Facebook，每张卡片可配背景图。
- TikTok 像素与事件绑定完善：Pixel ID（DADABN3C77U70STH52JG，来自用户平台截图）写入配置并实测像素脚本真实加载；新增 ViewContent 事件（落地页浏览，含电商参数）；Contact 事件携带 event_id；线上 Worker 新增 Events API 服务端转发（配置 TIKTOK_EVENTS_API_TOKEN secret 后自动生效，与浏览器端事件通过 event_id 去重；未配置 token 时完全跳过、不影响运行）。
- 修正前台 FAQ 卡片拼写：F&Q → FAQ（index.html 与 app.js 两处写死文案）。
- functions/ Pages 变体的隐藏后台页面与 Worker 后台保持同步（由 worker.js 模板程序化生成），避免旧后台保存时丢失新配置字段。

### Testing
- `npm run check`（server.js/worker.js/app.js）+ `node --check admin.js` 全部通过。
- 浏览器实测后台保存回路：设置页面背景图 + 新增 Instagram 渠道 + 新增 TikTok 菜单卡片 → 保存返回 "Saved successfully"，/api/config 落盘字段完整正确。
- 落地页实测：4 张卡片（WhatsApp/Instagram/Product Catalog/FAQ）图标与品牌色芯片渲染正确，cardIn 入场动效生效（animation-name: cardIn 0.5s），页面背景图应用（body.has-bg），FAQ 展开 7 条正常。
- TikTok 像素实测：window.ttq 已定义，analytics.tiktok.com 像素脚本真实加载（对应平台截图"检测不到基础代码"问题的修复验证）。
- /api/next-whatsapp 三连发轮询 index 0→1→2 正常（含新增 eventId 参数兼容性）。
- 线上 Worker 内嵌后台脚本：从模板提取后做语法检查与模拟运行均通过；functions/ 变体页面动态 import 校验通过。
- 测试数据已清理：配置恢复为干净状态（仅 WhatsApp 渠道、空菜单卡片、无背景图），临时 test-bg.svg 已删除。

### Notes
改动文件清单：
- `app.js`：重写卡片渲染层——SVG 图标系统、菜单卡片渲染、页面背景图应用、ViewContent/Contact 事件与 event_id 生成。
- `styles.css`：图标芯片样式、卡片/头像/按钮动效、页面背景图支持（含 prefers-reduced-motion 降级）、缓存版本升到 v=4。
- `index.html`：FAQ 拼写修正、静态兜底卡片同步、app.js 缓存版本升到 v=6。
- `admin.html`：新增外观配置区与菜单卡片管理区，渠道提示与事件说明文案更新。
- `admin.js`：新增菜单卡片渲染/收集、渠道类型扩展与卡片背景图字段、外观字段读写。
- `worker.js`：DEFAULT_CONFIG/publicConfig 扩展 appearance/menuCards，隐藏后台页面整体升级（外观/菜单卡片/渠道类型/背景图/启用开关），/api/next-whatsapp 增加 Events API 转发（forwardContactEvent，ctx.waitUntil）。
- `functions/lib/config.js`：publicConfig 同步透出 appearance/menuCards。
- `functions/manage-dpv-7f3a9c2e.js`：整页替换为与 Worker 后台一致的版本（程序化生成）。
- `config.json`：写入 TikTok Pixel ID，新增 appearance/menuCards 结构。
- `docs/CONFIG.md`：新增配置结构、图标规则、TikTok 事件与部署清单文档。
- `progress.md`：本日志。

回滚方式：本目录未纳入 git 版本控制，回滚点为迁移压缩包 design-perfume-vendor-2026-09-05.zip 中的原始文件；单文件回滚可将上述前端/后台文件用压缩包内同名文件覆盖还原，config.json 删除 tiktokPixelId 值及 appearance/menuCards 字段即可。本地服务通过结束占用 4174 端口的 node 进程停止。

## 2026-09-05 - Task: 联系渠道卡片增加“点击联系”提示

### What was done
- 所有联系渠道卡片（WhatsApp 及后续新增的社媒渠道）在图标右侧、卡片名上方增加 “TAP TO CONTACT” 呼吸动效提示药丸；菜单卡片与 FAQ 卡不受影响。
- 位置说明：未按字面放在图标与文字的横向空隙，而是放在名称上方居中——窄屏手机上长副标题会与悬浮提示重叠，此布局在所有宽度下都安全。
- index.html 静态兜底卡片同步加提示，样式与脚本缓存版本升级（styles v5 / app v7）。

### Testing
- node --check app.js 通过。
- 浏览器实测：提示药丸渲染可见、hintPulse 动画生效、仅出现在联系渠道卡片上（当前 WhatsApp 卡），FAQ/菜单卡无提示，截图确认布局无重叠、卡片高度变化自然。

### Notes
改动文件清单：
- `app.js`：cardHtml 增加 hint 参数，联系渠道卡片渲染提示药丸。
- `styles.css`：新增 .tap-hint 样式与 hintPulse 呼吸动效（respect prefers-reduced-motion）。
- `index.html`：静态兜底 WhatsApp 卡同步提示，缓存版本号升级。

回滚方式：用迁移压缩包内同名文件覆盖 app.js / styles.css / index.html 即可（或将三个文件中 hint 相关改动删除）。

## 2026-09-05 - Task: 借鉴 motionsites.ai 设计风格升级落地页视觉

### What was done
- 研究 motionsites.ai 模板库（内嵌浏览器首次加载超时、重试后成功打开并截图分析；该站动效过重导致后续滚动/截图超时，已关闭该标签页），提炼出适配本项目的四个设计要素并落地：
  1. 极光动态背景：页面无自定义背景图时，金/雾蓝两团光晕在背后缓慢漂移（body::before/::after，纯 CSS）；后台配置背景图后自动隐藏。
  2. 玻璃拟态：联系卡片、FAQ 面板、顶栏 DPV 徽章与分享按钮改为磨砂玻璃质感（半透明+背景模糊+白色发丝边框），卡片悬停带金色辉光。
  3. 金色元素（呼应 Golden Portal 类模板）：标题改金色渐变衬线字体、头像加旋转金色光环、Join 按钮改香槟金渐变+悬停扫光。
  4. 标题上方新增 "WHOLESALE · FACTORY DIRECT" 金色描边徽章（仿其 Hero 区徽章药丸）。
- 全部为纯 CSS/静态标记，无新依赖；动效继续尊重 prefers-reduced-motion；后台页（body.admin-page）通过选择器排除，样式零影响。

### Testing
- 浏览器实测落地页：徽章文案正确、卡片 backdrop-filter 生效（blur(14px) saturate(1.35)）、白色发丝边框、标题渐变填充生效（text-fill transparent）、极光光晕激活（::before content 已设置）、头像光环 conic-gradient 生效、Join 渐变生效；截图确认整体布局无错位。
- 后台页回归：::before 光晕为 none、标题字体保持 Inter，确认新样式未泄漏到后台。
- 样式缓存版本升级 styles v6。

### Notes
改动文件清单：
- `styles.css`：极光光晕、玻璃拟态卡片/FAQ/顶栏、头像光环、金色渐变标题（限 .profile h1）、香槟金 Join 按钮与扫光、hero 徽章样式。
- `index.html`：新增 hero 徽章标记，样式缓存版本升到 v6。

回滚方式：用迁移压缩包内同名文件覆盖 styles.css 与 index.html，或删除本轮新增的 CSS 规则（orbA/orbB/spin 关键帧、glass 变量、.hero-badge、.avatar::before、.profile h1 渐变、join-button 渐变）与 index.html 中的 hero-badge 一行。

## 2026-09-05 - Task: Hero 区背景图配置 + 移动端背景层 iOS 安全化

### What was done
- 新增 Hero 区（头像/标题/介绍板块）独立背景图配置：后台（本地 admin.html 与线上隐藏后台、functions/ Pages 变体已同步）新增 "Hero section background image URL" 字段，前端渲染为带白色柔光遮罩的圆角 Hero 卡片，与玻璃卡片风格统一；与整页背景图可同时使用（整页在底层、Hero 卡在上层）。
- 移动端优化（页面定位为移动端优先）：整页背景图从 background-attachment:fixed（iOS Safari 会忽略/抖动）改为 position:fixed 独立图层实现（body::before 图层 + body::after 遮罩层，CSS 变量 --page-bg 传图），iPhone 上背景稳定不抖动。
- 配置结构与文档同步：config.json appearance 增加 heroImage 字段，docs/CONFIG.md 更新。

### Testing
- npm run check + admin.js 语法检查 + worker 内嵌后台脚本模拟运行全部通过。
- 手机视口（390×844）实测：hero-styled 生效且 Hero 背景图渲染正确、整页背景固定层生效（--page-bg）、玻璃卡片/动效正常、文字在遮罩上清晰可读；截图确认布局无错位。
- 清理验证：配置恢复空值后 Hero 卡与背景层自动消失、极光光晕自动恢复，测试图 test-bg.svg 已删除。

### Notes
改动文件清单：
- `app.js`：applyAppearance 支持双层图（整页 --page-bg + Hero 卡内联背景），缓存版本 v8。
- `styles.css`：body.has-bg 改为 fixed 图层实现（iOS 安全），新增 .profile.hero-styled 样式，缓存版本 v7。
- `index.html`：缓存版本号升级。
- `admin.html` / `admin.js`：外观区新增 Hero 背景图字段与读写。
- `worker.js`：隐藏后台 Appearance 卡新增 heroImage 字段（渲染/回填/保存）。
- `functions/manage-dpv-7f3a9c2e.js`：由 worker.js 模板程序化重新同步。
- `config.json` / `docs/CONFIG.md`：appearance.heroImage 字段与文档更新。

回滚方式：用迁移压缩包或本轮之前版本覆盖上述文件；单点回滚可删除 config.json 中 appearance.heroImage、admin/worker 中 hero-bg/heroImage 字段、styles.css 中 body.has-bg::before/::after 与 .profile.hero-styled 规则、app.js applyAppearance 中 heroImage 分支。

## 2026-09-05 - Task: 部署前安全加固（内部文件禁止线上访问）

### What was done
- Worker 资源禁止访问清单新增 /progress.md、/docs/、/package-lock.json，避免内部运维日志（含隐藏后台路径）与依赖锁定文件被线上公开访问。functions/ Pages 变体不承载这些路径，无需同步。

### Testing
- 待随本次部署一起线上验证（curl 返回 404）。

### Notes
改动文件清单：
- `worker.js`：资产 404 拦截清单追加三项。

回滚方式：worker.js 中移除新增的三个拦截项即可。
