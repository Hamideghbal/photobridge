# R1567: Native Lab UI work reduction

The installed app omits the website-only Site and Windows installer settings
and the installer link in the optional update dialog. Both remain on the website.
The native navigation source schema remains intact so existing 1.0.83/1.0.84
updaters accept the payload; runtime filtering controls the actual menu.

Eight unrelated public gallery, photographer and Store scripts no longer load
in native windows. Promoted headers ignore their own generated mutations and
update disabled/ARIA state only when it changes. Offscreen order cards use CSS
content visibility, with explicit print expansion. Diagnostic status is fetched
when its dialog opens instead of polling SQLite-derived state every ten seconds.
The native sync process, alerts, authentication, mutation transports and business
rules remain responsible for their existing behavior.

Identical concurrent native JSON GETs share one pending transport, keyed by URL,
principal, portal, impersonation and request headers. Every consumer receives an
independent clone. Settled responses are never cached; cancellable/custom reads
bypass coalescing. Writes never join and invalidate pending joins. Thus entering
a tab after a save still performs a fresh read.

## Measurement

Actual complete generated React UI and all scripts, Chromium with 4x CPU
throttling, 1440x950 window, deterministic empty-data API fixtures, 3.5 seconds
per section. This is a controlled desktop-browser simulation, not measurements
on a user's physical Windows computer. The table lists the seven most expensive
RAF sources per page; timings have normal run-to-run noise. The browser fixture
also visits 19 additional route/subtab states and verifies navigation while a
catalog read is deliberately held pending, with delayed API responses.

| Route | Before callbacks | After callbacks | Before callback ms | After callback ms |
|---|---:|---:|---:|---:|
| `/lab/orders` | 259 | 73 | 242 | 150 |
| `/lab/album` | 276 | 82 | 175 | 111 |
| `/lab/archive` | 243 | 61 | 171 | 116 |
| `/lab/finance` | 260 | 97 | 301 | 252 |
| `/lab/settings` | 255 | 76 | 256 | 105 |
| `/lab/settings/customers` | 269 | 66 | 270 | 113 |
| `/lab/settings/prices` | 270 | 81 | 256 | 151 |
| `/lab/settings/local` | 252 | 96 | 239 | 76 |

Across these samples: 2084 → 632 callbacks (70% reduction),
1910 → 1074 ms measured callback work (44% reduction).
Read fixture requests fell 256 → 218;
these include initial page loads and fixture SSE retries, not a production
network throughput benchmark. No page JavaScript errors occurred.

Reproduce with `node scripts/profile-r1567-native.cjs` after building; set
`PB_PROFILE_UI` to a pre-change native payload for the comparison. Focused tests:
`test-r1567-native-requests.cjs` and `test-r1567-native-browser.cjs`.
The existing full native-shell test also verifies alignment, resized views,
customer navigation, delayed API and history using the actual 1.0.83 host.

No new Windows installer or native database migration is required. Physical
low-end Windows and Windows 7 device behavior still needs on-device validation.
