# R1480: installed mobile app icon and OS launch lettering

The public R1479 512px icon was downloaded during diagnosis. Its intended caption band contained zero dark pixels, while local builds rendered the caption. The generator depended on SVG text resolved by host-installed fonts. Replace that dependency with self-contained DejaVu Serif glyph outlines for the exact word PhotoBridge; the Docker builder needs no fonts or network downloads.

Increase emblem width from 67% to 77% of the icon. Compose the caption immediately below it, keep the complete identity inside the adaptive safe circle, and provide explicit any/maskable manifest entries with fresh r1480 filenames. Update Apple touch references and manifest cache version without changing installed PWA identity, scope or entry route. Original aperture/bridge artwork and black color remain.

The first screen in the user's screenshot is Android/Chrome's OS-managed splash; it cannot be removed or arbitrarily rearranged by site CSS. Its new icon will include the larger mark and baked lettering. The approved HTML handoff remains only during actual loading and still releases immediately for ready content. No added delay, additional splash layer, backend or Windows installer change.

Validation: the real generator runs in a subprocess with an empty Fontconfig configuration; both 192px and 512px outputs must contain substantial caption pixels, an enlarged emblem and no dark pixels outside the adaptive safe circle. Manifest cache version, purposes and stable app identity are checked. R1479 handoff tests and final snapshot/freshness/wire-byte/phone stages pass. Actual installed Android metadata refresh/OS rendering is not verified; installed clients may retain previous artwork until their manifest metadata updates.

Outline provenance: DejaVu Serif, /usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf at authoring time; letters PhotoBridge converted with fontTools to SVG paths. No font tooling runs in production. Attribution/license retained in scripts/r1480-wordmark-license.txt.
