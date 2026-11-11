# ADEX 2025 independent map review

Reviewed: 2026-11-11 UTC (2026-11-12 KST). Reviewer: stage2_map_review agent; no original files changed.

- Reviewed `data/v2/maps/adex-2025.json`: 32 regions.
- Reopened original `adex2025-map.pdf` and independently checked every recorded drawing index and rectangle against PyMuPDF vector data. All normalized polygon points agree with full-page normalization to within 1e-7, original bounds to within 1e-5 pt. All polygons close correctly.
- Visually checked the full-page rendering, enlarged Hall 9/10 region and enlarged PEI-GENESIS region. All 32 mapped labels and intended rectangles match. ASELSAN excludes the adjacent TE Connectivity rectangle; PEI-GENESIS excludes NeXber and Beaufort. Hall 7/9/10 assignments agree with original hall headings.
- Repeated Hyundai, LIG Nex1 and Hanwha blocks are actually separate repeated rectangles in the source. Shared Hyundai, Hanwha and SNT company labels are printed in their blocks. Their source labels support shared-region links, not an assertion of equivalent legal entities or exact onsite participation of every affiliate.
- Source hash independently computed: `fd0bcbaa88705c683f28b8e2effe94fd749fa12fd654f11287b17025db688dde`; 5,490,107 bytes; one page; 1190.52001953125 × 841.9199829101562 pt; rotation 0; crop box equals full page. JSON metadata agrees. PDF title and embedded timestamps support the stated 2025-10-11 revision basis, but are not an independently issued revision notice.
- Reopened the PEI-Genesis issuer release at https://www.prnewswire.com/apac/news-releases/pei-genesis-to-exhibit-at-seoul-adex-2025-in-korea-302572565.html. Its 2 October 2025 announcement states Booth 18-20, Hall 7. JSON appropriately records this as a single issuer announcement, and does not split the range into three booths. This is planned participation information, not onsite booth-number verification.
- Other 31 regions have no invented official booth number: code null and numberStatus unverified. Internal region IDs must not be displayed as official stand numbers.
- Technical double-check of the same PDF is not independent real-world geometry evidence. Existing `independentGeometryEvidence: false` is correct. Pre-event-plan status and presence-only onsite photo limits must remain.
- Source rights remain unresolved. JSON uses link_only/localPath null and does not claim an open redistribution or embedding licence. No PDF/crops should be committed or embedded without further rights determination.

Result: no geometry, label or numbering mismatch found in the selected 32-region implementation dataset. This is selected implementation coverage, not completion of the whole official map population or onsite/as-built geometry verification.
