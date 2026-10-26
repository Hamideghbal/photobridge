# R1481: balanced app icon with badge clearance

Reduce the installed-app emblem from 77% to 64% of the canvas, and baked PhotoBridge wordmark from 68% to 58%. Move the lockup above the common lower-right browser-badge area, leaving balanced side padding and greater bottom clearance. Continue using self-contained letter outlines so production fonts cannot remove or reposition the caption.

Use fresh r1481 PNG/manifest/Apple-touch URLs with stable PWA identity, entry URL and any/maskable purposes. Browser/launcher badges and OS splash layout are outside CSS control; this reserves image space rather than claiming to remove those platform elements. Actual OEM badge placement and installed metadata refresh have not been tested.

The user explicitly chose 'حفظ طرح تأییدشده' after being told Android's first system screen cannot be removed by the website. Preserve the approved web handoff, including its existing immediate content-ready release and failsafe. Do not promise a single OS-free startup or remove the approved design.

Validation: pixel-level checks at 192/512px for non-clipped margins, scaled emblem, visible caption and empty lower-right badge zone; stable identity/versioned references and preserved single HTML handoff checks. Earlier fontless generator and R1479 behavior tests plus final late-build snapshot/freshness/wire-byte/phone regressions pass. No backend, data or Windows installer changes.
