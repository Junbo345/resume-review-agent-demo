import { describe, expect, it } from 'vitest';
import { extractCandidateData } from './candidate-extraction';
import { CandidateFitOutput, normalizeExtractedText } from '@rr/shared';

describe('multi-document workflow',()=>{
  it('normalizes common PDF extraction artifacts',()=>expect(normalizeExtractedText('ArƟficial  Intelligence\nSoŌware')).toBe('Artificial  Intelligence\nSoftware'));
  it('extracts structured candidate facts without inventing fields',()=>{const result=extractCandidateData('Ada Lovelace\nada@example.com\nSKILLS\nPython, SQL');expect(result.candidate_name).toBe('Ada Lovelace');expect(result.email).toBe('ada@example.com');expect(result.skills).toContain('Python');expect(result.experience).toEqual([]);});
  it('validates fit output shape',()=>expect(CandidateFitOutput.parse({job_summary:{job_title:null,required_skills:[],preferred_skills:[],key_responsibilities:[],education_requirements:[]},candidate_results:[],ranking:[]}).ranking).toEqual([]));
});
