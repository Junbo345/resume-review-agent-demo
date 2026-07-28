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
