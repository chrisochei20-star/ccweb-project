# Incremental PostgreSQL migrations

Baseline schema lives in **`../schema.sql`** (applied first by `npm run db:migrate`).

Add forward-only SQL files when you need ordered changes after the baseline:

- **`001_description.sql`**, **`002_...sql`** — sorted lexically (numeric prefixes recommended).

Each file runs in its **own transaction**. Statements must end with `;` outside string literals.
