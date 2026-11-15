# R1862 — private browser storage domain

PhotoBridge can opt into `S3_BROWSER_URL=https://files.photobridge.ir` for browser-facing storage links. Keep `S3_ENDPOINT`, bucket and credentials unchanged. Upload bytes still travel directly to Object Storage; no photo proxy or image conversion was added.

Liara compatibility was measured, not assumed. Direct signatures against the custom hostname return SignatureDoesNotMatch. The qualified mode signs the original virtual-hosted bucket URL, then changes only the browser hostname. The provider proxy validates that original signature. Original object key, encoded query, signature, expiration and bytes remain unchanged. Downloads use virtual signing only while the optional browser alias is enabled; the existing path-style download client remains the default when it is unset. Internal SDK reads, probes and writes remain unchanged.

Evidence:
- https://github.com/Hamideghbal/photobridge/actions/runs/43763305453: private GET and PUT, browser CORS, unsigned/invalid-signature rejection, and a 100 MiB synthetic upload with exact original byte count and SHA-256; all isolated test objects cleaned up.
- Diagnostic branch `diagnose/custom-storage-domain` contains the reproducible qualification and redacted reports. It never reads/deletes customer originals or submits orders.
- Local signing/API tests verify both legacy and custom modes, key/query/TTL preservation, wrong-bucket/path-style/unsigned rejection, invalid alias rejection and non-sensitive health reporting.

Activation:
1. The bucket alias `files.photobridge.ir` and SSL must be active.
2. Add exactly `S3_BROWSER_URL=https://files.photobridge.ir` to the existing Liara PhotoBridge application's environment. Do not replace the storage API endpoint or credentials.
3. Deploy the release through the normal aaa-liara-release Auto Deploy. `/api/health` reports only the validated `storageBrowserHost` hostname; the release check requires it to be `files.photobridge.ir`.
4. With NOD32 enabled, retry the existing failed photo. Previously verified photos keep their IDs and are not uploaded again.

Rollback: unset S3_BROWSER_URL and restart/redeploy. Original endpoint behavior returns; no database or object migration is needed. Keep the domain and SSL while already-issued signed URLs remain valid (existing lifetime: 900 seconds).

No changes to authentication, ownership checks, orders, quantities, prices, invoice calculations, SMS behavior or database schema. This does not add multipart continuation within one file.
