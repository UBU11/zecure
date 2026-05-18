FROM node:20-slim AS builder

WORKDIR /usr/src/app


RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:20-slim AS release

ENV NODE_ENV=production
WORKDIR /usr/src/app


RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app

COPY --from=builder --chown=node:node /usr/src/app/package.json ./
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/.mastra ./.mastra

USER node

EXPOSE 3005

CMD ["pnpm", "start"]
