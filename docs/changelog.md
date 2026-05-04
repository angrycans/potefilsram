# 变更记录

## 2026-04-30

### 认证模块：Credentials 登录注册切换到 Upstash Redis

本次完成 `sign-up` / `sign-in` 的基础闭环，将 Credentials 登录注册链路明确为：

- **用户存储**：使用 Upstash Redis。
- **认证框架**：使用 NextAuth v5。
- **密码处理**：使用 `bcrypt-ts` 进行密码哈希与校验。
- **注册流程**：注册时创建 Redis 用户记录，并在创建成功后自动建立登录态。
- **登录流程**：登录时根据邮箱从 Redis 查询用户，再通过 `bcrypt.compare` 校验密码。
- **路由保护**：通过根目录 `middleware.ts` 保护 `/dashboard` 路由，未登录用户重定向到 `/sign-in`。

相关文件：

- `src/lib/redis.ts`
- `src/lib/user-store.ts`
- `src/auth.ts`
- `src/app/lib/auth.actions.ts`
- `src/app/(auth)/sign-up/page.tsx`
- `src/app/(auth)/sign-in/page.tsx`
- `middleware.ts`

Redis 用户数据 key 约定：

- `user:{id}`：存储完整用户对象。
- `user:email:{normalizedEmail}`：邮箱到用户 ID 的索引。

后续认证相关改动应继续沿用该上下文：

> 当前项目 Credentials 登录注册使用 Upstash Redis + NextAuth v5 + bcrypt-ts。
