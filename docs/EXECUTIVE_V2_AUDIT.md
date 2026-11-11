# FIELDNOTE v2 — baseline source audit

Read-only audit of source at baseline `4990376dfef1b6890666056bb7e526519d79c784` (package version `1.1.0`). Audit date: 2026-11-12 KST. This audit inspected local source/data and executed data normalization for counts; it did not independently verify external exhibition claims, load external photographs, or test the user's browser records.

## Current structure and publication boundary

- `index.html` loads `src/review.js` and `review.css`, `public-gallery.css`, `field-records.css`, `event-reports.css`.
- `src/review.js` imports `review-state.js`, `field-records.js`, `public-gallery.js`, `event-reports.js` and fetches `review.json`, `review-photos.json`, `catalog.json`, `event-reports.json`.
- Current principal menu: 전시회 종합 보고 / 현장사진 탐색·비교 / 보고서·PDF / 현장 사진 등록. A separate expandable 이전 작업 보관함 exposes 1.0 핵심 검토, 장비·메모, 사진 비교, 기술동향, 확정본·보고, 이전 참고사진 자료실.
- `legacy.html` remains a separately addressable old catalog app loading `src/app.js` + `src/styles.css`.
- `scripts/build.mjs` recompiles both catalog and event reports, deletes/recreates `dist`, then copies **all** `src`, **all** `assets`, both `index.html` and `legacy.html`, and four JSON data files. Merely hiding navigation would leave legacy/private-record functionality distributed. Final v2 build must explicitly exclude removed feature entry points/modules while preserving original source in Git.
- `scripts/compile-event-data.mjs` generates `data/event-reports.json` from `data/exhibitions.json` + `data/research-v1.1/{adex,idex,dsei,saha,eurosatory}.json`. Edit source research files, not only generated JSON. `scripts/compile-data.mjs` generates `data/catalog.json` from old research files.
- GitHub Pages workflow publishes pushes to `main`; CI runs for all pushes/PRs. No new site or live deployment is needed for stage 1.

## Decisions required by the user (planned, not implemented by this audit)

| Existing function / source | Decision | Destination / preservation |
|---|---|---|
| Event selection, event-only case details (`event-reports.js`) | Keep and restructure | 전시장 탐색 / 업체·장비 / 핵심 보고 |
| Photos, credits, source links, dates, variant cautions | Keep | Small, clear evidence near the relevant photograph/claim |
| Search/filter and two-photo comparison (`event-reports.js`, `public-gallery.js`) | Move | Attach to relevant company/equipment/photo screen; not a fourth primary menu |
| Browser print/PDF (`event-reports.js`) | Keep/move | Button in 핵심 보고 and relevant detail views |
| Personal photograph registration/edit/delete/classification + photo backup/restore (`field-records.js`) | Remove from general UI and final deploy | Preserve old module/source via recovery commit; do not clear IndexedDB |
| Personal notes, annotations, task state, snapshots, revision controls + JSON backup/restore (`review.js`, `review-state.js`) | Remove from general UI and final deploy | Preserve old source and raw existing localStorage values; no migration that rewrites them |
| Previous archive routes and `legacy.html` links | Remove from UI and final deploy | Preserve historical source/data in Git, not an admin interface |
| Old progress strip and management/workspace notices | Remove | Progress belongs in status/handoff documents, not executive screens |
| Repeated fact/interpretation/check panels (`review.js`, `public-gallery.js`, `app.js`) | Simplify | Concise strategic direction + review value; retain source/conditions without repeated large panels |
| Previous general/reference image catalog | Preserve as source material, do not represent as current exhibit | Only add to v2 event content after event/edition-specific evidence is verified |
| Old evaluation/settings page and criteria editor (`app.js`) | Remove from final deploy | Preserve historical source and stored custom criteria |

## Browser storage that must remain untouched

1. localStorage key `fieldnote.review.adex2025.v1` (`src/review-state.js`, consumed by `src/review.js`): schemaVersion/application + draft notes, annotations, tasks, comparison, revision and snapshots. Existing code sanitizes on load; v2 should not load then save a reduced version, as that could silently discard old IDs/content.
2. localStorage key `fieldnote.workspace.v1` (`src/app.js`): old workspace notes, comparison selection, custom criteria.
3. IndexedDB database `fieldnote-field-photos-v1`, version 1, store `photos`, keyPath `id` (`src/field-records.js`): original Blob plus metadata (`event`, `year`, `manufacturer`, `product`, `topic`, `note`, `source`, name/type/size/createdAt). Record IDs are SHA-256. It is browser-origin local data and not present in this repository.

