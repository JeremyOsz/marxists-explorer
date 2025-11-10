# Marxists Explorer Scraper Utility Plan

## Context

- The existing experimental TypeScript pipeline in `marxists-parser` demonstrates per-author scraping, glossary harvesting, and database loading via modules such as `Author.downloader.ts`, `WorkParser.ts`, `ArticleParser.ts`, and `DataLoader.ts`.[1]
- `marxists-explorer` currently relies on a collection of ad-hoc Python scrapers (for example `scripts/python/scrapers/populate-thinker-works-final-parallel.py`) and manual data grooming to populate `public/data-v2/`.
- Goal: design a consolidated scraper utility that retains the resilience and modularity lessons from `marxists-parser` while integrating cleanly with the Explorer’s data products and deployment workflows.

## Objectives

- Produce a maintainable, resumable scraping pipeline that can regenerate the Explorer dataset on demand.
- Support incremental refreshes for new or updated thinkers without re-scraping the entire archive.
- Provide structured outputs aligned with `public/data-v2/` conventions and upcoming analytics needs.
- Offer operational controls (rate limiting, retries, audit logs) to respect marxists.org resources.

## High-Level Architecture

**1. Source Discovery Layer**

- Fetch canonical indices (`authors.json`, `sections.json`, `periodicals.json`) and HTML indices for category scaffolding.
- Reuse and adapt discovery logic from `Author.downloader.ts` and `IndexParser.ts` for consistent link resolution across author variants.[1]
- Store raw snapshots under `data/source/` with timestamps for reproducibility and diffing.

**2. Works Harvest Layer**

- For each discovered author or subject node, traverse primary work listings and follow nested “by date”, “by topic”, and periodical links.
- Borrow parsing patterns from `WorkParser.ts` and `ArticleParser.ts` to normalize link URLs, titles, and metadata fields.[1]
- Implement configurable concurrency with polite throttling (token bucket with shared rate limiter) and retry-with-backoff semantics already prototyped in `populate-thinker-works-final-parallel.py`.

**3. Content Normalization Layer**

- Map harvested works into the Explorer schema (category → thinker → subject) with deterministic IDs and slug helpers.
- Apply deduplication, canonical title casing, and glossary cross-linking leveraging existing utilities in `lib/data` and `scripts/python/util`.
- Emit intermediate structured bundles (`artifacts/{run_id}/thinkers-bundle.json`) plus per-thinker JSON sharded outputs mirroring `public/data-v2`.

**4. Persistence & Export Layer**

- Write validated outputs to `public/data-v2/` (or a staging mirror) only after schema validation succeeds.
- Generate audit logs (missing works, redirects, dead links) and summary metrics for dashboards in `docs/work-coverage-audit.md`.
- Optionally push denormalized tables to the analytics pipeline defined in `docs/analytics-roadmap.md`.

**5. Orchestration & CLI**

- Provide a composable CLI (Python `typer` or Node `tsx`) with subcommands: `sync-sources`, `harvest-works`, `normalize`, `export`, `audit`.
- Support job manifests (YAML/JSON) for batch operations, enabling CI-driven refreshes and manual re-runs for subsets (e.g., single thinker, category).
- Persist run metadata (start/end time, input hashes, counts) to `artifacts/{run_id}/run.json` for traceability.

## Source Discovery Layer Design

**Responsibilities**

- Mirror the upstream author and subject indices from marxists.org and track upstream deltas.
- Produce a normalized catalogue that downstream layers (works harvesting, glossary linking) can consume without re-fetching raw sources.
- Record provenance (URL, checksum, run metadata) for every resource pulled.

**Primary Data Inputs**

- JSON feeds: `https://www.marxists.org/admin/js/data/authors.json`, `sections.json`, `periodicals.json`.
- HTML indices: `https://www.marxists.org/subject/` and category-specific index pages, plus special cases (e.g., `/archive/lenin/by-date.htm`).
- Optionally, localized index pages if we later extend beyond the main English corpus.

**Outputs**

- `artifacts/{run_id}/sources/raw/{resource}.json|html` — verbatim snapshots.
- `artifacts/{run_id}/sources/catalogue.json` — normalized TypeScript structure:

```ts
export interface SourceCatalogue {
  fetchedAt: string;
  authors: AuthorRecord[];
  sections: SectionRecord[];
  periodicals: PeriodicalRecord[];
  anomalies: DiscoveryAnomaly[];
}
```

- `data/source/latest` symlink (or JSON manifest) pointing to the most recent successful run.
- Diff report (`artifacts/{run_id}/sources/diff.md`) summarizing new, removed, or changed authors since the previous run.

**Module Breakdown (TypeScript)**

- `scripts/scraper/source/config.ts`: constants (URLs, output paths, rate limits).
- `scripts/scraper/source/httpClient.ts`: fetch wrapper with retries, exponential backoff, conditional GET (ETag/Last-Modified) support.
- `scripts/scraper/source/downloaders/*.ts`: specialized fetchers (`authors`, `sections`, `periodicals`, `htmlIndex`).
- `scripts/scraper/source/parsers/*.ts`: schema guards using Zod; HTML parser leveraging `cheerio` for node extraction.
- `scripts/scraper/source/catalogueBuilder.ts`: merges raw feeds into canonical `SourceCatalogue`.
- `scripts/scraper/source/diff.ts`: compares prior catalogue snapshot with current one, producing structured diff plus Markdown summary.
- `scripts/scraper/source/index.ts`: orchestrates the above for CLI invocation (`npm run scraper sync-sources`).

