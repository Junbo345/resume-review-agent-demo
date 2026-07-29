import { afterEach, describe, expect, it } from 'vitest';
import { evaluateCandidates } from './fit';
import type { CandidateRow } from './database';

const candidate = (id: string): CandidateRow => ({
  id,
  job_id: 'job-test',
  document_id: `doc-${id}`,
  candidate_name: id,
  email: null,
  phone: null,
  location: null,
  summary: null,
  structured_data: JSON.stringify({ candidate_name: id, email: null, phone: null, location: null, summary: null, skills: ['Python', 'SQL'], education: [], experience: [], projects: [], certifications: [], additional_information: [] }),
  extraction_status: 'completed',
  extraction_error: null,
  current_status: 'ready_for_review',
  status_updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  original_filename: `${id}.pdf`,
  normalized_text: 'Python SQL',
});

const previousProvider = process.env.LLM_PROVIDER;
afterEach(() => {
  if (previousProvider === undefined) delete process.env.LLM_PROVIDER;
  else process.env.LLM_PROVIDER = previousProvider;
});

describe('candidate fit workflow', () => {
  it('uses the job description when no rubric is supplied', async () => {
    delete process.env.LLM_PROVIDER;
    const output = await evaluateCandidates('Data analyst using Python and SQL', null, [candidate('candidate-no-rubric')]);
    expect(output.result.candidate_results[0]).toMatchObject({ candidate_id: 'candidate-no-rubric', score: 100 });
    expect(output.result.candidate_results[0].rationale).toContain('no rubric');
  });

  it('uses the supplied rubric when one is supplied', async () => {
    delete process.env.LLM_PROVIDER;
    const output = await evaluateCandidates('Data analyst', 'Focus on Python and SQL evidence.', [candidate('candidate-with-rubric')]);
    expect(output.result.candidate_results[0].candidate_id).toBe('candidate-with-rubric');
    expect(output.result.candidate_results[0].rationale).toContain('supplied rubric');
    expect(output.result.candidate_results[0].evidence).toEqual(expect.arrayContaining(['python', 'sql']));
  });

  it('returns one independent result for every selected candidate', async () => {
    delete process.env.LLM_PROVIDER;
    const output = await evaluateCandidates('Python developer', null, [candidate('candidate-1'), candidate('candidate-2')]);
    expect(output.result.candidate_results.map(item => item.candidate_id)).toEqual(['candidate-1', 'candidate-2']);
  });
});
