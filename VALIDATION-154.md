# Lab 1.0.154 validation

Base: f5801ff7, the complete 1.0.153 source and compatible R1970 UI.

63 focused tests passed under Node 22: update gate, actual Sync/LabStore pending-write preservation, signed update launch and tamper rejection, release on failure, stalled read-only sync, real HTTP host mutation lifecycle after client disconnect, native progress, live sync, local business sync, isolated sync, invoice UI, thermal layout and spool journal, model dialogs and unified UI updates.

Real Chromium checks the exact injected gate function: idle queue, hidden/offscreen dialogs, visible native/React model dialogs and a saving form.

No signature/key/rollback checks are removed. The inherited broader native suite was already not green on the 1.0.152 base (see VALIDATION-153.md); no claim of a completely green legacy suite is made. No physical Windows installer or printer was executed here. The already-installed 1.0.152 binary retains the old gate, so recovering that installation requires one direct run of the newly built installer.