**Storage & Versioning**

- Keep raw downloads immutable; suffix filenames with ISO timestamp and SHA-256 short hash (`authors-2025-11-10T1500Z-6f2a.json`).
- Maintain `artifacts/manifest.json` capturing run order so diffing logic can locate “previous successful run”.
- Integrate with git LFS only if artifact size becomes an issue; otherwise rely on `.gitignore` to keep large blobs out of the repository while preserving run manifests.

**Operational Controls**

- Default rate limit: 1 request/sec with bursts up to 5 in short windows; configurable via env (`MIA_SOURCE_RPS`).
- Backoff strategy: exponential with jitter, max retry window 30s, abort after 5 failures per resource and flag anomaly.
- Automated checksum validation to detect truncated downloads.
- Optionally honor `ETag` headers to skip unchanged resources.

**Testing Strategy**

- Unit tests for each downloader using `nock` fixtures to simulate HTTP responses.
- HTML parser snapshot tests seeded with saved fixtures from `artifacts/fixtures/source-index/*.html`.
- Integration test that runs the full discovery pipeline against fixture URLs and validates `SourceCatalogue` output (ensures schema compatibility).
- Regression diff test ensuring `diff.ts` surfaces additions/removals correctly and handles renamed authors (e.g., alias changes).

**Runbook**

- CLI command: `pnpm tsx scripts/scraper/source/index.ts --out artifacts/{run_id}`.
- Expected runtime: <5 minutes per run under default throttling.
- Failure handling: on fatal error, emit `artifacts/{run_id}/run.log` and exit with non-zero status; previous `latest` pointer remains untouched.
- Success criteria: all required sources fetched, catalogue validated, diff generated, `latest` pointer updated.

**Open Questions / Follow-ups**

- Should we precompute alias mapping in this layer or defer to normalization? **Decision:** compute alias mapping during discovery so downstream stages receive canonical IDs and alias metadata.
- Do we ingest any non-English indices immediately or keep the interface extensible for future locales? **Decision:** scope discovery to the English corpus initially while keeping parsers locale-extensible.
- Confirm storage location for `data/source/` when deployed in automated environments (CI workspace vs. persistent bucket). **Decision:** use the proposed `artifacts/{run_id}` and `data/source/latest` structure; downstream automation can sync these directories to persistent storage if needed.

## Integration With Existing Assets

- Wrap legacy Python scrapers as adapters until their logic is ported into the new modular pipeline.
- Use `marxists-parser` TypeScript modules as reference implementations for HTML parsing, but consolidate shared helpers (URL normalization, text cleanup) in a new `shared/parsers/` package so both Python and TypeScript tools converge on the same rules.[1]
- Align glossary ingestion with `scripts/python/util/build_source_register.py` to keep author identifiers consistent across search, analytics, and zero-work audits.

## Implementation Phases

1. **Foundations**
   - Establish repository structure under `scripts/scraper/` (shared config, logging, rate limiter, persistence utilities).
   - Create data snapshotter for `authors.json` and the reference index HTML; add automated diff reports.
2. **Discovery Pipeline**
   - Port link resolution logic, handling special cases (e.g., Lenin date index) observed in `marxists-parser`.
   - Define canonical author records with alias handling and category mapping.
3. **Works Harvester**
   - Implement per-author crawling with concurrency controls, HTML parsing abstractions, and resilience (retries, failure queues).
   - Integrate on-disk caching of fetched pages (`.cache/{hash}.html`) for offline debugging.
4. **Normalization & Export**
   - Translate harvested records into Explorer schemas; add schema validators (Zod/Pydantic) and transformation tests.
   - Wire outputs into `public/data-v2/` staging; generate coverage reports tied to `docs/work-coverage-audit.md`.
5. **Operationalization**
   - Build CLI entrypoints, run metadata tracking, and scheduled task templates (GitHub Actions / cron scripts).
   - Document end-to-end runbook (setup, execution, recovery) in `docs/`.

## Testing & Quality Gates

- Unit tests for parsers using saved fixtures from `data/source/`.
- Integration tests that run the full pipeline on a limited author subset (e.g., 5 thinkers across categories).
- Regression snapshots comparing previous and current outputs with tolerance rules for expected changes.
- Monitoring hooks (Slack/email) when run metrics or error counts exceed thresholds.

## Future Enhancements

- Add HTML content extraction (e.g., pull quote previews) with respectful throttling.
- Integrate multilingual periodicals once `sections.json` mapping stabilizes.
- Explore opt-in PostgreSQL export mirroring the `DataLoader.ts` pathway for advanced analytics.[1]
- Provide a lightweight web dashboard for run history and diff visualizations.

---

[1]: https://github.com/MarxistsDev/marxists-parser