No browser storage has been opened or changed in this audit. Preserve origin/public URL. Removing source or UI does not require deleting stored records. Do not call localStorage.clear/removeItem, IndexedDB.deleteDatabase, or migration writes to these old stores.

## Data scope, independently recomputed twice from repository files/code

First pass: raw `data/event-reports.json` counts and generated `coverage`. Second pass: import and execute actual `normalizeEventReports()` and `photoCoverage()` exports.

| Edition | Equipment entries | Displayable photo URLs | Local | External | Distinct linked-only photo pages |
|---|---:|---:|---:|---:|---:|
| Seoul ADEX 2025 | 8 | 7 | 7 | 0 | 5 |
| Eurosatory 2026 | 7 | 22 | 7 | 15 | 0 |
| DSEI 2025 | 4 | 6 | 1 | 5 | 0 |
| IDEX 2025 | 8 | 14 | 14 | 0 | 0 |
| SAHA 2026 | 4 | 0 | 0 | 0 | 5 |
| Total | 31 | 49 | 29 | 20 | 10 |

These are current data-structure counts, **not** independently confirmed exhibit/company counts or verified image load successes. Equipment entries can bundle families and joint exhibitors; do not label 31 as companies. 64 photo metadata records exist across equipment and eventPhotos, but links/duplicate source pages are not 64 visible photos. All 20 external images use provider embedding supported by the app; external load availability was not verified here. SAHA has 9 photo metadata records but no displayable images, only 5 distinct source-page links. ADEX includes one scene/booth photo; K808 has no photo record.

- Event-report manufacturer strings per event: ADEX 4, Eurosatory 5, DSEI 4, IDEX 6, SAHA 4. These strings include joint labels, so they are not normalized enterprise counts.
- Old `data/catalog.json`: 14 equipment / 53 photos / 5 exhibition editions / 10 criteria; photos = 52 reference + 1 IDEX event photo.
- Old `data/review.json`: 3 ADEX cases; `review-photos.json`: 11 photos = 3 ADEX event + 8 reference; `review-photo-observations.json`: 9 structured observations.
- `assets`: 81 images (16 JPG, 65 WebP). SHA-256 byte scan found **no identical files** across those assets. Metadata collections intentionally reuse four old k2pl asset paths across `photos.json` and `review-photos.json`.
- Compiler dedupe key is SHA-256, then src/embedImageUrl/imageUrl/sourceUrl. Runtime dedupe/coverage principally uses image URLs; visual duplicates at different URLs can survive. IDEX code/data flags two similar sequential shots as not recommended for reports. This is not perceptual duplicate detection.
- 20/31 equipment entries have only one `sourceUrls` entry; 9 have two and 2 have three. Multiple URLs do **not** establish independent confirmation; present data has no source-lineage/republication grouping or claim-level independent-review record. Do not mark these claims independently verified solely from URL counts.

## Gaps relevant to the exact next stage (official roster/maps)

- No normalized participant/company registry, official exhibitor roster import, booth numbers, hall-linked coordinate geometry, or map interaction exists. Only an ADEX floor-plan external link is present in `src/review.js`; booth photograph filenames are not floor plans.
- No official floor-plan files were found in the repository. A `newBoothPhotos` key in earlier research represents candidate booth pictures, not map geometry.
- Company identities are free-text manufacturer strings on equipment; subsidiaries/joint exhibitors require evidence-based identity matching before a company-level view.
- Coverage is currently selected equipment cases, largely platforms and major mission systems. It does not establish broad supplier coverage in driveline, braking, cooling, valves, connectors, seals, test and manufacturing categories requested by the user.
- ADEX date strings differ by intended scope: `data/exhibitions.json` says 2025.10.17–24, generated event report says 2025.10.20–24 KINTEX professional days. This is an explicit scope distinction in code, not evidence of an error; official map/roster work should retain venue/day distinctions.
- Existing source URLs, rights fields and photograph verification notes are useful starting evidence but have not been revalidated in this audit.

Stage 2 detailed instructions have not been provided. This audit supplies a factual start point only; it does not invent the stage's detailed schema, acceptance criteria, or research results.
