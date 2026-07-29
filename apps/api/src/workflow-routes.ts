import { z } from 'zod';
import type { Hono } from 'hono';
import { getCandidate, getJob, listCandidateStatusHistory, updateCandidateStatus, updateJob } from './database.js';

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
}
