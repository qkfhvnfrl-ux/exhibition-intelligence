# Data contract v0.1

Write research as a JSON array in data/research/<assignment>.json. Korean prose, public sources only. No private conversations or reports.

Equipment record:
```
{
  "id":"k2", "name":"K2", "manufacturer":"현대로템", "country":"대한민국",
  "category":"전차", "description":"...", "tags":["..."],
  "exhibitions":[{"id":"adex-2025","status":"confirmed|candidate","evidenceUrl":"https://...","note":"실물/목업/자료전시 확인 여부"}],
  "specs":[{"label":"전투중량","value":"...","sourceUrl":"https://...","note":"형상 주의"}],
  "highlights":["..."],
  "analysis":[{"criterion":"layout|mobility|ergonomics|protection|integration|maintenance|modularity|maturity","title":"...","fact":"...","interpretation":"...","unknown":"...","sourceUrls":["https://..."]}],
  "changes":[{"from":"2023","to":"2025","title":"...","detail":"...","status":"verified|insufficient","sourceUrls":["https://..."]}],
  "sources":[{"title":"...","url":"https://...","publisher":"...","kind":"manufacturer|organizer|government|media","date":"YYYY-MM-DD or null","supports":"..."}],
  "photoSearchTerms":["..."], "researchStatus":"reviewed|partial", "limitations":["..."]
}
```

Exhibition ids: eurosatory-2026, dsei-2025, idex-2025, saha-2026, adex-2025.
Category enum: 전차, 장갑차, 화력체계, 방공·대드론, 무인지상체계, 지원·특수차량, 부체계.
Do not equate exhibitor participation with every product being on display. Candidate must remain separate from confirmed counts. Numeric specs only with sources; omit unverified numbers. Aim 6–8 analysis entries per record, each meaningful and specific. Changes require source evidence both editions or explicit lack thereof. Sources reference exact publicly fetched URLs. No copied long prose.

Photo manifest: data/photos.json array of {id,equipmentId,src,sourceUrl,author,license,licenseUrl,caption,angle,context,eventId,variantNote}. src is relative local assets/photos/filename. context reference|event; no false exhibit/date claims. Only openly licensed images may be committed; otherwise retain source links as research leads.
