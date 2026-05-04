# 项目架构与功能梳理

## 1. 项目概览

本项目是一个基于 **Next.js App Router** 的 Web 应用，当前项目名称在 `package.json` 中为 `otefilsram`，站点配置中展示为 `Mars Life Starter`。

项目主要包含以下能力：

- **首页门户**：提供 Landing Page 展示入口。
- **用户认证**：支持邮箱密码注册/登录，以及 Google OAuth 登录。
- **受保护后台**：提供 Dashboard 布局、侧边栏导航、主题切换、用户菜单等。
- **内容系统**：通过 Contentlayer 读取本地 MDX 内容，支持 Blog、Docs、Guide、Page 等内容类型。
- **文件上传**：通过 UploadThing 上传 `.sa` 轨迹文件和图片。
- **轨迹数据分析**：解析 `.sa` 赛道/轨迹数据，展示赛道信息、地图与数据面板。
- **图表页面**：Dashboard 下预留 charts 页面。
- **全局状态管理**：使用 React Context + `use-immer` 维护全局 UI 和轨迹状态。

## 2. 技术栈

| 类型 | 技术/库 | 用途 |
| --- | --- | --- |
| Web 框架 | Next.js `^16.2.1` | App Router、SSR/RSC、API Route |
| 前端框架 | React `^19.2.4` | UI 组件与客户端交互 |
| 语言 | TypeScript `^5` | 静态类型 |
| 样式 | Tailwind CSS `^3.4.1` | 原子化样式 |
| UI 基础组件 | Radix UI、shadcn-ui、lucide-react、Heroicons | 组件、图标、交互控件 |
| 认证 | NextAuth `5.0.0-beta.30` | Credentials 与 Google 登录 |
| 密码加密 | bcrypt-ts | 注册/登录密码哈希与校验 |
| 数据存储 | Upstash Redis | 用户数据存储 |
| 内容系统 | contentlayer2、next-contentlayer2 | 本地 MDX 编译与查询 |
| 文件上传 | uploadthing、@uploadthing/react | `.sa` 文件与图片上传 |
| 地理/轨迹 | mapbox-gl、@turf/turf | 地图渲染与地理计算 |
| 图表 | echarts、echarts-for-react、recharts | 数据可视化 |
| 表单 | react-hook-form、zod、@hookform/resolvers | 表单校验与类型约束 |
| 布局 | react-resizable-panels | 可拖拽分栏布局 |
| 状态 | React Context、use-immer | 全局状态更新 |

## 3. 项目目录结构

```text
.
├── docs/                         # 项目文档与静态资料
├── public/                       # Next.js public 静态资源
├── src/
│   ├── app/                      # Next.js App Router 主目录
│   │   ├── (auth)/               # 登录、注册路由组
│   │   ├── (home)/               # 首页、博客、公开页面路由组
│   │   ├── (protected)/          # 受保护后台路由组
│   │   ├── api/                  # API Routes
│   │   ├── auth/                 # 额外认证页面入口
│   │   ├── lib/                  # App 层 server actions
│   │   ├── layout.tsx            # 根布局
│   │   ├── globals.css           # 全局样式
│   │   └── store.tsx             # 全局状态 Provider
│   ├── components/               # UI 与业务组件
│   │   ├── content/              # Blog/MDX 内容组件
│   │   ├── dashboard/            # Dashboard 头部等组件
│   │   ├── docs/                 # 文档搜索、侧边栏
│   │   ├── file-upload/          # 文件上传组件
│   │   ├── layout/               # 导航栏、侧边栏、页脚、主题切换
│   │   ├── modals/               # 弹窗 Provider 与登录弹窗
│   │   ├── sections/             # 首页区块
│   │   ├── shared/               # 通用组件
│   │   ├── tracks/               # 轨迹解析、地图、信息展示
│   │   └── ui/                   # shadcn 风格基础组件
│   ├── config/                   # 站点、首页、博客、文档、后台导航配置
│   ├── lib/                      # 通用工具、Redis、Session、用户存储等
│   ├── mdx-content/              # Contentlayer 读取的 MDX 内容源
│   ├── auth.ts                   # NextAuth 主配置
│   ├── auth.config.ts            # Auth 相关配置
│   └── env.mjs                   # 环境变量校验
├── contentlayer.config.ts        # Contentlayer 配置
├── next.config.mjs               # Next.js 配置
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
├── eslint.config.mjs             # ESLint 配置
├── components.json               # shadcn-ui 配置
├── package.json                  # 脚本与依赖
└── docker-compose.yml            # 本地服务编排配置
```

