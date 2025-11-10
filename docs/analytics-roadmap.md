# Analytics Roadmap

Ideas for expanding Marxists Explorer's data visualisations and quantitative insights.

## Near-Term (Existing Catalogue Data)

- **Work Count Cumulative Curve:** Highlight how many thinkers account for 50%, 75%, 90% of indexed works.
- **Category Heatmap:** Cross-reference collections against work-count buckets to identify coverage gaps per movement.
- **Timeline Density:** Parse years embedded in work URLs to generate timelines (works per decade, per thinker, per category).
- **Subject Composition Charts:** Use metadata `subjects` arrays to visualise subject distribution per category and spot missing genres.
- **Coverage Progress Tracker:** Track the number of works and zero-work thinkers over time as imports expand.

## Medium-Term (Derived Enhancements)

- **Topic/Keyword Analysis:** Run TF-IDF or topic modelling on scraped text to surface recurring themes; compare across decades or movements.
- **Collaboration/Influence Graphs:** Detect co-authored pieces and cross-reference with influence relationships extracted from existing metadata.
- **Edition/Format Breakdown:** Classify works by type (speech, essay, pamphlet, etc.) using URL heuristics and subject tags.

## Enrichment via Open Data Sources

- **Biographical Metadata (Wikidata):** Enrich birth/death years, places, occupations for choropleths, lifespan timelines, and life-stage analyses.
- **Publication Metadata (Crossref/OpenAlex):** Attach DOI, publisher, and venue information to support publisher trend visuals.
- **Geographic Spread:** Geocode important events/locations (Wikidata, Wikipedia) to map where works were produced or movements were centred.
- **Citation/Reference Networks:** Use OpenAlex or Crossref to illuminate how often works cite one another or wider literature.

## Implementation Notes

- Start by enhancing `/visualizations` with new D3 charts; reuse existing data loaders to avoid duplicate fetches.
- Add new derived metrics (timeline years, classifications) to preprocessing scripts so charts can read precomputed values.
- Cache external lookups (Wikidata IDs, Crossref metadata) under `data/external/` for reproducibility and rate-limit safety.
- Consider a background job to refresh the thinker-source register and timeline data as new works are added.


