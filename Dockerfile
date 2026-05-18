FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run node-build

FROM node:20-slim AS release

ENV NODE_ENV=production
WORKDIR /usr/src/app


RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/src/app/src/data && chown -R node:node /usr/src/app

COPY --from=builder --chown=node:node /usr/src/app/package.json ./
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/cert ./cert

USER node

EXPOSE 3000

CMD ["npm", "run", "node-start"]
