'use strict';
// Same compatibility layer used by the packaged Electron application.
// Test-only entry point; never loaded by the production renderer.
require('../runtime-compat.cjs').install();
