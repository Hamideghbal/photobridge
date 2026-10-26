# 1.0.34: in-window program update prompt

When an authenticated startup/login or scheduled check discovers a valid newer release, the app brings its main window forward and shows an owned dialog with Later / Update. Download starts only after Update. The main window/taskbar reports download progress. Once the installer is fully verified, a second owned dialog offers Later / Install and restart. No Windows toast or tray visit is needed. Cached verified installers go straight to the install prompt; a fresh app session can remind the user again after Later. Busy-operation and signature/hash/account guards remain unchanged.

This is native code in 1.0.34. Already installed 1.0.33 clients still use their previous behavior to receive/install 1.0.34; after that, subsequent releases use the new first-screen prompt. Test the new flow using installed 1.0.34 and a published higher version, such as 1.0.35. Publishing the same version cannot trigger an update.

The publisher key is unchanged. The source bundle keeps it outside installer files, as before. Build on Windows and publish EXE + the matching update JSON. Windows NSIS installation and real dialog rendering have not been run here; controller tests exercise automatic owned dialogs and user choices, and the real updater test verifies that declining never downloads installer bytes.
