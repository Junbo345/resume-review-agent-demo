# Resume Review Agent Demo — LLM Context

This document is a compact technical handoff for another LLM or developer. It describes the current repository, with emphasis on the backend and the HR candidate workflow.

## Product purpose

This is an HR resume-review demo. An HR user creates jobs, uploads multiple PDF resumes into a selected job, views extracted candidate data and the original PDF, sends selected candidates to Gemini for evaluation, and manually tracks each candidate's hiring stage.

The application provides evidence and recommendations only. It does not make an automatic hiring decision.

## Repository structure

```text
apps/api/                    Hono + Node backend
  src/app.ts                Existing API routes and PDF upload routes
  src/workflow-routes.ts    New HR workflow routes
  src/database.ts           SQLite schema, migrations, queries, persistence
  src/candidate-extraction.ts PDF extraction and Gemini structured extraction
  src/fit.ts                Candidate-job evaluation logic
  src/provider.ts            Older provider abstraction for the original demo flow
  src/schema.ts              Drizzle schema declarations for the original flow
  src/*test.ts               Backend tests

apps/web/
  src/main.tsx              React/Mantine UI; current entry renders HiringWorkflowApp
  src/styles.css

packages/shared/
  src/index.ts              Shared Zod schemas, TypeScript types, rubric constants

data/
  resume-review.sqlite      Local SQLite database; ignored by Git
  uploads/                  Local uploaded PDFs; ignored by Git
```

## Running locally

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

The web app runs on `http://localhost:5173` in a clean environment. The API runs on `http://localhost:8787`.

Useful checks:

```bash
pnpm lint
pnpm test
pnpm build
```

The current local Gemini test process used a temporary environment and may cause Vite to select port 5174 if port 5173 is already occupied.

## Environment variables

```env
PORT=8787
DATABASE_URL=file:./data/resume-review.sqlite
LLM_PROVIDER=mock
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3-flash-preview
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

`LLM_PROVIDER=mock` is the safe offline default. `LLM_PROVIDER=gemini` enables Gemini PDF extraction and candidate-fit evaluation. API keys must never be committed or placed in frontend code.

## Current HR workflow

```text
Create/select Job
    ↓
Save Job Description and optional Rubric
    ↓
Buffer multiple PDFs in the browser
    ↓
Click Finish and Upload
    ↓
For each PDF: store source file and create Candidate record
    ↓
Extract structured candidate data
    ↓
Candidate starts at ready_for_review
    ↓
HR selects one or more candidates
    ↓
Send JD + optional rubric + selected candidate data to Gemini
    ↓
Validate and save one independent fit review per candidate
    ↓
