# CRM backend (Express + Postgres). Single-stage build: installs full
# dependencies (including devDependencies — tsc/typescript are needed to
# build), compiles src/ -> dist/, then runs the compiled output. src/ is
# kept in the final image (not just dist/) because node-pg-migrate's
# migrations are plain .sql files the TypeScript compiler never copies into
# dist/ — they're only needed if you run migrations from inside the
# container (fly ssh console), not for serving requests.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build

ENV NODE_ENV=production

EXPOSE 4001

CMD ["node", "dist/index.js"]
