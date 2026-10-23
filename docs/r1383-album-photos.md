# R1383 album model and color photos

Cover and package menus now offer a general model photo icon beside the small delete control. Color tiles accept their own raster photo. Customer previews prefer a color photo, then the general model photo. General photos remain separate from color overrides so changing a model photo propagates to colors without overrides.

Images are decoded locally, resized to at most 640px and re-encoded as bounded JPEGs. Server validation limits raster formats/signatures, individual images, image counts and total payload. Color overrides are stored in existing lab-scoped JSON preferences; no schema migration. Existing palette images are migrated into explicit overrides when the catalog is saved. The editor clears derived palette snapshots to prevent deleted overrides reappearing.

The model menu drops rename and availability fields. Color creation stays immediately beside the dropdown. Services use compact rows with name, amount, charging mode and availability.

Validation: 20 editor/image/build tests on fresh pre-R1380 output, plus 12 pricing/menu/service regression tests and one PostgreSQL preference persistence test. Generated server and website bundle syntax checks pass. No full production Docker build or browser visual verification was performed. No production merge/deploy yet.
