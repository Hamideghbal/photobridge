# PhotoBridge v800 - Liara Docker deployment
# Bypasses Liara's Node platform build triggers and runs the already-built dist.

FROM docker-mirror.liara.ir/node:22-bookworm-slim AS deps

WORKDIR /app
ENV NODE_ENV=production \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_CACHE=/tmp/npm-cache

# Keep dependency installation in its own cacheable layer.
COPY package.json .npmrc ./
COPY scripts/install-docker-dependencies.mjs scripts/prune-onnx-platforms.mjs scripts/deduplicate-onnx-runtime.mjs ./scripts/
RUN node scripts/install-docker-dependencies.mjs \
    && node scripts/prune-onnx-platforms.mjs \
    && rm -rf /tmp/npm-cache /root/.npm scripts package-lock.json .npmrc

# Application changes reuse the fully prepared dependency image.
FROM deps AS app-build

# Explicit application revision barrier:
# changing DEPLOY_REVISION.txt invalidates all following application-source layers
# without forcing the expensive dependency-install layer above to rerun.
COPY DEPLOY_REVISION.txt ./DEPLOY_REVISION.txt

# Validate the shipped prebuilt dist and deduplicate an identical ONNX Linux binary
# when that package layout is present.
COPY dist ./dist
COPY migrations ./migrations
COPY scripts ./scripts
# R100: only the desktop overlays are needed to regenerate hot-update UI manifests during image build.
COPY apps/store-desktop/desktop-overlay.js ./apps/store-desktop/desktop-overlay.js
COPY apps/lab-desktop/desktop-overlay.js ./apps/lab-desktop/desktop-overlay.js
RUN echo "[PhotoBridge Docker] deploy revision: $(cat DEPLOY_REVISION.txt)" \
    && node scripts/liara-fast-build.mjs \
    && rm -rf /tmp/npm-cache /root/.npm /tmp/*

# Reuse the dependency layers directly; never recopy node_modules per revision.
FROM deps AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json ./package.json
COPY --from=app-build /app/DEPLOY_REVISION.txt ./DEPLOY_REVISION.txt
# R100: take the validated/generated dist from the application stage. This includes
# fresh Store/Lab desktop hot-update manifests without shipping their duplicate source copies.
COPY --from=app-build /app/dist ./dist
COPY migrations ./migrations
COPY scripts/migrate.mjs ./scripts/migrate.mjs
COPY scripts/ensure-sofia-demo.sql ./scripts/ensure-sofia-demo.sql
# The API has a safe development-public fallback for a few static resources.
COPY apps/web/public ./apps/web/public

EXPOSE 3000
STOPSIGNAL SIGTERM

# Run migrations once, then replace the shell with the API process so signals reach Node.
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node --expose-gc dist/api/server.js"]