## 4. 路由与页面功能

### 4.1 根布局

文件：`src/app/layout.tsx`

根布局负责挂载全局 Provider：

- **StoreProvider**：全局状态。
- **SessionProvider**：NextAuth 客户端会话。
- **ThemeProvider**：暗色/亮色主题。
- **ModalProvider**：全局弹窗。
- **Toaster**：全局 Toast。

### 4.2 公开路由

| 路由 | 文件 | 功能 |
| --- | --- | --- |
| `/` | `src/app/(home)/page.tsx` | 首页 Landing Page，渲染 `HeroLanding` |
| `/blog` | `src/app/(home)/blog/page.tsx` | 博客列表，从 Contentlayer 的 `allPosts` 读取已发布文章 |
| `/blog/category/...` | `src/app/(home)/blog/category/` | 博客分类相关页面 |
| `/blog/...` | `src/app/(home)/(blog-post)/blog/` | 博客详情页路由组 |
| `/auth/sign-in` | `src/app/auth/sign-in/page.tsx` | 登录入口之一 |
| `/sign-in` | `src/app/(auth)/sign-in/page.tsx` | 登录页面 |
| `/sign-up` | `src/app/(auth)/sign-up/page.tsx` | 注册页面 |

### 4.3 受保护后台路由

受保护路由统一位于 `src/app/(protected)`，布局文件为 `src/app/(protected)/layout.tsx`。

该布局提供：

- Dashboard 侧边栏。
- 移动端抽屉侧边栏。
- 顶部栏。
- 主题切换。
- 用户账户菜单。
- 内容区最大宽度容器。

| 路由 | 文件 | 功能 |
| --- | --- | --- |
| `/dashboard` | `src/app/(protected)/dashboard/page.tsx` | Dashboard 首页，包含轨迹数据区和文件上传入口 |
| `/dashboard/charts` | `src/app/(protected)/dashboard/charts/page.tsx` | 图表页面 |
| `/dashboard/track` | `src/app/(protected)/dashboard/track/page.tsx` | 轨迹分析页面，包含信息面板、地图与数据面板 |
| `/dashboard/test` | `src/app/(protected)/dashboard/test/page.tsx` | 测试页面 |

后台侧边栏配置来自 `src/config/dashboard.ts`，当前包含：

- Admin Panel
- Dashboard
- Billing
- Charts
- track
- Orders
- User Posts
- Settings
- Homepage
- Documentation
- Support

部分菜单带有 `authorizeOnly` 或 `disabled` 字段，但当前布局中仅做原样映射，未在布局层实际过滤权限。

### 4.4 API Routes

