import { z } from 'zod';
import type { Hono } from 'hono';
import { getCandidate, getCandidates, getJob, listCandidateFitReviews, listCandidateStatusHistory, saveCandidateFitReview, updateCandidateStatus, updateJob } from './database.js';
import { evaluateCandidates, CANDIDATE_FIT_PROMPT_VERSION } from './fit.js';

const hiringStatuses = z.enum(['uploaded', 'extracted', 'ready_for_review', 'gemini_reviewed', 'phone_screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']);

export function registerWorkflowRoutes(app: Hono) {
  app.patch('/api/jobs/:id', async (c) => {
    const current = getJob(c.req.param('id'));
    if (!current) return c.json({ error: { message: 'Job not found' } }, 404);
    const parsed = z.object({ title: z.string().min(1).max(200).optional(), description: z.string().min(20).max(20000).optional(), rubric: z.string().max(20000).nullable().optional(), status: z.string().max(50).optional() }).safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: { message: 'Invalid job update' } }, 400);
    return c.json(updateJob(current.id, parsed.data));
  });

  app.patch('/api/candidates/:id/status', async (c) => {
    const candidate = getCandidate(c.req.param('id'));
    if (!candidate) return c.json({ error: { message: 'Candidate not found' } }, 404);
    const parsed = z.object({ status: hiringStatuses }).safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: { message: `Status must be one of: ${hiringStatuses.options.join(', ')}` } }, 400);
    return c.json(updateCandidateStatus(candidate.id, parsed.data.status));
  });

  app.get('/api/candidates/:id/status-history', (c) => {
    if (!getCandidate(c.req.param('id'))) return c.json({ error: { message: 'Candidate not found' } }, 404);
    return c.json(listCandidateStatusHistory(c.req.param('id')));
  });

  app.post('/api/reviews/evaluate', async (c) => {
    const parsed = z.object({ job_id: z.string().min(1), candidate_ids: z.array(z.string()).min(1).max(10) }).safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: { message: 'job_id and at least one candidate_id are required' } }, 400);
    const selectedJob = getJob(parsed.data.job_id);
    if (!selectedJob) return c.json({ error: { message: 'Job not found' } }, 404);
    const candidates = getCandidates(parsed.data.candidate_ids, parsed.data.job_id);
    if (candidates.length !== parsed.data.candidate_ids.length) return c.json({ error: { message: 'One or more candidate IDs were not found in this job' } }, 404);
    if (candidates.some(candidate => candidate.extraction_status !== 'completed')) return c.json({ error: { message: 'All selected candidates must have completed extraction' } }, 400);
    const evaluated = await evaluateCandidates(selectedJob.description, selectedJob.rubric, candidates);
    const saved = evaluated.result.candidate_results.map(result => saveCandidateFitReview({ jobId:selectedJob.id, candidateId:result.candidate_id, jobDescription:selectedJob.description, rubric:selectedJob.rubric, score:result.score, rationale:result.rationale, evidence:result.evidence, strengths:result.strengths, gaps:result.gaps, modelName:evaluated.model, promptVersion:CANDIDATE_FIT_PROMPT_VERSION }));
    for (const result of evaluated.result.candidate_results) updateCandidateStatus(result.candidate_id, 'gemini_reviewed');
    return c.json({ job_id:selectedJob.id, model_name:evaluated.model, prompt_version:CANDIDATE_FIT_PROMPT_VERSION, candidate_results:evaluated.result.candidate_results, saved_reviews:saved }, 201);
  });

  app.get('/api/candidates/:id/evaluations', (c) => {
    if (!getCandidate(c.req.param('id'))) return c.json({ error: { message: 'Candidate not found' } }, 404);
    return c.json(listCandidateFitReviews(c.req.param('id')).map(review => ({ ...review, evidence:JSON.parse(review.evidence), strengths:JSON.parse(review.strengths), gaps:JSON.parse(review.gaps) })));
  });
}
