# Architecture

The React 19/Vite web app talks to a Hono API over JSON. The API owns ingestion, redaction, provider selection, deterministic score calculation, and persistence boundaries. The demo uses deterministic in-memory fixtures so it runs without a paid service; the package includes Drizzle/SQLite dependencies as the migration path for the documented data model.

The review service is explicit: ingestion → text extraction → sensitive-information redaction → structured fact extraction → rubric evaluation → evidence validation → deterministic weighted score → human review. `MockResumeReviewProvider` is the default provider. An `LlmResumeReviewProvider` extension should implement the same `ReviewOutput` Zod schema and retry once when evidence validation fails. Azure OpenAI can be added behind the same provider interface without exposing credentials to the browser.

The database model is jobs, rubrics, candidates, resume_documents, review_runs, criterion_results, and human_reviews. Uploaded files belong outside static assets, are type/size checked, hashed for duplicates, and never served by public URL. This demo’s route store is intentionally lightweight; production should use Drizzle migrations and PostgreSQL.

The current multi-document extension adds native SQLite tables for `documents`, `candidates`, and `fit_reviews`. PDFs are parsed once, normalized, stored with raw and normalized text, and converted into structured candidate JSON. Fit evaluation queries candidate IDs from SQLite and sends candidate JSON plus the job description to Gemini; the database file itself is never uploaded. A later version can add a candidate-document relationship for cover letters, transcripts, and portfolios.
