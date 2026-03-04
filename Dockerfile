FROM oven/bun:1.1

WORKDIR /usr/src/app

COPY package.json bun.lock pnpm-lock.yaml ./

RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
