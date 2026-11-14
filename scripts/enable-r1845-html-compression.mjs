import fs from 'node:fs';
const file='dist/api/server.js';
let js=fs.readFileSync(file,'utf8');
if(!js.includes('const indexGzipCache = new Map();')){
 const changes=[
  [
    "import fs from 'node:fs';\nimport os from 'node:os';\n",
    "import fs from 'node:fs';\nimport zlib from 'node:zlib';\nimport os from 'node:os';\n"
  ],
  [
    "\nasync function serveAdminEquipmentRentalPage(req, res) {\n",
    "\n// R1845: bounded per-path gzip cache; final SEO output stays private/no-store.\nconst indexGzipCache = new Map();\nfunction acceptsHtmlEncoding(req, encoding) {\n    const entries = String(req.headers['accept-encoding'] || '').toLowerCase().split(',').map(part => {\n        const [name, ...params] = part.trim().split(';');\n        const q = params.find(p => p.trim().startsWith('q='));\n        return [name, q ? Number(q.trim().slice(2)) : 1];\n    });\n    const entry = entries.find(([name]) => name === encoding) || entries.find(([name]) => name === '*');\n    return !!entry && entry[1] > 0;\n}\nfunction rentalHtmlPayload(req, full) {\n    for (const [encoding, suffix] of [['br', '.br'], ['gzip', '.gz']]) {\n        if (acceptsHtmlEncoding(req, encoding) && fs.existsSync(full + suffix))\n            return {body: fs.readFileSync(full + suffix), headers: {'vary': 'Accept-Encoding', 'content-encoding': encoding}};\n    }\n    return {body: fs.readFileSync(full), headers: {'vary': 'Accept-Encoding'}};\n}\nasync function serveAdminEquipmentRentalPage(req, res) {\n"
  ],
  [
    "    if (!fs.existsSync(full)) return sendText(res, 503, 'Equipment rental pilot page not found.');\n    const html = fs.readFileSync(full, 'utf8');\n    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': Buffer.byteLength(html), 'cache-control': 'no-store, max-age=0', 'x-robots-tag': 'noindex, nofollow, noarchive' });\n    res.end(html);\n}\n",
    "    if (!fs.existsSync(full)) return sendText(res, 503, 'Equipment rental pilot page not found.');\n    const {body: html, headers: encodingHeaders} = rentalHtmlPayload(req, full);\n    res.writeHead(200, { ...encodingHeaders, 'content-type': 'text/html; charset=utf-8', 'content-length': Buffer.byteLength(html), 'cache-control': 'no-store, max-age=0', 'x-robots-tag': 'noindex, nofollow, noarchive' });\n    res.end(req.method === 'HEAD' ? undefined : html);\n}\n"
  ],
  [
    "\nfunction serveEquipmentRentalPage(res, fileName, robots = 'noindex, nofollow, noarchive') {\n    const full = path.join(DIST_ROOT, 'api', fileName);\n",
    "\nfunction serveEquipmentRentalPage(req, res, fileName, robots = 'noindex, nofollow, noarchive') {\n    const full = path.join(DIST_ROOT, 'api', fileName);\n"
  ],
  [
    "    if (!fs.existsSync(full)) return sendText(res, 503, 'Equipment rental page not found.');\n    const html = fs.readFileSync(full, 'utf8');\n    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': Buffer.byteLength(html), 'cache-control': 'no-store, max-age=0, must-revalidate', 'pragma': 'no-cache', 'expires': '0', 'x-robots-tag': robots, 'x-photobridge-build': 'v904r100f64', 'x-photobridge-deploy-revision': DEPLOY_REVISION });\n    res.end(html);\n}\n",
    "    if (!fs.existsSync(full)) return sendText(res, 503, 'Equipment rental page not found.');\n    const {body: html, headers: encodingHeaders} = rentalHtmlPayload(req, full);\n    res.writeHead(200, { ...encodingHeaders, 'content-type': 'text/html; charset=utf-8', 'content-length': Buffer.byteLength(html), 'cache-control': 'no-store, max-age=0, must-revalidate', 'pragma': 'no-cache', 'expires': '0', 'x-robots-tag': robots, 'x-photobridge-build': 'v904r100f64', 'x-photobridge-deploy-revision': DEPLOY_REVISION });\n    res.end(req.method === 'HEAD' ? undefined : html);\n}\n"
  ],
  [
    "        const html = isLabDesktopUiAsset ? raw : seoInjectHtml(raw, pathname);\n        res.writeHead(200, { ...common, 'content-length': Buffer.byteLength(html), 'x-robots-tag': seoPrivatePath(pathname) ? 'noindex, nofollow, noarchive' : 'index, follow' });\n        res.end(html);\n        return;\n",
    "        const html = isLabDesktopUiAsset ? raw : seoInjectHtml(raw, pathname);\n        let body = html;\n        const encodingHeaders = {'vary': 'Accept-Encoding'};\n        if (!isLabDesktopUiAsset && acceptsHtmlEncoding(req, 'gzip')) {\n            let cached = indexGzipCache.get(pathname);\n            if (!cached || cached.html !== html) {\n                cached = {html, bytes: zlib.gzipSync(html, {level: 6})};\n                if (indexGzipCache.size >= 64) indexGzipCache.delete(indexGzipCache.keys().next().value);\n                indexGzipCache.set(pathname, cached);\n            }\n            body = cached.bytes;\n            encodingHeaders['content-encoding'] = 'gzip';\n        }\n        res.writeHead(200, { ...common, ...encodingHeaders, 'content-length': Buffer.byteLength(body), 'x-robots-tag': seoPrivatePath(pathname) ? 'noindex, nofollow, noarchive' : 'index, follow' });\n        res.end(req.method === 'HEAD' ? undefined : body);\n        return;\n"
  ],
  [
    "        if (req.method === 'GET' && (url.pathname === '/equipment-rental' || url.pathname === '/equipment-rental/'))\n            return serveEquipmentRentalPage(res, 'equipment-rental-landing.html', 'index, follow');\n        if (req.method === 'GET' && url.pathname === '/equipment-rental/register')\n",
    "        if ((req.method === 'GET' || req.method === 'HEAD') && (url.pathname === '/equipment-rental' || url.pathname === '/equipment-rental/'))\n            return serveEquipmentRentalPage(req, res, 'equipment-rental-landing.html', 'index, follow');\n        if (req.method === 'GET' && url.pathname === '/equipment-rental/register')\n"
  ],
  [
    "        if (req.method === 'GET' && url.pathname === '/equipment-rental/register')\n            return serveEquipmentRentalPage(res, 'equipment-rental-register.html', 'noindex, follow');\n        if (req.method === 'GET' && url.pathname === '/equipment-rental/book')\n",
    "        if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/equipment-rental/register')\n            return serveEquipmentRentalPage(req, res, 'equipment-rental-register.html', 'noindex, follow');\n        if (req.method === 'GET' && url.pathname === '/equipment-rental/book')\n"
  ],
  [
    "        if (req.method === 'GET' && url.pathname === '/equipment-rental/book')\n            return serveEquipmentRentalPage(res, 'equipment-rental-book.html');\n        if (req.method === 'GET' && (/^\\/rental(?:\\/(?:equipment|sales|catalog|bookings|photographers|accounting|sms|subscription|settings))?\\/?$/.test(url.pathname)))\n",
    "        if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/equipment-rental/book')\n            return serveEquipmentRentalPage(req, res, 'equipment-rental-book.html');\n        if (req.method === 'GET' && (/^\\/rental(?:\\/(?:equipment|sales|catalog|bookings|photographers|accounting|sms|subscription|settings))?\\/?$/.test(url.pathname)))\n"
  ],
  [
    "        if (req.method === 'GET' && (/^\\/rental(?:\\/(?:equipment|sales|catalog|bookings|photographers|accounting|sms|subscription|settings))?\\/?$/.test(url.pathname)))\n            return serveEquipmentRentalPage(res, 'equipment-rental-portal.html');\n        return serveWeb(req, res, url.pathname);\n",
    "        if ((req.method === 'GET' || req.method === 'HEAD') && (/^\\/rental(?:\\/(?:equipment|sales|catalog|bookings|photographers|accounting|sms|subscription|settings))?\\/?$/.test(url.pathname)))\n            return serveEquipmentRentalPage(req, res, 'equipment-rental-portal.html');\n        return serveWeb(req, res, url.pathname);\n"
  ]
];
 for(const [before,after] of changes){if(!js.includes(before))throw Error('R1845 compression anchor missing: '+before.slice(0,100));js=js.replaceAll(before,after)}
 fs.writeFileSync(file,js);
}
console.log('R1845: rental HTML encodings and bounded final SEO gzip cache');
