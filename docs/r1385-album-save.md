# R1385 album draft/save persistence and wrapping colors

The shared Save button previously saved only the currently selected tab, leaving dirty changes in the other sections unsaved. It now submits every dirty section: the cover/package catalog via its existing endpoint, and services via the existing independent extras endpoint. No API contract or database changes.

Each acknowledged section clears only its own dirty flag. Partial failures preserve remaining drafts and show an explicit message. Queued, malformed or semantically stale server responses cannot claim success or replace edits. Catalog confirmations compare model/color membership and entered prices; extras compare names, prices, charging mode and activity.

Unsaved drafts (including incomplete model/service additions) are stored in sessionStorage with lab+user identity from authenticated /api/auth/me. Refresh/remount restores only the matching account's draft, with an explicit unsaved-draft notice. Server Save remains explicit. Drafts expire after seven days and are removed after acknowledged saves. Storage quota failure is reported; drafts survive refresh in the same tab, not browser-tab closure. An account change detected before save blocks submission of the old draft.

Color tiles wrap within their row on desktop and use another row on smaller displays. The model picker and color creation remain compact; no horizontal color scroller.

Validation: 34 passing tests (16 base editor, 4 image, 6 gallery, 8 save/draft regressions), including actual routed editor restore+Save callbacks, partial failure/retry, zero values, empty/deleted lists, account isolation, and stale-response rejection. Fresh R1380 -> R1383 -> R1384 -> R1385 transforms and generated API/server and website JS syntax checks pass. No browser visual check, full Docker build, or live production writes were performed.

Branch: fix/r1385-album-save-all-wrap. Draft PR: save sequencing now covers multiple tariff sections and therefore warrants review under AGENTS.md data-integrity/billing stop conditions. No production merge/deploy yet.
