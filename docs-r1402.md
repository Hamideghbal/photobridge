# R1402 voice messages
Adds microphone recording to photographer ↔ lab chat (not tray quick reply or platform support). Stop, listen, discard, explicitly send. Maximum 120 seconds / 1 MiB. Tracks stop on stop/unmount/errors. Failed upload retains preview. Existing text messages remain supported.

Uses existing chat_messages.attachment_key, no migration. Upload inherits existing authenticated lab/customer route and subscription guards; lab membership is checked first. Server selects sender and conversation identity. Canonical base64, size, MIME allowlist and container signatures validated (not full codec decoding). Authorized chat GET issues five-minute playback tokens for recognized voice keys. Failed DB insertion attempts object cleanup. No real messages sent during tests.

Native integration atop 1.0.29: scripts/integrate-r1402-chat-voice.cjs yields 1.0.30. Only trusted main loopback page can request audio, with explicit dialog. Cameras, remote pages, frames and alert popup denied. Voice requires live response and bypasses offline order queue. R1401 text reply and working Close retained.

Six behavioral tests and 76 native tests pass. Build transform applied twice to existing server/UI fixture; syntax checks pass. Full Liara build, real storage upload/microphone, Windows Electron/NSIS execution untested. Pinned fallback UI is older; deployed web UI and an online update are needed for the new composer.

Draft per AGENTS.md security-sensitive changes and inconclusive full-build conditions. Explicit publication authorization required.
