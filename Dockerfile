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
COPY scripts/install-docker-dependencies.mjs ./scripts/install-docker-dependencies.mjs
RUN node scripts/install-docker-dependencies.mjs \
    && rm -rf /tmp/npm-cache /root/.npm

# Validate the shipped prebuilt dist and deduplicate an identical ONNX Linux binary
# when that package layout is present.
COPY dist ./dist
COPY migrations ./migrations
COPY scripts ./scripts
# R100: only the desktop overlays are needed to regenerate hot-update UI manifests during image build.
COPY apps/store-desktop/desktop-overlay.js ./apps/store-desktop/desktop-overlay.js
COPY apps/lab-desktop/desktop-overlay.js ./apps/lab-desktop/desktop-overlay.js
# Trim unused operating-system ONNX binaries before the runtime stage copies node_modules.
RUN node scripts/prune-onnx-platforms.mjs
# Vendor the tiny pure-JS QR decoder locally so mobile scanning does not depend on BarcodeDetector or an external CDN.
RUN cp node_modules/jsqr/dist/jsQR.js dist/web/vendor-jsqr-1.4.0.js
RUN node scripts/liara-fast-build.mjs \
    && rm -rf /tmp/npm-cache /root/.npm /tmp/*

FROM docker-mirror.liara.ir/node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
# R100: take the validated/generated dist from the dependency stage. This includes
# fresh Store/Lab desktop hot-update manifests without shipping their duplicate source copies.
COPY --from=deps /app/dist ./dist
COPY migrations ./migrations
COPY scripts/migrate.mjs ./scripts/migrate.mjs
COPY scripts/ensure-sofia-demo.sql ./scripts/ensure-sofia-demo.sql
# The API has a safe development-public fallback for a few static resources.
COPY apps/web/public ./apps/web/public

EXPOSE 3000
STOPSIGNAL SIGTERM

# Run migrations once, then replace the shell with the API process so signals reach Node.
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node --expose-gc dist/api/server.js"]
