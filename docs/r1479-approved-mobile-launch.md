# R1479: approved mobile launch identity

Implements the approved light launch mockup with a black authentic aperture/bridge mark, serif PhotoBridge caption, small Persian tagline, faint ornament, top-down pale blue wash and indeterminate loading indicator. Reuses the pipeline's authentic mark with identical alpha instead of introducing a generated substitute. CSS/DOM implementation remains responsive and text stays selectable by accessibility APIs.

The web handoff activates only for top-level installed mobile apps. It stays while the root is empty or shows its actual initial loading placeholder, releases immediately for real content (including login/errors) and has a 15-second failsafe. It adds no minimum delay, network request, authentication change or page navigation. Desktop browsers/Windows native shell and embedded panels do not activate it.

Updates the existing PWA manifest icon filenames, light background/theme colors and Apple touch icon. Manifest identity/start URL/scope remain unchanged. The first Android/Chrome OS splash still controls placement and app label; it cannot display arbitrary CSS gradients, progress or the full Persian lockup. Its new icon includes the black mark and PhotoBridge wordmark; the full approved design appears during the HTML handoff. Installed web apps may retain previous OS artwork until the platform refreshes their manifest metadata. No native Windows installer change is needed.

Validation: four meaningful handoff/desktop/iframe/failsafe/alpha/manifest regressions plus final late-build snapshot, freshness, wire-byte and phone checks. Production startup behavior on an actual installed Android app has not been measured here. No backend/database or server-startup changes.