HR manually updates hiring status
```

There is currently no HR account system, operator identity, or HR notes. Status history records only the status transition and timestamp.

## Job model

A job is a first-class record. One job can contain many candidates. Candidate queries and evaluations must always be scoped to a job.

Current job fields:

```text
id
title
description
status
rubric_version             Existing compatibility field; not used to auto-generate complex rubrics
rubric                     Optional free-text HR evaluation instruction
created_at
updated_at
```

The rubric is intentionally simple. It is not generated automatically. If it is non-empty, Gemini must follow it. If it is empty, Gemini evaluates general fit against the JD.

## Candidate model

Candidate data is attached to a stored document and indirectly belongs to a job through `documents.job_id`.

Candidate fields include:

```text
id
document_id
candidate_name
email
phone
location
summary
structured_data       JSON matching CandidateStructuredData
extraction_status
extraction_error
current_status
status_updated_at
created_at
updated_at
```

Hiring statuses:

```text
uploaded
extracted
ready_for_review
gemini_reviewed
phone_screen
interview
offer
hired
rejected
withdrawn
```

New successfully extracted candidates start at `ready_for_review`. Existing completed candidates are migrated to that status.

## Candidate status history

Table: `candidate_status_history`

```text
id
candidate_id
from_status
to_status
changed_at
```

The initial transition is recorded as `null → ready_for_review`. A later HR transition, for example, is `ready_for_review → interview`.

## Structured extraction

The shared schema is `CandidateStructuredData` in `packages/shared/src/index.ts`:

```text
candidate_name: string | null
email: string | null
phone: string | null
location: string | null
summary: string | null
skills: string[]
education: array of institution, degree, field, dates, details
experience: array of company, title, location, dates, details
projects: array of name, technologies, details
certifications: string[]
additional_information: string[]
```

Gemini output is validated with Zod before saving. TypeScript types are inferred from the Zod schemas.

## PDF handling

PDF upload endpoint:

```text
POST /api/documents/upload
```

Form fields:

```text
job_id
files             one or more PDF files
```

Limits:

```text
maximum 10 PDFs per request
maximum 5 MB per PDF
PDF only
duplicate file hashes are skipped per job
```

When `LLM_PROVIDER=gemini`, the original PDF bytes are sent directly to Gemini as `application/pdf` inline data. The local `pdf-parse` library is skipped, which avoids the previous `BAD XREF ENTRY` problem. Gemini returns structured candidate JSON.

When using the mock provider, local `pdf-parse` is used and the deterministic parser handles text-based PDFs.

PDFs are stored locally under `data/uploads/`. The backend serves them with:

```text
GET /api/documents/:id/pdf
```

## Gemini candidate evaluation

The evaluation endpoint is:

```text
POST /api/reviews/evaluate
```

Request:

```json
{
  "job_id": "job-123",
  "candidate_ids": ["candidate-1", "candidate-2"]
}
```

The backend loads the job and candidates, verifies every candidate belongs to that job, then sends Gemini:

```text
JOB DESCRIPTION
OPTIONAL RUBRIC, only if non-empty
SELECTED CANDIDATE STRUCTURED DATA
```

The prompt rules are:

1. If a rubric is supplied, follow the rubric exactly.
2. If no rubric is supplied, score general fit against the JD.
3. Do not invent candidate information.
4. Do not use protected or personal attributes as evidence.
5. Evidence items must be exact substrings from the candidate's structured data.
6. Return JSON only.

Expected output shape:

```json
{
  "candidate_results": [
    {
      "candidate_id": "candidate-1",
      "score": 82,
      "rationale": "...",
      "evidence": ["exact source text"],
      "strengths": ["..."],
      "gaps": ["..."]
    }
  ]
}
```

The score is a single `0–100` score. There is intentionally no generated multi-category rubric or automatic weighting system in the current design.

The backend validates the JSON using `CandidateEvaluationOutput`, validates candidate IDs and evidence, saves each result separately, and moves successfully evaluated candidates to `gemini_reviewed`.

## Fit review storage

Table: `candidate_fit_reviews`

```text
id
job_id
candidate_id
job_description       Snapshot used for this evaluation
rubric                Snapshot; null when no rubric was supplied
score
rationale
evidence               JSON array
strengths              JSON array
gaps                   JSON array
model_name
prompt_version
created_at
```

Every evaluation creates a new row. Re-evaluation never overwrites the previous result. The frontend displays the newest result by default.

Current prompt version:

```text
candidate-fit-v2
```

## Main API routes

### Jobs

```text
GET    /api/jobs
GET    /api/jobs/:id
POST   /api/jobs
PATCH  /api/jobs/:id
DELETE /api/jobs/:id
```

Job creation accepts `title`, `description`, optional `rubric`, and optional `status`.

### Candidates and documents

```text
GET    /api/candidates?job_id=:jobId
GET    /api/candidates/:id
DELETE /api/documents/:documentId
POST   /api/documents/upload
GET    /api/documents/:id/pdf
```

### Hiring workflow

```text
PATCH  /api/candidates/:id/status
GET    /api/candidates/:id/status-history
```

### Gemini evaluation

```text
POST   /api/reviews/evaluate
GET    /api/candidates/:id/evaluations
```

There are older demo routes in `app.ts` for the original synthetic-candidate workflow. New HR behavior is registered in `workflow-routes.ts` before the older compatible routes.

## Frontend behavior

The current entry point renders `HiringWorkflowApp` in `apps/web/src/main.tsx`.

The HR UI supports:

```text
create/delete job
edit/save optional rubric
buffer multiple PDFs
finish and upload as one batch
show per-file upload results
select candidates
evaluate selected candidates
show latest score
filter by hiring status
change hiring status
delete candidate
view full structured extraction
view latest Gemini evaluation
view status history
view original PDF
```

The frontend API base URL is currently hardcoded to `http://localhost:8787/api`. This must become a `VITE_API_URL` environment variable before Azure deployment.

## Testing status

Current automated coverage includes:

```text
shared schema and evidence tests
deterministic extraction tests
rubric-present evaluation test
no-rubric evaluation test
multi-candidate evaluation test
```

Run:

```bash
pnpm lint
pnpm test
pnpm build
```

The current API test suite has 9 passing tests. A direct SQLite status-history integration test should be added later with a test database strategy that works with the project's Vitest/Node SQLite setup.

## Important limitations and next work

1. SQLite and PDF files are local filesystem storage. They are not yet production-safe Azure persistence.
2. There is no authentication or HR account system.
3. There are no HR operator names or notes by design for the current phase.
4. Gemini quota failures such as HTTP 429 are returned per upload/evaluation request.
5. The frontend API URL is localhost-specific.
6. The Dockerfile currently starts the API; frontend deployment needs separate handling.
7. Azure deployment should use managed secrets, persistent database storage, and blob storage for PDFs.
8. The app presents evidence and recommendations; final hiring decisions remain human decisions.

## Current implementation checkpoints

```text
0964433  database: hiring status and candidate review storage
fd8ac61  job rubric and candidate status APIs
06ebca5  simplified Gemini candidate evaluation
1033258  HR hiring workflow workspace
d8fd3c4  rubric and batch evaluation tests
4356e06  status history, filtering, and candidate deletion UI
```

Do not copy any API key from the runtime environment into this document, Git, frontend code, or issue comments.
