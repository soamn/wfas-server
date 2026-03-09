FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN apk add --no-cache libc6-compat openssl ca-certificates curl
RUN pnpm install

COPY . .
RUN DATABASE_URL="postgresql://noop:noop@localhost:5432/noop" pnpm prisma generate

RUN pnpm build

EXPOSE 8000

CMD ["node", "dist/server.js"]