| API | 文件 | 功能 |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/` | NextAuth API handler |
| `/api/uploadthing` | `src/app/api/uploadthing/route.ts` | UploadThing 上传接口 |
| `/api/uploadthing/[slug]` | `src/app/api/uploadthing/[slug]/` | UploadThing/上传相关动态接口 |
| `/api/test` | `src/app/api/test/route.ts` | 测试 API |
| `/api/test/[slug]` | `src/app/api/test/[slug]/` | 测试动态 API |

## 5. 功能模块清单

### 5.1 首页模块

核心文件：

- `src/app/(home)/page.tsx`
- `src/components/sections/hero-landing.tsx`
- `src/config/home.ts`

功能：

- 展示首页 Hero 区块。
- 可结合站点配置展示产品/项目介绍。
- 首页服务端会读取当前用户，但当前页面未直接使用该用户数据进行展示分支。

### 5.2 认证模块

核心文件：

- `src/auth.ts`
- `src/app/lib/auth.actions.ts`
- `src/lib/user-store.ts`
- `src/lib/session.ts`
- `src/app/api/auth/[...nextauth]/`

支持的登录方式：

- **Credentials**：邮箱 + 密码。
- **Google OAuth**：Google 账号登录。

认证流程：

1. 用户注册时，`signUpWithCredentials` 使用 `bcrypt-ts` 对密码加盐哈希。
2. 用户数据写入 Upstash Redis。
3. 用户登录时，通过邮箱读取 Redis 中的用户。
4. 使用 `bcrypt.compare` 校验密码。
5. 校验成功后调用 NextAuth `signIn("credentials")`。
6. NextAuth 使用 JWT session strategy。
7. Google 登录成功后，通过 `upsertOAuthUser` 创建或更新 Redis 用户。
8. JWT 与 session callback 中写入用户角色，默认角色为 `USER`。

用户数据结构：

```text
StoredUser
├── id
├── email
├── passwordHash
├── name
├── image
├── role
├── emailVerified
├── createdAt
└── updatedAt
```

Redis key 设计：

- `user:{id}`：存储完整用户对象。
- `user:email:{email}`：根据邮箱索引用户 ID。

### 5.3 Dashboard 模块

核心文件：

- `src/app/(protected)/layout.tsx`
- `src/app/(protected)/dashboard/page.tsx`
- `src/components/layout/dashboard-sidebar.tsx`
- `src/components/dashboard/header.tsx`
- `src/config/dashboard.ts`

功能：

- 提供后台整体布局。
- 通过配置生成侧边栏导航。
- 支持桌面侧边栏和移动端 Sheet 侧边栏。
- Dashboard 首页展示一个示例卡片区与 `.sa` 文件上传入口。

### 5.4 文件上传模块

核心文件：

- `src/app/api/uploadthing/core.ts`
- `src/app/api/uploadthing/route.ts`
- `src/components/file-upload/file-uploader.tsx`
- `src/components/file-upload/file-upload.tsx`
- `src/app/lib/uploadfile.action.ts`

当前定义了两个 UploadThing FileRoute：

| Route | 类型 | 限制 | 权限 |
| --- | --- | --- | --- |
| `saUploader` | `blob` | 最大 8MB，最多 1 个文件，文件名必须以 `.sa` 结尾 | 必须登录 |
| `imageUploader` | `image` | 最大 4MB | 必须登录 |

`.sa` 文件上传中间件逻辑：

1. 检查文件扩展名是否为 `.sa`。
2. 调用 `getCurrentUser()` 判断用户是否登录。
3. 未登录时抛出 `UploadThingError("Unauthorized")`。
4. 上传完成后输出日志。

### 5.5 轨迹数据模块

核心文件：

- `src/app/(protected)/dashboard/track/page.tsx`
- `src/components/tracks/hooks.ts`
- `src/components/tracks/track_info.tsx`
- `src/components/tracks/track_map.tsx`
- `src/components/tracks/track_value.tsx`
- `src/components/tracks/utils.ts`
- `src/lib/gpsutils.ts`

页面布局：

- 使用 `react-resizable-panels` 实现可拖拽分栏。
- 左侧：`TrackInfo`，展示轨迹/赛道元信息。
- 右侧上方：`TrackMap`，展示地图和轨迹。
- 右侧下方：`TrackValue`，展示轨迹数据值。

数据获取：

- `useGetTrackData()` 会请求 `/api/uploadthing/1`。
- 接口返回成功后调用 `parseData()` 解析内容。
- 解析后的结果写入全局状态 `state.app.sa.trackInfo`。

轨迹解析能力：

- `parseMeta(content)`：解析文件头部元数据。
- `parsetrackplanData(content)`：解析 `<trackplan>` 中的赛道分段信息。
- `parseData(content)`：解析完整 `.sa`/轨迹内容。

支持解析的数据：

- 文件版本。
- 开始时间。
- 用户 ID。
- 用户名。
- 载具名称。
- 硬件版本。
- 固件版本。
- 赛道名称。
- 轨迹点 `<trace>`。
- 赛道计划 `<trackplan>`。
- 计时数据 `<timer>`。
- 圈速、分段时间、最大速度、平均速度、左右倾角、加速/刹车 G 值等。

### 5.6 内容系统模块

核心文件：

- `contentlayer.config.ts`
- `src/mdx-content/`
- `src/components/content/`
- `src/components/docs/`
- `src/lib/toc.ts`

Contentlayer 内容目录：

```text
src/mdx-content/
```

定义的文档类型：

| 类型 | 文件匹配 | 用途 |
| --- | --- | --- |
| `Doc` | `docs/**/*.mdx` | 文档内容 |
| `Guide` | `guides/**/*.mdx` | 指南内容 |
| `Post` | `blog/**/*.mdx` | 博客文章 |
| `Page` | `pages/**/*.mdx` | 普通页面 |

通用 computed fields：

- `slug`：根据文件路径生成访问 slug。
- `slugAsParams`：生成动态路由参数。
- `images`：从 MDX 中提取 `<Image src="..." />` 图片地址。

MDX 插件：

- `remark-gfm`：支持 GFM Markdown。
- `rehype-slug`：标题生成锚点 ID。
- `rehype-pretty-code`：代码高亮。
- `rehype-autolink-headings`：标题自动链接。
- 自定义 `visit` 逻辑：为代码块保留原始字符串，便于复制代码。

### 5.7 全局状态模块

核心文件：`src/app/store.tsx`

状态结构：

```text
StateType
├── count
└── app
    ├── DashboardSidebar
    │   └── isSidebarExpanded
    └── sa
        ├── Header
        └── trackInfo
