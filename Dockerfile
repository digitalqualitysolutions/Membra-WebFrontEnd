FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .

# `next build` statically generates the landing, login and signup pages, and
# they import `src/config/env.ts` transitively. That module throws at import
# time if `API_BASE_URL` isn't a syntactically valid URL, so the build needs
# *something* here even though no request is ever sent during static
# generation. This placeholder never reaches the runner stage below: each
# `FROM` starts a fresh image/environment, so `ENV API_BASE_URL` set here is
# scoped to the `build` stage only. The real value is supplied as a runtime
# env var on the Scaleway container and is read fresh when `server.js` boots.
ARG API_BASE_URL=https://build-placeholder.invalid/api
ENV API_BASE_URL=${API_BASE_URL}

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# `output: "standalone"` traces its own minimal `node_modules` into
# `.next/standalone` - no `package.json`/`npm ci` needed here, unlike a
# typical Node service image. Static assets and `public/` are deliberately
# left out of `.next/standalone` by Next.js and must be copied in by hand.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER node
EXPOSE 8080
CMD ["node", "server.js"]
