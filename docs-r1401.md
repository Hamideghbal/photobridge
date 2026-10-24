# Native message quick reply and close behavior

Windows 1.0.29 adds a reply form to each incoming photographer chat item in the existing native alert window. The trusted chat collector binds the recipient to that item; renderer IPC supplies only item ID and message. The main process rejects foreign senders, missing/stale items, account changes, empty/overlong text and duplicate sends. It uses the existing authenticated live chat API and the same subscription exemption policy as the host. Offline/queued/unconfirmed answers are never presented as sent. Reply success acknowledges only the original displayed message, preserving later arrivals. Platform chat and orders do not expose a photographer reply field.

Close now hides the alert window without acknowledging its contents. The same pending snapshot does not reopen it; new arrivals do. Hidden-window audio stops, and drafts remain available until successful reply or removal of the message. Alert renderer replies preserve their draft and become retryable after failure, including a concurrent repaint. Settings and reply handlers remain isolated from the main page.

Integrate a 1.0.28 source with `node scripts/integrate-r1401-quick-reply.cjs PATH`. It preserves R1395 storage matching and R1398 cooperation system toasts, and produces source version 1.0.29. Build with BUILD-WINDOWS.cmd on Windows. Website auto-update cannot replace these main-process/preload files.

Validation: 75 native source tests, 5 direct reply/close tests and 2 standalone print chooser tests passed. Bundled UI preparation/hash verification and native bridge verification passed; JS syntax checked. EXE/NSIS, real chat sends, native window controls and Windows visual/notification behavior have not been run here. No production message was sent during development.

This introduces message-sending IPC and is held for explicit publication under AGENTS.md security-sensitive stop conditions.
