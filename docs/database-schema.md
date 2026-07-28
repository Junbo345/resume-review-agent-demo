# Database schema

The demo uses SQLite at `data/resume-review.sqlite`. The schema is created and migrated by `apps/api/src/database.ts` using Node's built-in `node:sqlite` API.

## Domain relationships

```text
jobs 1 ──── many documents 1 ──── 1 candidates
jobs 1 ──── many fit_reviews
```

- A Job is the top-level HR scope.
- Each uploaded PDF Document belongs to one Job.
- Each Document produces one Candidate record.
- Each Fit Review belongs to one Job and stores the selected candidate IDs in its result snapshot.
- Candidate selection for evaluation is validated against the requested `job_id`.

## `jobs`

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | TEXT PK | Job identifier |
| `title` | TEXT | Position title |
| `description` | TEXT | Job description used for evaluation |
| `status` | TEXT | HR lifecycle status, such as `Open` |
| `rubric_version` | TEXT | Evaluation rubric version |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

## `documents`

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | TEXT PK | Document identifier |
| `job_id` | TEXT FK → `jobs.id` | Job owning this resume |
| `original_filename` | TEXT | Browser-provided filename |
| `stored_filename` | TEXT | Safe generated filename |
| `file_path` | TEXT | Local path under `data/uploads/` |
| `file_hash` | TEXT | SHA-256 duplicate key |
| `page_count` | INTEGER | Extracted PDF page count |
| `raw_text` | TEXT | Direct PDF extraction output |
| `normalized_text` | TEXT | Corrected and normalized text |
| `processing_status` | TEXT | Current processing state |
| `processing_error` | TEXT nullable | Error details, if any |
| `created_at` / `updated_at` | TEXT | ISO timestamps |

The original PDF is stored as a local file, not as a SQLite BLOB. Deleting a Document deletes both its database records and its local PDF. A unique index prevents the same file hash from being uploaded twice for the same Job.

## `candidates`

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | TEXT PK | Candidate identifier |
| `document_id` | TEXT UNIQUE FK → `documents.id` | Source resume |
| `candidate_name`, `email`, `phone`, `location` | TEXT nullable | Basic extracted fields |
| `summary` | TEXT nullable | Extracted summary |
| `structured_data` | TEXT JSON | Skills, education, experience, projects, certifications, and additional information |
| `extraction_status` | TEXT | Extraction state |
| `extraction_error` | TEXT nullable | Extraction error details |
| `created_at` / `updated_at` | TEXT | ISO timestamps |

Candidate Job scope is inherited through `candidates.document_id → documents.job_id` rather than duplicated on the Candidate row.

## `fit_reviews`

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | TEXT PK | Fit review identifier |
| `job_id` | TEXT FK → `jobs.id` | Job evaluated |
| `job_title` | TEXT nullable | Job title snapshot |
| `job_description` | TEXT | Job description snapshot |
| `candidate_ids` | TEXT JSON | Candidates included in the review |
| `evaluation_result` | TEXT JSON | Scores, evidence, gaps, recommendations, and ranking |
| `model_name` | TEXT | Provider model used |
| `prompt_version` | TEXT | Prompt/rubric version |
| `created_at` | TEXT | ISO timestamp |

## Compatibility migration

On startup, existing databases are upgraded by:

1. Creating `jobs` if it does not exist.
2. Adding `job_id` to older `documents` and `fit_reviews` tables.
3. Creating the default demo Job from the shared fixture.
4. Assigning legacy documents and reviews to that default Job.

This keeps existing local demo data usable while making all new HR operations Job-scoped.
