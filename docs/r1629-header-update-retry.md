# R1629: preserve customer tabs and make update retry visible

Remove the referral stylesheet's overrides for the customer navigation row. Keep the original promoted header and preserve the single-row invitation fields from R1628. The SMS-credit warning now replaces the existing wallet badge content instead of adding a page-wide banner; clicking the badge keeps the existing wallet navigation.

Native 1.0.89 source adds visible UI-update progress, a single-flight retry loop, explicit offline text, and a styled update-specific retry action. After a failed activation, an explicit manual retry may revalidate the same UI build. Automatic updates still quarantine failed builds, and all manifest, hash and root validation remains mandatory. Tampered UI files cannot be activated. Closing progress does not cancel the check; applying a completed UI still requires confirmation and preserves open-work guards.

Run `scripts/integrate-r1629-update-retry.cjs <native-source-root>` on the existing R1628 native source if integrating separately. Actual main-process/menu/dialog changes require rebuilding with the user's existing signing key; no installer is built here. Website/header changes use the existing UI update package.
