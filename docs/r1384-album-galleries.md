# R1384 album galleries and grouped prices

Cover/package matrix and extra-service prices show Persian thousands separators while retaining raw numeric values for validation and persistence.

Model/color image controls are bounded 30px buttons. Clicking opens a body-portal gallery with existing images before invoking a file picker. The dialog allows multi-add, replacement, deletion, and selecting the primary photo; confirm applies a draft, cancel discards it, and the page Save persists it. Primary color images retain precedence over the model fallback. Focus is trapped/restored and Escape cancels unless image processing is active.

Galleries persist in existing lab-scoped JSON preferences. Existing single images migrate into one-item galleries; empty arrays explicitly preserve photo removal. There is no schema change. Each gallery supports up to 12 images; the existing raster validator enforces image signatures, 200k characters per image and 120 total, with a 3M-character aggregate gallery cap. Images are decoded/resized by the existing client encoder. Avoid duplicating full galleries into legacy model/color fields in request payloads.

Validation: 26 editor/gallery/build tests on fresh pre-R1380 input; 9 pricing regression tests; 4 PostgreSQL menu/service/gallery tests, including actual catalog SQL, per-lab isolation, reload and deletion. 39 passed. Generated API/server and website bundle syntax checks passed. Full production Docker build and browser visual QA were not run.

Dedicated branch: fix/r1384-album-galleries-money. Draft pending review under AGENTS.md image-validation and persistence stop conditions. Not merged or deployed.
