## Vercel Postgres Migration Plan

### 1. Assess Current Data + Traffic
- Inventory all JSON datasets (`data/thinker-source-register.json`, etc.) and identify total rows + update cadence.
- Document every consumer: Next.js pages (`app/visualizations/page.tsx`), visual components, Python ETL scripts.
- Note derived fields and aggregations already present so we can decide whether to recompute or precompute in the DB.
- Capture expected concurrent users and query patterns to size indexes.

### 2. Draft Schema
- Translate JSON structures into relational tables; ensure each entity has a stable primary key (`thinker_id`, `work_id`, etc.).
- Map many-to-many relationships with join tables (e.g., thinkers ↔ sources).
- Define derived columns or views needed for charts (counts per thinker, distributions, etc.).
- Document constraints, indexes, and data types in `docs/schema.md`.

### 3. Choose Tooling
- Select query layer for Next.js (Prisma, Kysely, Drizzle, or `postgres` driver). Prefer Kysely/Drizzle for typed SQL without heavy client.
- Add migration tool (Drizzle kit, Prisma migrate, or `node-pg-migrate`). Plan to store migrations in `drizzle/migrations/` or similar.
- For Python scripts, decide whether to call a REST API or connect via `psycopg` to directly insert/update data.

### 4. Provision Vercel Postgres
- In Vercel dashboard, add a Postgres database (Neon-backed). Note connection string, shadow DB URL (for migrations), and serverless driver URL.
- Configure environment variables in Vercel project (`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc.) and add `.env.local.example`.
- For local dev, install Neon CLI or use the provided connection string.

### 5. Build Migration + Seed Scripts
- Create initial migration representing the drafted schema.
- Write a Node/Python script that:
  - Reads existing JSON files.
  - Normalizes data into table rows.
  - Uses bulk inserts (COPY or batched INSERTs) to seed the database.
- Ensure script can run idempotently for repeatable environments.

### 6. Implement Data Access Layer
- Create `lib/db.ts` (or similar) to encapsulate DB client initialization using the Vercel serverless driver.
- Add repository/query helpers for each data set (counts, distributions).
- Update API routes or server components to fetch via the new layer.
- Gate the new path behind a feature flag/env to allow gradual rollout.

### 7. Validate & Optimize Queries
- Reproduce existing visualizations, comparing results vs JSON baseline.
- Profile slow queries; add indexes or materialized views as needed.
- Consider precomputing heavy aggregations nightly if needed (stored procedures or cron job on GitHub Actions).

### 8. Update Ops & Tooling
- Add DB migration step to CI (lint → test → `pnpm migrate:check`).
- Document local dev workflow (migrate, seed, reset commands).
- Set up backup strategy (Neon point-in-time restore or scheduled dumps).
- Add monitoring/logging for query errors in Next.js.

### 9. Cutover
- Deploy new API routes/pages using Vercel Postgres.
- Run seed script against production DB.
- Run smoke tests in preview deployment to confirm parity.
- Remove JSON data loading paths once confidence is high; keep archive for rollback.

### 10. Post-Migration Tasks
- Update README/docs with DB requirements and setup steps.
- Schedule periodic vacuum/analyze (Neon handles automatically, but note in docs).
- Plan iterative improvements (e.g., add caching layer, incremental ETL).