```

实现方式：

- 使用 React Context 创建 `StateContext`。
- 使用 `useImmer` 更新嵌套状态。
- 通过 `useStore()` hook 读取和更新状态。
- 根布局中通过 `StoreProvider` 包裹整个应用。

### 5.8 UI 与主题模块

核心文件：

- `src/app/globals.css`
- `tailwind.config.ts`
- `components.json`
- `src/components/ui/`
- `src/components/layout/mode-toggle.tsx`

能力：

- Tailwind 使用 class 模式暗色主题：`darkMode: ["class"]`。
- 主题颜色基于 CSS 变量，例如 `--background`、`--foreground`、`--primary` 等。
- `next-themes` 负责主题切换。
- `tailwindcss-animate` 提供动画扩展。
- `withUt(config)` 集成 UploadThing Tailwind 配置。

## 6. 项目配置说明

### 6.1 package.json

常用脚本：

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` / `npm run dev` | 启动 Next.js 开发服务，使用 webpack |
| `pnpm build` / `npm run build` | 构建生产版本，使用 webpack |
| `pnpm start` / `npm run start` | 启动生产服务 |
| `pnpm lint` / `npm run lint` | 执行 ESLint |

当前脚本：

```json
{
  "dev": "next dev --webpack",
  "build": "next build --webpack",
  "start": "next start",
  "lint": "eslint ."
}
```

### 6.2 Next.js 配置

文件：`next.config.mjs`

关键配置：

- 使用 `withContentlayer(nextConfig)` 集成 Contentlayer。
- `reactStrictMode: true`。
- `pageExtensions: ["tsx", "mdx", "ts", "js"]`。
- 允许开发来源：`127.0.0.1`。
- Next Image 允许远程图片域名：
  - `avatars.githubusercontent.com`
  - `lh3.googleusercontent.com`
  - `uploadthing.com`

