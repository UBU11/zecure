FROM oven/bun:1.1 AS builder

WORKDIR /usr/src/app

COPY package.json bun.lock pnpm-lock.yaml ./

RUN bun install 

COPY . .

FROM oven/bun:1.1 AS release

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/cert ./cert

RUN mkdir -p src/data && chown -R bun:bun /usr/src/app

USER bun

EXPOSE 3000

CMD ["bun", "src/index.ts"]
