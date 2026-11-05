# Invitation layout and one Windows update action

The photographer invitation address and its name, opening debt, mobile and send controls share one desktop row. Small windows use horizontal scrolling instead of wrapping the controls. Laboratory referral address/copy and mobile/send controls use the same row layout. Existing referral SMS sending, attribution, discounts and wallet behavior are preserved from R1624–R1627.

The Windows source has one tray action, «به‌روزرسانی برنامه». It checks both signed program releases and UI updates. Existing program download/install confirmation, signature checks and retry behavior stay in the program updater. UI-only updates use a styled RTL window with the project font and explicit apply/later choices. Applying the UI waits for open forms and local writes to finish. Repeated clicks share one operation.

Native menu/window changes require the native source to be built and installed; a website UI update cannot replace an installed Electron main process. No installer is built by this change. The source changes are isolated on the native source branch. `scripts/integrate-r1628-unified-updates.cjs <native-source-root>` applies the corresponding source integration and is idempotent.