### 6.3 TypeScript 配置

文件：`tsconfig.json`

关键配置：

- `strict: true`。
- `moduleResolution: "bundler"`。
- `jsx: "react-jsx"`。
- `target: "ES2021"`。
- 路径别名：
  - `@/*` 指向 `./src/*`
  - `contentlayer/generated` 指向 `./.contentlayer/generated`
- 包含 `.contentlayer/generated` 与 Next 类型目录。

### 6.4 Tailwind 配置

文件：`tailwind.config.ts`

关键配置：

- 扫描路径：`pages`、`components`、`app`、`src` 下的 `ts/tsx` 文件。
- 容器居中，默认 padding `2rem`，`2xl` 宽度为 `1400px`。
- 扩展主题颜色与 shadcn 风格 CSS 变量对齐。
- 扩展 accordion 动画。
- 使用 `tailwindcss-animate`。
- 通过 `withUt` 集成 UploadThing。

### 6.5 环境变量配置

文件：`src/env.mjs`

使用 `@t3-oss/env-nextjs` 和 `zod` 做环境变量校验。

服务端变量：

| 变量 | 必填 | 用途 |
| --- | --- | --- |
| `NEXTAUTH_URL` | 否 | NextAuth URL，开发环境可选 |
| `AUTH_SECRET` | 是 | NextAuth secret |
| `UPSTASH_REDIS_REST_URL` | 是 | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | 是 | Upstash Redis REST Token |
| `GOOGLE_ID` | 是 | Google OAuth Client ID |
| `GOOGLE_SECRET` | 是 | Google OAuth Client Secret |
| `RESEND_API_KEY` | 是 | Resend 邮件 API Key，当前代码中主要为预留 |
| `EMAIL_FROM` | 是 | 邮件发件人，当前代码中主要为预留 |

客户端变量：

| 变量 | 必填 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | 是 | 站点公开 URL |

### 6.6 Contentlayer 配置

文件：`contentlayer.config.ts`

关键配置：

- 内容目录：`./src/mdx-content`
- 输出：通过 `.contentlayer/generated` 供代码引用。
- 文档类型：`Page`、`Doc`、`Guide`、`Post`。
- 集成 Markdown/MDX 插件，支持 GFM、标题锚点、代码高亮、自动链接。

### 6.7 shadcn-ui 配置

文件：`components.json`

用于管理 shadcn-ui 组件生成规则和路径别名。当前基础组件集中在：

```text
src/components/ui/
```

### 6.8 Docker 与本地数据库提示

`README.md` 中保留了 MongoDB 与 Prisma 的开发提示，但从当前代码实际使用情况看，用户数据目前存储在 **Upstash Redis**，并未看到 Prisma 作为当前主链路被使用。

README 中提到的本地 MongoDB 命令：

```bash
docker run --name mongodb-marslife -p 27017:27017 -d mongo --replSet=rs0
```

需要注意：该部分更像早期或预留开发说明，实际认证用户存储以 `src/lib/user-store.ts` + `src/lib/redis.ts` 为准。

## 7. 核心数据流

### 7.1 登录注册数据流

```text
注册页面
  ↓
signUpWithCredentials
  ↓
bcrypt 生成 passwordHash
  ↓
createUser
  ↓
Upstash Redis
```

```text
登录页面
  ↓
signInWithCredentials
  ↓
getUserByEmail
  ↓
bcrypt.compare
  ↓
NextAuth signIn("credentials")
  ↓
JWT Session
```

```text
Google OAuth 登录
  ↓
NextAuth GoogleProvider
  ↓
signIn callback
  ↓
upsertOAuthUser
  ↓
Upstash Redis
  ↓
JWT / Session callback 注入 role
```

### 7.2 `.sa` 文件上传与轨迹展示数据流

