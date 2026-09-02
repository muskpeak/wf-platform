FROM node:20-alpine AS base

# ==========================================
# 阶段 1: 修剪依赖 (Prune)
# ==========================================
FROM base AS builder
# 安装 libc6-compat (Alpine Linux 兼容性，turbo 需要)
RUN apk update && apk add --no-cache libc6-compat

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN npm install -g turbo

COPY . .
# 使用 turbo 将 web 的依赖子集修剪出来，提取到 /app/out
RUN turbo prune web --docker

# ==========================================
# 阶段 2: 安装依赖 (Installer)
# ==========================================
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

# 首先只复制 package.json 和 lockfile 进行依赖安装，利用 Docker 缓存层
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

# ==========================================
# 阶段 3: 编译构建 (Build)
# ==========================================
# 复制完整源码并编译
COPY --from=builder /app/out/full/ .
COPY locales ./locales
COPY turbo.json turbo.json

# 构建 web，禁用遥测
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=web...

# ==========================================
# 阶段 4: 生产运行 (Runner)
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户保持安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# 从 installer 复制 public 文件夹和 standalone 构建产物
COPY --from=installer /app/apps/web/public ./apps/web/public

# 自动挂载由 standalone 模式生成的追踪文件
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动 Server
CMD ["node", "apps/web/server.js"]
