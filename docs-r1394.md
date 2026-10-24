# Collaboration review feedback

The laboratory collaboration review UI previously put the approval POST and the following reload inside one catch. A failed reload therefore reported that the review failed even after the server committed it. The parent callback was also called unconditionally and asynchronous failures were not awaited.

The UI now records the confirmed result locally, preserves other pending requests, awaits optional reload callbacks separately, and distinguishes a committed review from a refresh failure. Actual POST failures retain pending state and display known Persian reasons or the server error code and HTTP status. Business rules, authorization, accounting policy and database schema are unchanged. Website entry cache token changes before the native UI snapshot.

Validation: four generated-client handler tests and five PostgreSQL-compatible PGlite tests against the extracted existing server handler passed. DB fixtures contain the relevant existing migrations, not a production migration. The DB checks cover approval, prepaid membership, cooperation discount, reactivation, rejection, duplicate review, lab isolation and retaining administrative membership. Transform repeatability and generated JavaScript syntax checked.

No production account/database or request logs were accessible. The specific reported server failure has not been confirmed. This fixes a reproduced misleading client error and exposes remaining server errors; it must not be described as a proven fix for an unknown database failure. Full Docker/Liara, live accounts and Windows UI were not tested.