```text
Dashboard 上传组件
  ↓
UploadThing saUploader
  ↓
校验 .sa 后缀
  ↓
校验当前用户登录状态
  ↓
上传完成
  ↓
轨迹页面请求 /api/uploadthing/1
  ↓
parseData 解析文件内容
  ↓
写入全局状态 state.app.sa.trackInfo
  ↓
TrackInfo / TrackMap / TrackValue 消费展示
```

### 7.3 Blog 内容数据流

```text
src/mdx-content/blog/**/*.mdx
  ↓
Contentlayer 编译
  ↓
contentlayer/generated 导出 allPosts
  ↓
/blog 页面过滤 published=true 并按 date 倒序
  ↓
BlogPosts 组件渲染列表
```

## 8. 重要配置入口索引

| 目标 | 文件 |
| --- | --- |
| 站点名称、URL、社交链接 | `src/config/site.ts` |
| Dashboard 菜单 | `src/config/dashboard.ts` |
| Blog 配置 | `src/config/blog.ts` |
| Docs 配置 | `src/config/docs.ts` |
| 首页配置 | `src/config/home.ts` |
| NextAuth 配置 | `src/auth.ts` |
| 环境变量校验 | `src/env.mjs` |
| Redis 客户端 | `src/lib/redis.ts` |
| 用户存储 | `src/lib/user-store.ts` |
| 全局状态 | `src/app/store.tsx` |
| UploadThing 文件路由 | `src/app/api/uploadthing/core.ts` |
| 轨迹解析 | `src/components/tracks/hooks.ts` |
| Contentlayer | `contentlayer.config.ts` |
| Tailwind | `tailwind.config.ts` |
| Next.js | `next.config.mjs` |
| TypeScript | `tsconfig.json` |

## 9. 当前项目状态与注意事项

- **认证主存储是 Redis**：虽然 README 里有 MongoDB/Prisma 提示，但当前用户数据链路使用 Upstash Redis。
- **权限字段尚未完整落地**：Dashboard 菜单配置中存在 `authorizeOnly`，但当前 `src/app/(protected)/layout.tsx` 没有真正按用户角色过滤。
- **受保护路由需要确认中间件**：当前文档基于 `(protected)` 路由组和 NextAuth 配置说明，是否强制保护所有后台页面还需要结合 middleware 或页面级鉴权实现确认。
- **UploadThing 强依赖登录态**：`.sa` 和图片上传都会调用 `getCurrentUser()`，未登录用户无法上传。
- **轨迹数据接口需要继续明确**：`useGetTrackData()` 请求 `/api/uploadthing/1`，建议后续明确该接口的数据来源、文件 ID 规则与错误处理。
- **MDX 文档目录与项目 docs 目录不同**：Contentlayer 读取的是 `src/mdx-content/docs/**/*.mdx`，而当前这份项目说明文档放在仓库根目录 `docs/`，用于工程文档沉淀。
- **包管理存在多 lock 文件**：项目同时存在 `pnpm-lock.yaml` 和 `yarn.lock`，建议团队统一使用一种包管理器，避免依赖解析差异。

## 10. 后续维护建议

- **补充 README**：将实际启动方式、必要环境变量、Redis/UploadThing/Google OAuth 配置写入 README。
- **完善权限控制**：基于 session 中的 `role` 对后台菜单和页面访问做统一校验。
- **规范 API 返回结构**：统一 `code/data/msg` 返回格式，并补充错误处理。
- **沉淀轨迹文件模型**：明确 `.sa` 文件上传后的存储、索引、读取和历史记录管理方式。
- **增加测试**：优先为 `parseMeta`、`parsetrackplanData`、`parseData` 增加单元测试。
- **统一包管理器**：建议保留 `pnpm-lock.yaml` 或 `yarn.lock` 之一。
- **清理历史配置**：如果 MongoDB/Prisma 不再使用，可将 README 中相关内容标记为历史说明或移除。
