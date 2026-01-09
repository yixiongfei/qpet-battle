# 认证系统重构 - 移除 OAuth，改为数据库登录

## 修改日期
2026-01-09

## 修改概述
将项目中的 OAuth 登录功能全部改为数据库登录（用户名+密码），删除了所有 OAuth 相关代码，保持代码简洁。

## 主要修改

### 后端修改

#### 1. 删除的文件
- `server/_core/oauth.ts` - OAuth 路由处理
- `server/_core/sdk.ts` - OAuth SDK 和会话管理
- `server/_core/cookies.ts` - OAuth cookie 工具
- `server/_core/types/manusTypes.ts` - OAuth 类型定义
- `server/auth.logout.test.ts` - OAuth 登出测试

#### 2. 修改的文件

**server/_core/context.ts**
- 移除 OAuth SDK 依赖
- 改用 `simple_auth_session` cookie 进行认证
- 直接从数据库获取用户信息

**server/_core/index.ts**
- 移除 `registerOAuthRoutes()` 调用
- 简化服务器启动流程

**server/_core/env.ts**
- 移除 OAuth 相关环境变量（`appId`, `oAuthServerUrl`, `cookieSecret`, `ownerOpenId`）
- 保留必要的环境变量（`databaseUrl`, `forgeApiUrl`, `forgeApiKey`）

**server/routers.ts**
- 移除 `getSessionCookieOptions` 导入
- 简化 logout 逻辑，直接清除 `simple_auth_session` cookie

**server/db.ts**
- 移除 OAuth 兼容函数（`getUserByOpenId`, `upsertUser`）
- 保留核心数据库登录函数（`createUser`, `authenticateUser`, `getUserById`, `getUserByUsername`）

**server/simpleAuthRouter.ts**
- 更新注释，明确这是唯一的认证方式
- 保持现有的注册、登录、登出、获取当前用户功能

**shared/const.ts**
- 移除未使用的常量（`COOKIE_NAME`, `ONE_YEAR_MS`）
- 保留必要的常量（`AXIOS_TIMEOUT_MS`, `UNAUTHED_ERR_MSG`, `NOT_ADMIN_ERR_MSG`）

### 前端修改

#### 1. 删除的文件
- `client/src/components/ManusDialog.tsx` - OAuth 登录对话框（未使用）

#### 2. 修改的文件

**client/src/const.ts**
- 移除 `getLoginUrl()` 函数
- 清空文件，仅保留注释

**client/src/main.tsx**
- 移除 `getLoginUrl` 导入
- 将未授权重定向改为 `/login`

**client/src/pages/Login.tsx**
- 移除 "Manus OAuth 登录" 链接
- 仅保留用户名+密码登录表单

**client/src/pages/Home.tsx**
- 移除 `getLoginUrl` 导入
- 移除 "Manus OAuth 登录" 按钮
- 仅保留 "登录开始游戏" 和 "注册新账号" 按钮

**client/src/components/DashboardLayout.tsx**
- 移除 `getLoginUrl` 导入
- 将 Sign in 按钮重定向改为 `/login`

**client/src/_core/hooks/useAuth.ts**
- 移除 `getLoginUrl` 导入
- 将默认重定向路径改为 `/login`

### 数据库

数据库 schema 已经在之前的迁移（0006_condemned_arclight.sql）中完成了修改：
- 移除了 `openId`, `email`, `loginMethod` 字段
- 添加了 `username` 和 `password` 字段
- 添加了 `username` 的唯一索引

## 认证流程

### 新的认证流程
1. 用户通过 `/register` 页面注册账号（用户名+密码）
2. 用户通过 `/login` 页面登录
3. 登录成功后，服务器设置 `simple_auth_session` cookie
4. 后续请求通过 cookie 验证用户身份
5. 用户可以通过 logout 清除 cookie

### Cookie 配置
- Cookie 名称: `simple_auth_session`
- Cookie 内容: `{ userId, username }`
- Cookie 属性: `httpOnly`, `sameSite: 'lax'`, `maxAge: 30天`

## 测试结果
- ✅ 项目构建成功
- ✅ 无 TypeScript 编译错误
- ✅ 所有 OAuth 相关代码已移除
- ✅ 数据库登录功能保持完整

## 注意事项
1. 现有的 OAuth 用户将无法登录，需要重新注册账号
2. 如需迁移现有用户，需要手动处理数据库迁移
3. 密码使用 SHA-256 哈希存储（建议后续升级为 bcrypt）
4. 会话有效期为 30 天

## 后续优化建议
1. 将密码哈希算法从 SHA-256 升级为 bcrypt 或 argon2
2. 添加密码强度验证
3. 添加登录失败次数限制
4. 添加密码重置功能
5. 考虑添加邮箱验证功能
