# R1493 — resume the mobile app's last authenticated portal

The installed mobile PWA starts at `/photographer`, which made a lab or store manager see the photographer login after reopening the app. In standalone mobile mode, this stage remembers only the last successful portal name (`lab`, `photographer`, or `rental`), then validates that portal's existing server session before replacing the start route with that portal's home. It never stores credentials or skips the server's portal authentication. Explicit logout clears the remembered portal, expired sessions remain on login, and ordinary browser/desktop navigation is unchanged.

The stage is embedded in the main web app and store portal shell so successful role sign-ins update the same origin-scoped preference. `scripts/test-r1493-mobile-session-resume.cjs` covers role validation, expiry, logout, PWA-only execution, and the frozen Windows UI hash manifest.
