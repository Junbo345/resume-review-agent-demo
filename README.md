# ReviewPilot — AI Resume Review Agent demo

ReviewPilot is a polished internal-tool demo for evidence-based resume review. It uses one fictional job, five synthetic resumes, a deterministic mock provider, and a separate human review step. It is not production-compliant and does not make hiring decisions.

## Run locally

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:8787`; `GET /api/health` is the health check. `pnpm test`, `pnpm lint`, `pnpm build`, and `pnpm start` are also available. The default is `LLM_PROVIDER=mock`, so no API key is required. Copy `.env.example` to `.env` to configure `PORT`, `DATABASE_URL`, `OPENAI_API_KEY`, and `OPENAI_MODEL`. OpenAI integration is intentionally behind the provider boundary; Azure OpenAI is the documented extension point.

## Safety and limitations

The application presents evidence, missing qualifications, concerns, and interview questions only. It never displays “Hire” or “Reject,” never scores protected traits, and requires a staff member to record the final human outcome. Resume content is untrusted and prompt injection is flagged. Upload hardening, PDF/DOCX extraction, database persistence, authentication, RBAC, encryption, retention, audit logging, Azure Blob Storage, PostgreSQL, background jobs, Application Insights, bias evaluation, and legal/HR approval remain production work.

## Azure preparation

The app accepts `PORT`, has a health route, and can be containerized with the included Dockerfile. For Azure App Service, build the image, set `PORT`, `LLM_PROVIDER`, and secrets in App Service configuration, and use `/api/health` for health checks. Do not create cloud resources from this repository.

## Sources

All resume content is synthetic. Only the MIT-licensed JSON Resume schema was used as structural inspiration; see `data/sources.md`.

## Job-scoped HR workflow

Jobs are first-class records. The HR workspace requires an active job before uploading resumes; candidate lists, uploads, and fit reviews are filtered by that job. Use **New job** to create another opening. Existing local records are migrated into the original demo job automatically.

## Multi-document candidate workflow

Open **Candidate workspace** to upload up to 10 PDF resumes in one batch. Each file is parsed independently, normalized, SHA-256 hashed, and stored under `data/uploads/`; the SQLite database is created automatically at `data/resume-review.sqlite`. Duplicate hashes are skipped and one failed file does not fail the batch. Candidate records expose structured JSON, source filename, skills, status, and upload time.

Select one or more completed candidates, edit the job title and description, and choose **Evaluate selected candidates with Gemini**. The backend loads candidate records from SQLite, serializes only the selected structured candidate data plus the job description, applies the same fit rubric to every candidate, validates the structured response, stores the fit review, and returns a consistent ranking. The SQLite file and uploads are ignored by Git. To clear local data, stop the API, remove `data/resume-review.sqlite` and the contents of `data/uploads/`, then restart.

The default `LLM_PROVIDER=mock` keeps extraction and fit evaluation offline. For Gemini fit evaluation, set `LLM_PROVIDER=gemini`, `GEMINI_API_KEY`, and `GEMINI_MODEL` in the environment. API keys must never be committed. Uploaded resumes are stored locally and may contain personal information; this demo is not a production privacy system.
