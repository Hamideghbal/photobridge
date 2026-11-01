import { createRequire } from "node:module";
const { patchOfflineServer } = createRequire(import.meta.url)(
  "./r1468-server-patch.cjs",
);
import fs from "node:fs";
const file = "dist/web/assets/index-UIRefine-v655-r84.js";
let source = fs.readFileSync(file, "utf8");
source = source.replace(
  'const V=t=>Number(t||0).toLocaleString("fa-IR")',
  'const V=t=>typeof t==="string"&&/^(?:OFF-|PB-)/.test(t)?t:Number(t||0).toLocaleString("fa-IR")',
);
fs.writeFileSync(file, source);
const index = "dist/web/index.html";
let html = fs.readFileSync(index, "utf8");
html = html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g, (url) =>
  url.includes("&offlinePolicy=r1468") ? url : url + "&offlinePolicy=r1468",
);
fs.writeFileSync(index, html);

const server = "dist/api/server.js";
fs.writeFileSync(server, patchOfflineServer(fs.readFileSync(server, "utf8")));
