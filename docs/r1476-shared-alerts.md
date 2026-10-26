# Shared notification acknowledgment — R1476 / Windows 1.0.36

The alert-window acknowledgment/open IPC now accepts every item currently in the native window. Quick reply still acknowledges only its message; closing without acknowledgment remains unchanged. New arrivals after the click are preserved.

Native order acknowledgments persist an account-scoped receipt outbox before removing pending alerts. Exact IDs are posted to the existing notification read endpoint in batches; failures, queued replies and logout never discard receipts. Polls remove server-read items, including pending IDs outside the latest 200 notifications. Existing server notification read behavior provides browser interoperability.

Chat read cursors are lab-scoped in the existing platform_settings table (no migration). The authenticated lab route validates thread and exact message IDs against chat_messages/platform_chat_messages, ignores own or foreign messages and monotonically advances to the latest selected incoming message time. The browser posts only from its existing visible, focused thread read handler, and imports shared cursors before badge calculations. Native alerts publish the same receipts and filter shared-read pending messages. Existing cached pending chats are enriched from thread history when available.

Deployment: deploy the server/UI PR, then build/publish the 1.0.36 EXE and matching update JSON from the privately supplied source bundle. This native behavior cannot be delivered by a website UI refresh alone. Versions 1.0.34/35 can discover 1.0.36 through the existing updater. Preserve the publisher key.

Validation: 99 native tests including five new batch/offline/restart/cross-client/account cases; three API/UI tests with a query mock; final build snapshot/freshness/wire-byte/phone regressions. PostgreSQL integration, actual browser rendering, Windows packaging and real NSIS upgrades were not run here. Offline cross-device suppression takes effect after synchronization; online native polling is every ten seconds and browser chat polling every five seconds.
