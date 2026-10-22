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

# Inherit cached native dependencies and prepare the application in the final image.
# One allowlisted COPY avoids repeatedly snapshotting dependencies and copying dist
# between stages on Liara's legacy builder.
FROM deps AS runtime
ENV PORT=3000
COPY . ./
RUN echo "[PhotoBridge Docker] deploy revision: $(cat DEPLOY_REVISION.txt)" \
    && echo "[PhotoBridge Docker] START prebuilt payload build" \
    && node --test scripts/test-r1352-liara-build-supervisor.cjs \
    && node scripts/liara-build-supervisor.cjs \
    && echo "[PhotoBridge Docker] OK prebuilt payload build" \
    && echo "[PhotoBridge Docker] START runtime cleanup" \
    && find scripts -type f ! -name migrate.mjs ! -name ensure-sofia-demo.sql -delete \
    && rm -rf apps/store-desktop apps/lab-desktop .npmrc /tmp/npm-cache /root/.npm /tmp/* \
    && echo "[PhotoBridge Docker] OK runtime cleanup"

EXPOSE 3000
STOPSIGNAL SIGTERM

# Preserve the existing startup command; Docker builds never execute migrations.
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node --expose-gc dist/api/server.js"]
